from sqlalchemy.orm import Session
from functools import cmp_to_key
import database

def criar_comparador(historico_confrontos: dict):
    """
    Cria a função de comparação que aplica a hierarquia oficial de desempate:
    1º Pontos -> 2º Confronto Direto -> 3º Saldo de Gols -> 4º Gols Pró
    """
    def comparar_times(a, b):
        # 1. Pontos (maior pontuação fica na frente)
        if a["pontos"] != b["pontos"]:
            return b["pontos"] - a["pontos"]
            
        chave_ab = (a["participante_id"], b["participante_id"])
        chave_ba = (b["participante_id"], a["participante_id"])
        
        if chave_ab in historico_confrontos:
            vencedor_id = historico_confrontos[chave_ab]
            if vencedor_id == a["participante_id"]:
                return -1
            elif vencedor_id == b["participante_id"]:
                return 1
        elif chave_ba in historico_confrontos:
            vencedor_id = historico_confrontos[chave_ba]
            if vencedor_id == a["participante_id"]:
                return -1
            elif vencedor_id == b["participante_id"]:
                return 1

        if a["saldo_gols"] != b["saldo_gols"]:
            return b["saldo_gols"] - a["saldo_gols"]

        return b["gols_pro"] - a["gols_pro"]

    return comparar_times


def ordenar_classificacao(tabela_times: list, historico_confrontos: dict) -> list:
    """
    Ordena a tabela aplicando o comparador de desempates.
    """
    if not tabela_times:
        return []

    tabela_ordenada = sorted(
        tabela_times,
        key=cmp_to_key(criar_comparador(historico_confrontos))
    )
    
    for posicao, time in enumerate(tabela_ordenada, start=1):
        time["posicao"] = posicao

    return tabela_ordenada


def calcular_tabela_classificacao(db: Session, torneio_id: str) -> list:
    """
    Lê os participantes e partidas do banco e gera a tabela completa de classificação.
    """
    participantes = db.query(database.Participante).filter(
        database.Participante.torneio_id == torneio_id
    ).all()
    
    partidas = db.query(database.Partida).filter(
        database.Partida.torneio_id == torneio_id,
        database.Partida.status == "finalizada"
    ).all()

    stats = {}
    for p in participantes:
        stats[p.id] = {
            "participante_id": p.id,
            "nome_clube": p.nome_clube,
            "jogador": p.jogador,
            "escudo_url": p.escudo_url,
            "pontos": 0,
            "jogos": 0,
            "vitorias": 0,
            "empates": 0,
            "derrotas": 0,
            "gols_pro": 0,
            "gols_contra": 0,
            "saldo_gols": 0
        }

    # Mapeia quem venceu o duelo direto entre (Time 1, Time 2) -> ID Vencedor
    historico_confrontos = {}

    for pt in partidas:
        c_id = pt.time_casa_id
        f_id = pt.time_fora_id
        
        if c_id not in stats or f_id not in stats:
            continue

        g_casa = pt.gols_casa or 0
        g_fora = pt.gols_fora or 0

        stats[c_id]["jogos"] += 1
        stats[f_id]["jogos"] += 1
        
        stats[c_id]["gols_pro"] += g_casa
        stats[c_id]["gols_contra"] += g_fora
        stats[f_id]["gols_pro"] += g_fora
        stats[f_id]["gols_contra"] += g_casa

        if g_casa > g_fora:
            stats[c_id]["pontos"] += 3
            stats[c_id]["vitorias"] += 1
            stats[f_id]["derrotas"] += 1
            historico_confrontos[(c_id, f_id)] = c_id
        elif g_fora > g_casa:
            stats[f_id]["pontos"] += 3
            stats[f_id]["vitorias"] += 1
            stats[c_id]["derrotas"] += 1
            historico_confrontos[(c_id, f_id)] = f_id
        else:
            stats[c_id]["pontos"] += 1
            stats[f_id]["pontos"] += 1
            stats[c_id]["empates"] += 1
            stats[f_id]["empates"] += 1
            historico_confrontos[(c_id, f_id)] = None

    for time_id in stats:
        stats[time_id]["saldo_gols"] = stats[time_id]["gols_pro"] - stats[time_id]["gols_contra"]

    return ordenar_classificacao(list(stats.values()), historico_confrontos)


def avancar_vencedor_mata_mata(db: Session, partida: database.Partida) -> str:
    """
    Determina o vencedor de um confronto de mata-mata (incluindo pênaltis e Acesso Direto)
    e registra o avanço para a próxima partida da árvore se ela existir.
    """
    time_casa = db.query(database.Participante).filter(database.Participante.id == partida.time_casa_id).first()
    time_fora = db.query(database.Participante).filter(database.Participante.id == partida.time_fora_id).first()

    vencedor_id = None
    if time_fora and "Acesso Direto" in time_fora.nome_clube:
        vencedor_id = partida.time_casa_id
    elif time_casa and "Acesso Direto" in time_casa.nome_clube:
        vencedor_id = partida.time_fora_id
    else:
        g_casa = partida.gols_casa or 0
        g_fora = partida.gols_fora or 0
        
        if g_casa > g_fora:
            vencedor_id = partida.time_casa_id
        elif g_fora > g_casa:
            vencedor_id = partida.time_fora_id
        else:
            pen_casa = partida.penaltis_casa or 0
            pen_fora = partida.penaltis_fora or 0
            vencedor_id = partida.time_casa_id if pen_casa > pen_fora else partida.time_fora_id

    proxima_partida = db.query(database.Partida).filter(
        database.Partida.torneio_id == partida.torneio_id,
        database.Partida.id > partida.id,
        database.Partida.status == "pendente",
        (database.Partida.time_casa_id == None) | (database.Partida.time_fora_id == None)
    ).first()

    if proxima_partida and vencedor_id:
        if proxima_partida.time_casa_id is None:
            proxima_partida.time_casa_id = vencedor_id
        else:
            proxima_partida.time_fora_id = vencedor_id
        db.commit()
        return "Vencedor avançou para a próxima fase!"
        
    return "Fase final ou próxima partida já preenchida."