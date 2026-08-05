from functools import cmp_to_key
from collections import defaultdict
from sqlalchemy.orm import Session
import database


# Cria o comparador com a hierarquia oficial: Pontos > Confronto Direto > Saldo de Gols > Gols Pró
def criar_comparador(confrontos: dict):
    def comparar_times(a, b):
        if a["pontos"] != b["pontos"]:
            return b["pontos"] - a["pontos"]

        id_a = a["participante_id"]
        id_b = b["participante_id"]

        pts_a_contra_b = confrontos[id_a][id_b]
        pts_b_contra_a = confrontos[id_b][id_a]
        if pts_a_contra_b != pts_b_contra_a:
            return pts_b_contra_a - pts_a_contra_b

        if a["saldo_gols"] != b["saldo_gols"]:
            return b["saldo_gols"] - a["saldo_gols"]

        return b["gols_pro"] - a["gols_pro"]

    return comparar_times


# Atribui o critério oficial que desempata times com a mesma pontuação para exibição no Frontend
def _atribuir_motivos_desempate(tabela_ordenada: list, confrontos: dict, formato: str):
    n = len(tabela_ordenada)
    for i in range(n):
        time = tabela_ordenada[i]
        motivo = None

        vizinhos = []
        if i > 0 and tabela_ordenada[i - 1]["pontos"] == time["pontos"] and time["pontos"] > 0:
            vizinhos.append(tabela_ordenada[i - 1])
        if i < n - 1 and tabela_ordenada[i + 1]["pontos"] == time["pontos"] and time["pontos"] > 0:
            vizinhos.append(tabela_ordenada[i + 1])

        if vizinhos:
            rival = vizinhos[0]
            id_time = time["participante_id"]
            id_rival = rival["participante_id"]

            if confrontos[id_time][id_rival] != confrontos[id_rival][id_time]:
                motivo = "Confronto Direto"
            elif time["saldo_gols"] != rival["saldo_gols"]:
                motivo = "SG (Saldo de Gols)"
            elif time["gols_pro"] != rival["gols_pro"]:
                motivo = "GP (Gols Pró)"
            else:
                motivo = "Sorteio" if formato == "copa" else "Rodada Extra / Sorteio"

        time["motivo_desempate"] = motivo


# Ordena a lista de times aplicando os critérios de desempate e define a posição de cada um
def ordenar_classificacao(tabela_times: list, confrontos: dict, formato: str = "pontos_corridos") -> list:
    if not tabela_times:
        return []

    tabela_ordenada = sorted(
        tabela_times,
        key=cmp_to_key(criar_comparador(confrontos))
    )

    for posicao, time in enumerate(tabela_ordenada, start=1):
        time["posicao"] = posicao

    _atribuir_motivos_desempate(tabela_ordenada, confrontos, formato)
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
        "saldo_gols": 0,
        "motivo_desempate": None
    }


# Processa os placares finalizados e calcula pontos gerais, saldo e pontos de confronto direto
def _processar_partidas(partidas: list, stats: dict) -> dict:
    confrontos = defaultdict(lambda: defaultdict(int))

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
            confrontos[c_id][f_id] += 3
        elif g_fora > g_casa:
            stats[f_id]["pontos"] += 3
            stats[f_id]["vitorias"] += 1
            stats[c_id]["derrotas"] += 1
            confrontos[f_id][c_id] += 3
        else:
            stats[c_id]["pontos"] += 1
            stats[f_id]["pontos"] += 1
            stats[c_id]["empates"] += 1
            stats[f_id]["empates"] += 1
            confrontos[c_id][f_id] += 1
            confrontos[f_id][c_id] += 1

    for time_id in stats:
        stats[time_id]["saldo_gols"] = stats[time_id]["gols_pro"] - stats[time_id]["gols_contra"]

    return confrontos


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
            tabelas_por_grupo[grupo_nome] = ordenar_classificacao(list(stats_grupo.values()), historico, "copa")

        return dict(tabelas_por_grupo)

    stats = {p.id: _inicializar_stats(p) for p in participantes}
    historico = _processar_partidas(partidas_finalizadas, stats)

    return ordenar_classificacao(list(stats.values()), historico, "pontos_corridos")


# Seleciona os classificados da Copa aplicando Cruzamento Olímpico (1º de um grupo vs 2º de outro)
def avancar_classificados_copa(db: Session, torneio_id: str) -> bool:
    tabelas_grupos = calcular_tabela_classificacao(db, torneio_id)
    if not isinstance(tabelas_grupos, dict) or not tabelas_grupos:
        return False

    grupos_ordenados = sorted(tabelas_grupos.keys())
    primeiros = []
    segundos = []
    terceiros_colocados = []

    for nome_grupo in grupos_ordenados:
        tabela = tabelas_grupos[nome_grupo]
        for item in tabela:
            pos = item.get("posicao")
            if pos == 1:
                primeiros.append(item["participante_id"])
            elif pos == 2:
                segundos.append(item["participante_id"])
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

    # Cruzamento olímpico entre 1ºs e 2ºs
    num_grupos = len(primeiros)
    pares_cruzados = []
    for i in range(num_grupos):
        idx_oposto = (i + 1) % num_grupos if num_grupos % 2 == 0 else (num_grupos - 1 - i)
        if i < len(primeiros) and idx_oposto < len(segundos):
            pares_cruzados.extend([primeiros[i], segundos[idx_oposto]])

    total_diretos = len(pares_cruzados)
    base = 4
    while base < total_diretos and base < 32:
        base *= 2

    vagas_faltando = max(0, base - total_diretos)

    terceiros_ordenados = sorted(
        terceiros_colocados,
        key=lambda x: (x["aproveitamento"], x["media_saldo"], x["gols_pro"]),
        reverse=True
    )

    selecionados = pares_cruzados + [t["id"] for t in terceiros_ordenados[:vagas_faltando]]

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


# Determina o vencedor de um jogo eliminatório e avança o time na árvore do torneio mantendo a ordem dos confrontos
def avancar_vencedor_mata_mata(db: Session, partida: database.Partida) -> str:
    time_casa = db.query(database.Participante).filter(database.Participante.id == partida.time_casa_id).first()
    time_fora = db.query(database.Participante).filter(database.Participante.id == partida.time_fora_id).first()

    vencedor_id = None
    perdedor_id = None

    if time_fora and "Acesso Direto" in time_fora.nome_clube:
        vencedor_id = partida.time_casa_id
        perdedor_id = partida.time_fora_id
    elif time_casa and "Acesso Direto" in time_casa.nome_clube:
        vencedor_id = partida.time_fora_id
        perdedor_id = partida.time_casa_id
    else:
        g_casa = partida.gols_casa or 0
        g_fora = partida.gols_fora or 0

        if g_casa > g_fora:
            vencedor_id = partida.time_casa_id
            perdedor_id = partida.time_fora_id
        elif g_fora > g_casa:
            vencedor_id = partida.time_fora_id
            perdedor_id = partida.time_casa_id
        else:
            pen_casa = partida.penaltis_casa or 0
            pen_fora = partida.penaltis_fora or 0
            if pen_casa > pen_fora:
                vencedor_id = partida.time_casa_id
                perdedor_id = partida.time_fora_id
            else:
                vencedor_id = partida.time_fora_id
                perdedor_id = partida.time_casa_id

    if not vencedor_id:
        return "Nenhum vencedor determinado."

    if partida.fase in ["Final", "Terceiro Lugar"]:
        return "Decisão concluída! Campeão ou 3º lugar definido."

    partidas_torneio = db.query(database.Partida).filter(
        database.Partida.torneio_id == partida.torneio_id,
        ~database.Partida.fase.like("%Grupo%")
    ).order_by(database.Partida.id.asc()).all()

    partidas_fase_atual = [p for p in partidas_torneio if p.fase == partida.fase]
    try:
        idx_na_fase = [p.id for p in partidas_fase_atual].index(partida.id)
    except ValueError:
        return "Erro ao localizar a partida na chave atual."

    if partida.fase == "Semifinal":
        jogo_final = next((p for p in partidas_torneio if p.fase == "Final"), None)
        jogo_terceiro = next((p for p in partidas_torneio if p.fase == "Terceiro Lugar"), None)

        if jogo_final:
            if idx_na_fase % 2 == 0:
                jogo_final.time_casa_id = vencedor_id
            else:
                jogo_final.time_fora_id = vencedor_id

        if jogo_terceiro and perdedor_id:
            if idx_na_fase % 2 == 0:
                jogo_terceiro.time_casa_id = perdedor_id
            else:
                jogo_terceiro.time_fora_id = perdedor_id

        db.commit()
        return "Vencedor avançou para a Final e perdedor para a disputa de 3º Lugar!"

    fases_ordem = []
    for p in partidas_torneio:
        if p.fase not in fases_ordem:
            fases_ordem.append(p.fase)

    try:
        idx_fase_atual = fases_ordem.index(partida.fase)
        if idx_fase_atual + 1 >= len(fases_ordem):
            return "Torneio finalizado."
        nome_proxima_fase = fases_ordem[idx_fase_atual + 1]
    except ValueError:
        return "Fase seguinte não encontrada."

    partidas_proxima_fase = [p for p in partidas_torneio if p.fase == nome_proxima_fase]
    idx_destino = idx_na_fase // 2

    if idx_destino < len(partidas_proxima_fase):
        jogo_destino = partidas_proxima_fase[idx_destino]
        if idx_na_fase % 2 == 0:
            jogo_destino.time_casa_id = vencedor_id
        else:
            jogo_destino.time_fora_id = vencedor_id

        db.commit()
        return "Vencedor avançou para a próxima fase!"

    return "Não foi possível alocar o vencedor na próxima fase."