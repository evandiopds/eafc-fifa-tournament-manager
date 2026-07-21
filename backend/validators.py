import math
import re

def validar_quantidade_times(num_jogadores: int, num_times: int, formato: str = "dupla") -> dict:
    """
    Valida matematicamente se a quantidade de times inscritos é suficiente.
    
    :param num_jogadores: Total de jogadores inscritos.
    :param num_times: Total de times fornecidos na lista.
    :param formato: "solo" ou "dupla".
    :return: Dicionário com o status da validação e uma mensagem de erro caso falhe.
    """
    
    if formato == "solo":
        # No modo solo, a proporção é 1:1
        times_necessarios = num_jogadores
    else:
        # No modo dupla, a proporção é 2:1
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
    
    :param id_torneio: A string do ID enviada pelo usuário.
    :return: Dicionário com o status de validação e a mensagem de erro/sucesso.
    """
    # Regra: Inicia e termina com letras (maiúsculas/minúsculas), números ou hífens. Tamanho entre 4 e 20.
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