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
    Valida o formato do ID do torneio:
    - Tamanho: 1 a 15 caracteres
    - Permitido: Letras (a-z, A-Z), Números (0-9), Hífen (-), Underline (_) e Ponto (.)
    - Proibido: Espaços em branco e outros símbolos especiais
    """
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

def validar_senha_torneio(senha: str) -> dict:
    """
    Valida a senha do torneio:
    - Tamanho: 4 a 8 caracteres
    - Permitido: Tudo, exceto espaços em branco
    """
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