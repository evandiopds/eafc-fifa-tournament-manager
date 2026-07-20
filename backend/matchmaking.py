import random

def sortear_duplas(jogadores: list, balanceado: bool = False):
    """
    Sorteia os jogadores para formar times (duplas cooperativas).
    
    :param jogadores: Lista de dicionários (ex: [{'nome': 'Evandio', 'nivel': 'Ouro'}])
    :param balanceado: Se False, sorteio 100% cego. Se True, equilibra níveis e prioriza Prata solo.
    """
    
    lista_jogadores = jogadores.copy()
    duplas_formadas = []

    if not balanceado:
        # MODO 1: SORTEIO CEGO (100% Aleatório)
        random.shuffle(lista_jogadores)
        
        for i in range(0, len(lista_jogadores), 2):
            if i + 1 < len(lista_jogadores):
                duplas_formadas.append((lista_jogadores[i], lista_jogadores[i+1]))
            else:
                duplas_formadas.append((lista_jogadores[i], "Sem Dupla (Solo)"))
                
        return duplas_formadas

    else:
        # MODO 2: SORTEIO BALANCEADO
        pote_ouro = [j for j in lista_jogadores if j.get('nivel') == 'Ouro']
        pote_prata = [j for j in lista_jogadores if j.get('nivel') == 'Prata']
        pote_bronze = [j for j in lista_jogadores if j.get('nivel') == 'Bronze']
        
        random.shuffle(pote_ouro)
        random.shuffle(pote_prata)
        random.shuffle(pote_bronze)
        
        # Se for ímpar, alguém tem que jogar sozinho. Vamos priorizar o tier Prata.
        if len(lista_jogadores) % 2 != 0:
            if pote_prata:
                jogador_solo = pote_prata.pop() # Tira um Prata da lista
            elif pote_ouro:
                jogador_solo = pote_ouro.pop()  # Se não tiver Prata, vai um Ouro
            else:
                jogador_solo = pote_bronze.pop() # Em último caso, um Bronze
                
            # Guarda esse jogador como solo
            duplas_formadas.append((jogador_solo, "Sem Dupla (Solo)"))
        
        # 1. Tenta juntar o máximo de Ouros com Bronzes
        while pote_ouro and pote_bronze:
            duplas_formadas.append((pote_ouro.pop(), pote_bronze.pop()))
            
        # 2. Junta todo mundo que sobrou 
        # (Como tiramos o solo antes, é garantido que as sobras formam um número par)
        sobras = pote_ouro + pote_prata + pote_bronze
        random.shuffle(sobras)
        
        for i in range(0, len(sobras), 2):
            duplas_formadas.append((sobras[i], sobras[i+1]))
                
        return duplas_formadas