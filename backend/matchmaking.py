import random

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