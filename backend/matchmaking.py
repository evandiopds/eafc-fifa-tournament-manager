import random
import math

def sortear_duplas(jogadores: list, balanceado: bool = False):
    lista_jogadores = jogadores.copy()
    duplas_formadas = []

    if not balanceado:
        random.shuffle(lista_jogadores)
        for i in range(0, len(lista_jogadores), 2):
            if i + 1 < len(lista_jogadores):
                duplas_formadas.append((lista_jogadores[i], lista_jogadores[i+1]))
            else:
                duplas_formadas.append((lista_jogadores[i], "Sem Dupla (Solo)"))
        return duplas_formadas

    else:
        pote_ouro = [j for j in lista_jogadores if j.get('nivel') == 'Ouro']
        pote_prata = [j for j in lista_jogadores if j.get('nivel') == 'Prata']
        pote_bronze = [j for j in lista_jogadores if j.get('nivel') == 'Bronze']
        
        random.shuffle(pote_ouro)
        random.shuffle(pote_prata)
        random.shuffle(pote_bronze)
        
        if len(lista_jogadores) % 2 != 0:
            if pote_prata:
                jogador_solo = pote_prata.pop()
            elif len(pote_ouro) > len(pote_bronze) and pote_ouro:
                jogador_solo = pote_ouro.pop()
            elif pote_bronze:
                jogador_solo = pote_bronze.pop()
            else:
                jogador_solo = pote_ouro.pop()
                
            duplas_formadas.append((jogador_solo, "Sem Dupla (Solo)"))
        
        while pote_ouro and pote_bronze:
            duplas_formadas.append((pote_ouro.pop(), pote_bronze.pop()))
            
        while pote_ouro and pote_prata:
            duplas_formadas.append((pote_ouro.pop(), pote_prata.pop()))
            
        while pote_prata and pote_bronze:
            duplas_formadas.append((pote_prata.pop(), pote_bronze.pop()))
            
        while len(pote_prata) >= 2:
            duplas_formadas.append((pote_prata.pop(), pote_prata.pop()))
            
        while len(pote_ouro) >= 2:
            duplas_formadas.append((pote_ouro.pop(), pote_ouro.pop()))
            
        while len(pote_bronze) >= 2:
            duplas_formadas.append((pote_bronze.pop(), pote_bronze.pop()))
                
        return duplas_formadas

def sortear_times(participantes: list, times_disponiveis: list) -> list:
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
        # 1. Encontra a maior potência de 2 menor ou igual a total (base principal da chave)
        # Exemplo: Se total=5, base=4 (Semifinal). Se total=8, base=8 (Quartas).
        base = 1
        while base * 2 <= total:
            base *= 2
            
        confrontos = []
        rodadas_arvore = {}
        
        fases_nomes = {
            1: "Final",
            2: "Semifinal",
            4: "Quartas de Final",
            8: "Oitavas de Final",
            16: "16avos de Final"
        }
        
        # CASO A: Número não é potência de 2 (Ex: 5, 6, 7 times -> Requer Play-In)
        if base < total:
            # Quantos jogos de Play-In precisamos para reduzir o total até a 'base'
            num_playin = total - base
            times_playin = num_playin * 2
            
            rodada_playin = []
            for i in range(0, times_playin, 2):
                rodada_playin.append({
                    "fase": "Play-In",
                    "casa": lista[i],
                    "fora": lista[i+1]
                })
            rodadas_arvore["Play-In"] = rodada_playin
            
            # Monta a rodada principal (ex: Semifinal)
            # Quem jogou Play-In entra como "Aguardando" e quem sobrou entra direto!
            fase_base_nome = fases_nomes.get(base // 2, "Eliminatória")
            rodada_base = []
            
            # Slots para os vencedores do Play-In
            for _ in range(num_playin):
                rodada_base.append("Aguardando")
                
            # Slots para quem classificou direto
            for i in range(times_playin, total):
                rodada_base.append(lista[i])
                
            confrontos_fase_base = []
            for i in range(0, len(rodada_base), 2):
                confrontos_fase_base.append({
                    "fase": fase_base_nome,
                    "casa": rodada_base[i],
                    "fora": rodada_base[i+1] if i+1 < len(rodada_base) else "Aguardando"
                })
            rodadas_arvore[fase_base_nome] = confrontos_fase_base
            
            # Gera rodadas futuras (Final, etc.) todas "Aguardando"
            tamanho_futuro = (base // 2) // 2
            while tamanho_futuro >= 1:
                nome_futuro = fases_nomes.get(tamanho_futuro, "Fase Final")
                rodadas_arvore[nome_futuro] = [
                    {"fase": nome_futuro, "casa": "Aguardando", "fora": "Aguardando"}
                    for _ in range(tamanho_futuro)
                ]
                tamanho_futuro //= 2
                
        # CASO B: Potência de 2 perfeita (Ex: 4, 8, 16 times -> Sem Play-In)
        else:
            tamanho_atual = base // 2
            idx_lista = 0
            
            while tamanho_atual >= 1:
                nome_fase = fases_nomes.get(tamanho_atual, "Eliminatória")
                jogos_fase = []
                
                for _ in range(tamanho_atual):
                    if idx_lista < total:
                        jogos_fase.append({
                            "fase": nome_fase,
                            "casa": lista[idx_lista],
                            "fora": lista[idx_lista+1]
                        })
                        idx_lista += 2
                    else:
                        jogos_fase.append({
                            "fase": nome_fase,
                            "casa": "Aguardando",
                            "fora": "Aguardando"
                        })
                rodadas_arvore[nome_fase] = jogos_fase
                tamanho_atual //= 2

        # Junta todas as partidas em ordem cronológica para o banco de dados
        todas_partidas = []
        for chave_fase in rodadas_arvore:
            todas_partidas.extend(rodadas_arvore[chave_fase])

        return {
            "formato": "mata_mata",
            "fase": list(rodadas_arvore.keys())[0],
            "total_participantes": total,
            "arvore": rodadas_arvore,
            "partidas_iniciais": todas_partidas
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