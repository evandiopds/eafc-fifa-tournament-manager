from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import uuid

import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from matchmaking import sortear_duplas, sortear_times, gerar_chaveamento_aleatorio
from validators import validar_quantidade_times

import database

async def rotina_limpeza_banco():
    while True:
        db = database.SessionLocal()
        try:
            print("🧹 [Garbage Collector] Verificando torneios inativos...")
            data_limite = datetime.utcnow() - timedelta(days=30)
            
            torneios_vencidos = db.query(database.Torneio).filter(database.Torneio.ultimo_acesso < data_limite).all()
            
            if torneios_vencidos:
                for torneio in torneios_vencidos:
                    db.delete(torneio)
                db.commit()
                print(f"🗑️ [Garbage Collector] {len(torneios_vencidos)} torneio(s) excluído(s).")
            else:
                print("✨ [Garbage Collector] Nenhum torneio inativo encontrado. Tudo limpo!")
                
        except Exception as e:
            print(f"Erro na rotina de limpeza: {e}")
        finally:
            db.close()
            
        await asyncio.sleep(864000) 

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(rotina_limpeza_banco())
    yield
    task.cancel()


app = FastAPI(title="EAFC Tournament Manager API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Jogador(BaseModel):
    nome: str
    nivel: str 

class SorteioRequest(BaseModel):
    jogadores: List[Jogador]
    times: List[str]
    modo: str = "duplas"           
    formato_torneio: str = "mata_mata" 
    balanceado: bool = True

class TorneioCreate(BaseModel):
    nome: str
    formato: str
    senha: str

class TorneioAcesso(BaseModel):
    nome_ou_id: str
    senha: str


@app.post("/api/sorteio/gerar")
def realizar_sorteio_geral(payload: SorteioRequest):
    lista_jogadores = [{"nome": j.nome, "nivel": j.nivel} for j in payload.jogadores]
    
    validacao = validar_quantidade_times(len(lista_jogadores), len(payload.times), formato=payload.modo)
    if not validacao["valido"]:
        raise HTTPException(status_code=400, detail=validacao["mensagem"])
        
    if payload.modo == "solo":
        participantes = [j["nome"] for j in lista_jogadores]
    else:
        participantes = sortear_duplas(lista_jogadores, balanceado=payload.balanceado)
        
    participantes_com_times = sortear_times(participantes, payload.times)
    
    chaveamento = gerar_chaveamento_aleatorio(participantes_com_times, payload.formato_torneio)
    
    return {
        "status": "sucesso",
        "modo": payload.modo,
        "formato_torneio": payload.formato_torneio,
        "total_participantes": len(participantes_com_times),
        "total_times_utilizados": len(participantes_com_times),
        "participantes_com_times": participantes_com_times,
        "chaveamento": chaveamento
    }

@app.post("/api/torneios", status_code=201)
def criar_torneio(torneio: TorneioCreate, db: Session = Depends(get_db)):
    torneio_existente = db.query(database.Torneio).filter(database.Torneio.nome == torneio.nome).first()
    if torneio_existente:
        raise HTTPException(status_code=400, detail="Esse nome de torneio já está em uso! Escolha outro.")

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

@app.post("/api/torneios/acessar")
def acessar_torneio(payload: TorneioAcesso, db: Session = Depends(get_db)):
    torneio = db.query(database.Torneio).filter(
        (database.Torneio.id == payload.nome_ou_id) | (database.Torneio.nome == payload.nome_ou_id)
    ).first()
    
    if not torneio or torneio.senha_hash != payload.senha:
        raise HTTPException(status_code=401, detail="Torneio não encontrado ou senha incorreta.")
        
    torneio.ultimo_acesso = datetime.utcnow()
    db.commit()
    db.refresh(torneio)
    
    return {
        "status": "sucesso",
        "mensagem": "Acesso concedido!",
        "torneio": {
            "id": torneio.id,
            "nome": torneio.nome,
            "formato": torneio.formato,
            "criado_em": torneio.criado_em,
            "ultimo_acesso": torneio.ultimo_acesso
        }
    }