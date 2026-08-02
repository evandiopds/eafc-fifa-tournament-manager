import math
import re


# Valida os limites mínimos e máximos de inscritos por modalidade e formato de participação
def validar_quantidade_times(num_jogadores: int, num_times: int, formato: str = "duplas", formato_torneio: str = "mata_mata") -> dict:
    # 1. Regras oficiais de Limite Mínimo por formato do torneio
    if formato_torneio == "copa":
        minimo_jogadores = 6
    elif formato_torneio == "pontos_corridos":
        minimo_jogadores = 3
    else:
        minimo_jogadores = 4

    if num_jogadores < minimo_jogadores:
        return {
            "valido": False,
            "mensagem": f"O formato '{formato_torneio}' exige no mínimo {minimo_jogadores} participantes para fechar o chaveamento corretamente."
        }

    # 2. Regras de Limite Máximo por formato do torneio
    max_times_permitidos = 20 if formato_torneio == "pontos_corridos" else 32
    max_jogadores_solo = max_times_permitidos
    max_jogadores_duplas = max_times_permitidos * 2

    is_solo = formato in ["solo", "1v1"]

    if is_solo and num_jogadores > max_jogadores_solo:
        msg_solo = (
            f"Limite de equipes em Pontos Corridos atingido (máx. {max_times_permitidos}). Para mais jogadores, utilize Mata-Mata/Copa ou opte por Duplas."
            if formato_torneio == "pontos_corridos"
            else f"Limite de equipes Solo atingido (máx. {max_times_permitidos}). Para mais participantes, opte pelo modo Duplas (até 64 jogadores) ou organize duplas externas ao sistema."
        )
        return {"valido": False, "mensagem": msg_solo}

    if not is_solo and num_jogadores > max_jogadores_duplas:
        return {
            "valido": False,
            "mensagem": f"Limite máximo de {max_jogadores_duplas} jogadores (para {max_times_permitidos} duplas) atingido para este formato."
        }

    # 3. Validação matemática de times suficientes para cobrir os jogadores
    times_necessarios = num_jogadores if is_solo else math.ceil(num_jogadores / 2)

    if num_times > max_times_permitidos:
        return {
            "valido": False,
            "mensagem": f"O número de times de futebol selecionados ({num_times}) ultrapassa o limite máximo de {max_times_permitidos} times para este modo."
        }

    if num_times < times_necessarios:
        faltam = times_necessarios - num_times
        return {
            "valido": False,
            "mensagem": f"Times insuficientes. Para {num_jogadores} jogadores no formato '{formato}', você precisa de pelo menos {times_necessarios} times. Faltam {faltam} times."
        }

    return {"valido": True, "mensagem": "Quantidade de times validada com sucesso."}


# Valida o formato e caracteres permitidos para o ID/Nome do torneio
def validar_id_torneio(id_torneio: str) -> dict:
    padrao_seguro = r"^[a-zA-Z0-9_.-]{1,15}$"
    
    if not id_torneio or not re.match(padrao_seguro, id_torneio):
        return {
            "valido": False,
            "mensagem": "ID inválido. Use de 1 a 15 caracteres (apenas letras, números, ponto, hífen ou underline; sem espaços)."
        }
        
    return {
        "valido": True,
        "mensagem": "ID formatado corretamente."
    }


# Valida o tamanho e formato da senha de acesso
def validar_senha_torneio(senha: str) -> dict:
    if not senha or len(senha) < 4 or len(senha) > 8:
        return {
            "valido": False,
            "mensagem": "A senha deve conter entre 4 e 8 caracteres."
        }
        
    if " " in senha:
        return {
            "valido": False,
            "mensagem": "A senha não pode conter espaços em branco."
        }
        
    return {
        "valido": True,
        "mensagem": "Senha validada com sucesso."
    }