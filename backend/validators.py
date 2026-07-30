import math
import re

def validar_quantidade_times(num_jogadores: int, num_times: int, formato: str = "duplas", formato_torneio: str = "mata_mata") -> dict:
    """
    Valida matematicamente se a quantidade de times inscritos é suficiente.
    Permite qualquer número >= 2, deixando o ajuste de chaves ímpares/não-potências para os Byes.
    """
    if num_jogadores < 2:
        return {
            "valido": False,
            "mensagem": "O torneio precisa de pelo menos 2 jogadores para acontecer!"
        }

    if formato in ["solo", "1v1"]:
        times_necessarios = num_jogadores
    else:
        times_necessarios = math.ceil(num_jogadores / 2)
        
    if num_times >= times_necessarios:
        return {"valido": True, "mensagem": "Quantidade de times validada com sucesso."}
    else:
        faltam = times_necessarios - num_times
        return {
            "valido": False, 
            "mensagem": f"Times insuficientes. Para {num_jogadores} jogadores no formato '{formato}', você precisa de pelo menos {times_necessarios} times. Faltam {faltam} times."
        }

def validar_id_torneio(id_torneio: str) -> dict:
    """
    Valida o formato do ID do torneio usando Expressões Regulares (Regex).
    """
    padrao_seguro = r"^[a-zA-Z0-9-]{4,20}$"
    
    if not re.match(padrao_seguro, id_torneio):
        return {
            "valido": False,
            "mensagem": "ID inválido. Utilize apenas letras, números ou hífens (sem espaços), contendo entre 4 e 20 caracteres."
        }
        
    return {
        "valido": True,
        "mensagem": "ID formatado corretamente."
    }

def validar_senha_torneio(senha: str) -> dict:
    """
    Valida se a senha atende aos requisitos mínimos de segurança.
    """
    if not senha or len(senha) < 6:
        return {
            "valido": False,
            "mensagem": "A senha deve conter no mínimo 6 caracteres."
        }
        
    return {
        "valido": True,
        "mensagem": "Senha validada com sucesso."
    }