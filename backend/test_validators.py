from validators import validar_quantidade_times

def test_validar_quantidade_par_sucesso():
    # Cenário: 4 jogadores, 2 times (Ideal)
    resultado = validar_quantidade_times(4, 2, "dupla")
    assert resultado["valido"] is True
    assert resultado["mensagem"] == "Quantidade de times validada com sucesso."

def test_validar_impar_falha_times_insuficientes():
    # Cenário: 5 jogadores (precisa de 3 times), enviou apenas 2 (Falha)
    resultado = validar_quantidade_times(5, 2, "dupla")
    assert resultado["valido"] is False
    assert "Faltam 1 times" in resultado["mensagem"]

def test_validar_modo_solo():
    # Cenário: 4 jogadores no modo solo, enviou 3 times (Falha)
    resultado = validar_quantidade_times(4, 3, "solo")
    assert resultado["valido"] is False
    assert "Faltam 1 times" in resultado["mensagem"]