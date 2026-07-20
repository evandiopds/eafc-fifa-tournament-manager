from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from matchmaking import sortear_duplas, sortear_times
from validators import validar_quantidade_times

app = FastAPI(title="EAFC Tournament Manager API")


# MODELOS DE DADOS (Validam o JSON de entrada)
class Jogador(BaseModel):
    nome: str
    nivel: str  # Esperado: "Ouro", "Prata" ou "Bronze"

class SorteioRequest(BaseModel):
    jogadores: List[Jogador]
    times: List[str]
    balanceado: bool = True


# ROTAS DA API (Endpoints)
@app.post("/api/sorteio/duplas")
def realizar_sorteio_duplas(payload: SorteioRequest):
    """
    Recebe a lista de jogadores e times, valida as regras matemáticas,
    forma as duplas balanceadas e atribui os times aleatoriamente.
    """
    
    # 1. Transformar os objetos do Pydantic em dicionários (formato que nossa função espera)
    lista_jogadores = [{"nome": j.nome, "nivel": j.nivel} for j in payload.jogadores]
    
    # 2. Validar a regra matemática (Task #8)
    validacao = validar_quantidade_times(len(lista_jogadores), len(payload.times), formato="dupla")
    
    if not validacao["valido"]:
        # Se faltarem times, retorna um erro 400 (Bad Request) com a mensagem exata
        raise HTTPException(status_code=400, detail=validacao["mensagem"])
        
    # 3. Executar o motor de Matchmaking (Task #7)
    duplas_formadas = sortear_duplas(lista_jogadores, balanceado=payload.balanceado)
    
    # 4. Atribuir os times aos participantes (Task #10)
    resultado_final = sortear_times(duplas_formadas, payload.times)
    
    # 5. Retornar o JSON de sucesso
    return {
        "status": "sucesso",
        "total_jogadores": len(lista_jogadores),
        "total_times_utilizados": len(resultado_final),
        "sorteio": resultado_final
    }