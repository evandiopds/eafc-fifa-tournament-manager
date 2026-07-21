from validators import validar_id_torneio, validar_senha_torneio
from standings import ordenar_classificacao

# TESTES DE SEGURANÇA (TASK 15 e 16)
def test_validar_id_torneio_sucesso():
    # ID perfeito, sem espaços e com tamanho correto
    resultado = validar_id_torneio("campeonato-fifa-24")
    assert resultado["valido"] is True

def test_validar_id_torneio_falha_caracteres():
    # Falha: Contém espaços e caractere especial (!)
    resultado = validar_id_torneio("Meu Torneio!")
    assert resultado["valido"] is False

def test_validar_senha_torneio():
    assert validar_senha_torneio("senhaForte123")["valido"] is True
    assert validar_senha_torneio("12345")["valido"] is False # Falha: Menos de 6 caracteres

# TESTES DE ORDENAÇÃO DE TABELA (TASK 17)
def test_ordenar_classificacao_criterios():
    tabela_desordenada = [
        {"time": "Time A", "pontos": 10, "saldo_gols": 5, "gols_pro": 12},
        {"time": "Time B", "pontos": 10, "saldo_gols": 8, "gols_pro": 10},
        {"time": "Time C", "pontos": 12, "saldo_gols": 2, "gols_pro": 5}
    ]
    
    resultado = ordenar_classificacao(tabela_desordenada)
    
    # Validação 1: O Time C tem mais pontos (12), deve ser o 1º colocado
    assert resultado[0]["time"] == "Time C"
    assert resultado[0]["posicao"] == 1
    
    # Validação 2: Desempate. Time B e Time A têm 10 pontos, mas o B tem mais Saldo de Gols (8 > 5)
    assert resultado[1]["time"] == "Time B"
    assert resultado[1]["posicao"] == 2
    
    # Validação 3: Time A fica em 3º
    assert resultado[2]["time"] == "Time A"
    assert resultado[2]["posicao"] == 3