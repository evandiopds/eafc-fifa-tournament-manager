from functools import cmp_to_key
from collections import defaultdict
from sqlalchemy.orm import Session
import database


# Cria o comparador com a hierarquia oficial: Pontos > Confronto Direto > Saldo de Gols > Gols Pró
def criar_comparador(historico_confrontos: dict):
    def comparar_times(a, b):
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


# Ordena a lista de times aplicando os critérios de desempate e define a posição de cada um
def ordenar_classificacao(tabela_times: list, historico_confrontos: dict) -> list:
    if not tabela_times:
        return []

    tabela_ordenada = sorted(
        tabela_times,
        key=cmp_to_key(criar_comparador(historico_confrontos))
    )
    
    for posicao, time in enumerate(tabela_ordenada, start=1):
        time["posicao"] = posicao

    return tabela_ordenada


# Estrutura inicial de estatísticas para um participante
def _inicializar_stats(p: database.Participante) -> dict:
    return {
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


# Processa os placares finalizados e atualiza pontuações, saldo de gols e confronto direto
def _processar_partidas(partidas: list, stats: dict) -> dict:
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

    return historico_confrontos


# Gera a tabela de classificação (geral para Pontos Corridos ou separada por grupos na Copa)
def calcular_tabela_classificacao(db: Session, torneio_id: str):
    torneio = db.query(database.Torneio).filter(database.Torneio.id == torneio_id).first()
    participantes = db.query(database.Participante).filter(
        database.Participante.torneio_id == torneio_id
    ).all()
    
    partidas_finalizadas = db.query(database.Partida).filter(
        database.Partida.torneio_id == torneio_id,
        database.Partida.status == "finalizada"
    ).all()

    if not torneio or not participantes:
        return []

    if torneio.formato == "copa":
        todas_partidas = db.query(database.Partida).filter(
            database.Partida.torneio_id == torneio_id
        ).all()
        
        mapa_grupos = defaultdict(list)
        time_para_grupo = {}

        for pt in todas_partidas:
            if pt.fase and "Grupo" in pt.fase:
                if pt.time_casa_id and pt.time_casa_id not in time_para_grupo:
                    time_para_grupo[pt.time_casa_id] = pt.fase
                if pt.time_fora_id and pt.time_fora_id not in time_para_grupo:
                    time_para_grupo[pt.time_fora_id] = pt.fase

        for p in participantes:
            grupo_nome = time_para_grupo.get(p.id, "Grupo A")
            mapa_grupos[grupo_nome].append(p)

        tabelas_por_grupo = {}
        for grupo_nome, membros in mapa_grupos.items():
            stats_grupo = {p.id: _inicializar_stats(p) for p in membros}
            partidas_grupo = [pt for pt in partidas_finalizadas if pt.fase == grupo_nome]
            historico = _processar_partidas(partidas_grupo, stats_grupo)
            tabelas_por_grupo[grupo_nome] = ordenar_classificacao(list(stats_grupo.values()), historico)

        return dict(tabelas_por_grupo)

    stats = {p.id: _inicializar_stats(p) for p in participantes}
    historico = _processar_partidas(partidas_finalizadas, stats)
    
    return ordenar_classificacao(list(stats.values()), historico)


# Seleciona os classificados da Fase de Grupos (Top 2 + Melhores 3ºs) e preenche a chave do Mata-Mata
def avancar_classificados_copa(db: Session, torneio_id: str) -> bool:
    tabelas_grupos = calcular_tabela_classificacao(db, torneio_id)
    if not isinstance(tabelas_grupos, dict) or not tabelas_grupos:
        return False

    classificados_diretos = []
    terceiros_colocados = []

    for _, tabela in tabelas_grupos.items():
        for item in tabela:
            pos = item.get("posicao")
            if pos in [1, 2]:
                classificados_diretos.append(item["participante_id"])
            elif pos == 3:
                jogos = item.get("jogos") or 1
                aproveitamento = (item.get("pontos", 0) / (jogos * 3)) * 100
                media_saldo = item.get("saldo_gols", 0) / jogos
                terceiros_colocados.append({
                    "id": item["participante_id"],
                    "aproveitamento": aproveitamento,
                    "media_saldo": media_saldo,
                    "gols_pro": item.get("gols_pro", 0)
                })

    total_classificados_diretos = len(classificados_diretos)
    base = 4
    while base < total_classificados_diretos and base < 32:
        base *= 2
        
    vagas_faltando = max(0, base - total_classificados_diretos)

    terceiros_ordenados = sorted(
        terceiros_colocados,
        key=lambda x: (x["aproveitamento"], x["media_saldo"], x["gols_pro"]),
        reverse=True
    )

    selecionados = classificados_diretos + [t["id"] for t in terceiros_ordenados[:vagas_faltando]]

    partidas_mata_mata = db.query(database.Partida).filter(
        database.Partida.torneio_id == torneio_id,
        ~database.Partida.fase.like("%Grupo%"),
        database.Partida.status == "pendente"
    ).order_by(database.Partida.id.asc()).all()

    idx_time = 0
    for pt in partidas_mata_mata:
        if idx_time < len(selecionados):
            pt.time_casa_id = selecionados[idx_time]
            idx_time += 1
        if idx_time < len(selecionados):
            pt.time_fora_id = selecionados[idx_time]
            idx_time += 1

    db.commit()
    return True


# Determina o vencedor de um jogo eliminatório e avança o time na árvore do torneio
def avancar_vencedor_mata_mata(db: Session, partida: database.Partida) -> str:
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