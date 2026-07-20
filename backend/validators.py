import math

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