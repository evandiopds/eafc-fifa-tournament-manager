from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import uuid

from matchmaking import sortear_duplas, sortear_times
from validators import validar_quantidade_times

import database

app = FastAPI(title="EAFC Tournament Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependência para conectar nas tabelas do SQLite/PostgreSQL
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# MODELOS DE DADOS (Pydantic)
class Jogador(BaseModel):
    nome: str
    nivel: str 

class SorteioRequest(BaseModel):
    jogadores: List[Jogador]
    times: List[str]
    balanceado: bool = True

class TorneioCreate(BaseModel):
    nome: str
    formato: str
    senha: str



# ROTAS DA API (Endpoints)
@app.post("/api/sorteio/duplas")
def realizar_sorteio_duplas(payload: SorteioRequest):
    """
    Recebe a lista de jogadores e times, valida as regras matemáticas,
    forma as duplas balanceadas e atribui os times aleatoriamente.
    """
    lista_jogadores = [{"nome": j.nome, "nivel": j.nivel} for j in payload.jogadores]
    
    validacao = validar_quantidade_times(len(lista_jogadores), len(payload.times), formato="dupla")
    
    if not validacao["valido"]:
        raise HTTPException(status_code=400, detail=validacao["mensagem"])
        
    duplas_formadas = sortear_duplas(lista_jogadores, balanceado=payload.balanceado)
    resultado_final = sortear_times(duplas_formadas, payload.times)
    
    return {
        "status": "sucesso",
        "total_jogadores": len(lista_jogadores),
        "total_times_utilizados": len(resultado_final),
        "sorteio": resultado_final
    }

@app.post("/api/torneios", status_code=201)
def criar_torneio(torneio: TorneioCreate, db: Session = Depends(get_db)):
    novo_id = str(uuid.uuid4())
    
    novo_torneio = database.Torneio(
        id=novo_id,
        nome=torneio.nome,
        formato=torneio.formato,
        senha_hash=torneio.senha
    )
    
    db.add(novo_torneio)
    db.commit()
    db.refresh(novo_torneio)
    
    return {
        "mensagem": "Torneio criado com sucesso!", 
        "torneio_id": novo_id
    }