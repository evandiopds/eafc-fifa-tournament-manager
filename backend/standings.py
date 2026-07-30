from sqlalchemy.orm import Session
import database

def ordenar_classificacao(tabela_times: list) -> list:
    """
    Ordena a tabela de classificação baseada nos múltiplos critérios de desempate.
    
    :param tabela_times: Lista de dicionários contendo as estatísticas de cada time[cite: 9].
    :return: Lista ordenada do primeiro ao último colocado[cite: 9].
    """
    if not tabela_times:
        return []

    tabela_ordenada = sorted(
        tabela_times,
        key=lambda time: (
            time.get("pontos", 0),
            time.get("saldo_gols", 0),
            time.get("gols_pro", 0)
        ),
        reverse=True
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

    # Inicializa estatísticas zeradas para cada time
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

    # Processa cada partida finalizada
    for pt in partidas:
        c_id = pt.time_casa_id
        f_id = pt.time_fora_id
        
        # Ignora se o time não estiver mais no dicionário de estatísticas
        if c_id not in stats or f_id not in stats:
            continue

        g_casa = pt.gols_casa or 0
        g_fora = pt.gols_fora or 0

        # Contabiliza Jogos e Gols
        stats[c_id]["jogos"] += 1
        stats[f_id]["jogos"] += 1
        
        stats[c_id]["gols_pro"] += g_casa
        stats[c_id]["gols_contra"] += g_fora
        stats[f_id]["gols_pro"] += g_fora
        stats[f_id]["gols_contra"] += g_casa

        # Distribuição de Pontos, Vitórias, Empates e Derrotas
        if g_casa > g_fora:
            stats[c_id]["pontos"] += 3
            stats[c_id]["vitorias"] += 1
            stats[f_id]["derrotas"] += 1
        elif g_fora > g_casa:
            stats[f_id]["pontos"] += 3
            stats[f_id]["vitorias"] += 1
            stats[c_id]["derrotas"] += 1
        else:
            stats[c_id]["pontos"] += 1
            stats[f_id]["pontos"] += 1
            stats[c_id]["empates"] += 1
            stats[f_id]["empates"] += 1

    # Atualiza o Saldo de Gols
    for time_id in stats:
        stats[time_id]["saldo_gols"] = stats[time_id]["gols_pro"] - stats[time_id]["gols_contra"]

    return ordenar_classificacao(list(stats.values()))


def avancar_vencedor_mata_mata(db: Session, partida: database.Partida) -> str:
    """
    Determina o vencedor de um confronto de mata-mata (incluindo pênaltis) e
    registra o avanço para a próxima partida da árvore se ela existir.
    """
    g_casa = partida.gols_casa or 0
    g_fora = partida.gols_fora or 0
    
    vencedor_id = None
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