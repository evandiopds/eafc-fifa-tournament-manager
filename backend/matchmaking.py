import random
import math

def sortear_duplas(jogadores: list, balanceado: bool = False):
    """
    Sorteia os jogadores para formar times (duplas cooperativas).
    """
    lista_jogadores = jogadores.copy()
    duplas_formadas = []

    if not balanceado:
        # MODO 1: SORTEIO CEGO
        random.shuffle(lista_jogadores)
        for i in range(0, len(lista_jogadores), 2):
            if i + 1 < len(lista_jogadores):
                duplas_formadas.append((lista_jogadores[i], lista_jogadores[i+1]))
            else:
                duplas_formadas.append((lista_jogadores[i], "Sem Dupla (Solo)"))
        return duplas_formadas

    else:
        # MODO 2: SORTEIO BALANCEADO RIGOROSO
        pote_ouro = [j for j in lista_jogadores if j.get('nivel') == 'Ouro']
        pote_prata = [j for j in lista_jogadores if j.get('nivel') == 'Prata']
        pote_bronze = [j for j in lista_jogadores if j.get('nivel') == 'Bronze']
        
        random.shuffle(pote_ouro)
        random.shuffle(pote_prata)
        random.shuffle(pote_bronze)
        
        # Regra do Ímpar
        if len(lista_jogadores) % 2 != 0:
            # 1ª Opção: Prioriza Prata jogando sozinho
            if pote_prata:
                jogador_solo = pote_prata.pop()
            # Exceção: Se número de Ouros supera Bronzes, o Ouro joga solo para evitar Ouro+Ouro
            elif len(pote_ouro) > len(pote_bronze) and pote_ouro:
                jogador_solo = pote_ouro.pop()
            # 2ª Opção: Bronze joga solo
            elif pote_bronze:
                jogador_solo = pote_bronze.pop()
            # Fallback extremo de segurança
            else:
                jogador_solo = pote_ouro.pop()
                
            duplas_formadas.append((jogador_solo, "Sem Dupla (Solo)"))
        
        # Balanceamento de Duplas
        
        # Prioridade I: Ouro + Bronze
        while pote_ouro and pote_bronze:
            duplas_formadas.append((pote_ouro.pop(), pote_bronze.pop()))
            
        # Prioridade Extra/Secundária: Ouro + Prata (Se sobraram Ouros sem Bronzes)
        while pote_ouro and pote_prata:
            duplas_formadas.append((pote_ouro.pop(), pote_prata.pop()))
            
        # Prioridade III: Prata + Bronze (Se sobraram Bronzes sem Ouros)
        while pote_prata and pote_bronze:
            duplas_formadas.append((pote_prata.pop(), pote_bronze.pop()))
            
        # Prioridade II: Prata + Prata (Com os Pratas que restaram)
        while len(pote_prata) >= 2:
            duplas_formadas.append((pote_prata.pop(), pote_prata.pop()))
            
        # Último Caso (Extremo): Ouro + Ouro
        while len(pote_ouro) >= 2:
            duplas_formadas.append((pote_ouro.pop(), pote_ouro.pop()))
            
        # Fallback de segurança para sobras puras de Bronze
        while len(pote_bronze) >= 2:
            duplas_formadas.append((pote_bronze.pop(), pote_bronze.pop()))
                
        return duplas_formadas

def sortear_times(participantes: list, times_disponiveis: list) -> list:
    """
    Atribui aleatoriamente um time para cada participante (dupla ou jogador solo).
    
    :param participantes: Lista contendo as duplas e/ou jogadores solo (saída do sortear_duplas).
    :param times_disponiveis: Lista de strings com os nomes dos times.
    :return: Lista de dicionários vinculando o participante ao time sorteado.
    """
    times_embaralhados = times_disponiveis.copy()
    random.shuffle(times_embaralhados)
    
    times_atribuidos = []

    for participante in participantes:
        time_sorteado = times_embaralhados.pop()
        
        times_atribuidos.append({
            "participantes": participante,
            "time": time_sorteado
        })
        
    return times_atribuidos

def gerar_chaveamento_aleatorio(participantes_com_times: list, formato: str, ida_e_volta: bool = True) -> dict:
    """
    Gera o chaveamento inteligente para Pontos Corridos (Ida e Volta), Mata-Mata ou Copa equilibrada.
    """
    lista = participantes_com_times.copy()
    random.shuffle(lista)
    total = len(lista)
    
    if formato == "pontos_corridos":
        times_tabela = lista.copy()
        if total % 2 != 0:
            times_tabela.append("FOLGA (Bye)")
            
        num_times = len(times_tabela)
        total_rodadas = num_times - 1
        metade = num_times // 2
        
        rodadas_ida = []
        
        for r in range(total_rodadas):
            confrontos_rodada = []
            for i in range(metade):
                casa = times_tabela[i]
                fora = times_tabela[num_times - 1 - i]
                
                if casa != "FOLGA (Bye)" and fora != "FOLGA (Bye)":
                    confrontos_rodada.append({
                        "rodada": r + 1,
                        "turno": "Ida",
                        "casa": casa,
                        "fora": fora
                    })
            rodadas_ida.extend(confrontos_rodada)
            
            times_tabela = [times_tabela[0]] + [times_tabela[-1]] + times_tabela[1:-1]
            
        confrontos_totais = rodadas_ida.copy()
        
        if ida_e_volta:
            for jogo in rodadas_ida:
                confrontos_totais.append({
                    "rodada": jogo["rodada"] + total_rodadas,
                    "turno": "Volta",
                    "casa": jogo["fora"],
                    "fora": jogo["casa"]
                })
                
        return {
            "formato": "pontos_corridos",
            "ida_e_volta": ida_e_volta,
            "total_rodadas": (total_rodadas * 2) if ida_e_volta else total_rodadas,
            "tabela": confrontos_totais
        }

    elif formato == "mata_mata":
        confrontos = []
        for i in range(0, total - 1, 2):
            confrontos.append({
                "fase": "Eliminatória",
                "casa": lista[i],
                "fora": lista[i+1]
            })
        if total % 2 != 0:
            confrontos.append({
                "fase": "Eliminatória",
                "casa": lista[-1],
                "fora": "AVANÇA DIRETO (Bye)"
            })
        return {
            "formato": "mata_mata",
            "partidas_iniciais": confrontos
        }

    elif formato == "copa":
        num_grupos = max(1, math.ceil(total / 4))
        letras = ["A", "B", "C", "D", "E", "F", "G", "H"]
        
        grupos = {}
        for i in range(num_grupos):
            nome_grupo = f"Grupo {letras[i]}" if i < len(letras) else f"Grupo {i+1}"
            grupos[nome_grupo] = []
            
        for idx, participante in enumerate(lista):
            idx_grupo = idx % num_grupos
            nome_grupo = f"Grupo {letras[idx_grupo]}" if idx_grupo < len(letras) else f"Grupo {idx_grupo+1}"
            grupos[nome_grupo].append(participante)
            
        return {
            "formato": "copa",
            "total_grupos": num_grupos,
            "grupos": grupos
        }

    return {"formato": formato, "erro": "Formato desconhecido"}