def gerar_pontos_corridos(times_sorteados: list, turno_duplo: bool = False) -> dict:
    """
    Gera as rodadas de um torneio de pontos corridos usando o Algoritmo do Círculo.
    
    :param times_sorteados: Lista de dicionários com os times e participantes.
    :param turno_duplo: Se True, gera jogos de ida e volta. Se False, apenas ida.
    :return: Dicionário contendo as rodadas e os confrontos de cada uma.
    """
    if not times_sorteados:
        return {}

    # Fazemos uma cópia para não alterar a lista original
    times = times_sorteados.copy()
    
    # Tratamento para número ímpar
    if len(times) % 2 != 0:
        times.append({"participantes": None, "time": "Folga"})

    num_times = len(times)
    total_rodadas = num_times - 1
    metade = num_times // 2
    
    tabela = {}

    # GERANDO O 1º TURNO (IDA)
    for rodada in range(total_rodadas):
        confrontos_rodada = []
        
        for i in range(metade):
            casa = times[i]
            visitante = times[num_times - 1 - i]
            
            if casa["time"] != "Folga" and visitante["time"] != "Folga":
                confrontos_rodada.append({
                    "casa": casa["time"],
                    "visitante": visitante["time"]
                })
        
        tabela[f"Rodada {rodada + 1}"] = confrontos_rodada
        times.insert(1, times.pop())

    # GERANDO O 2º TURNO (VOLTA)
    if turno_duplo:
        tabela_retorno = {}
        for nome_rodada, confrontos in tabela.items():
            # Descobre o número da rodada atual e soma com o total do 1º turno
            numero_rodada_atual = int(nome_rodada.split()[1])
            nova_rodada = numero_rodada_atual + total_rodadas
            
            confrontos_retorno = []
            for jogo in confrontos:
                # O Pulo do Gato: Inverte quem joga em casa e quem é visitante
                confrontos_retorno.append({
                    "casa": jogo["visitante"],
                    "visitante": jogo["casa"]
                })
            
            tabela_retorno[f"Rodada {nova_rodada}"] = confrontos_retorno
        
        # Junta o segundo turno no dicionário principal
        tabela.update(tabela_retorno)

    return tabela