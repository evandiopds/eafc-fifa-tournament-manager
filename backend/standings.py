def ordenar_classificacao(tabela_times: list) -> list:
    """
    Ordena a tabela de classificação baseada nos múltiplos critérios de desempate.
    
    :param tabela_times: Lista de dicionários contendo as estatísticas de cada time.
    :return: Lista ordenada do primeiro ao último colocado.
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