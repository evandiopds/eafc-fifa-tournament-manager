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

from standings import calcular_tabela_classificacao, avancar_vencedor_mata_mata

from typing import Optional

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
    torneio_id: Optional[str] = None
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


def obter_nome_time(item):
    """Extrai o nome do time com segurança, seja ele dict, string ou None."""
    if not item:
        return None
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("time")
    return None


@app.post("/api/sorteio/gerar")
def realizar_sorteio_geral(payload: SorteioRequest, db: Session = Depends(get_db)):
    lista_jogadores = [{"nome": j.nome, "nivel": j.nivel} for j in payload.jogadores]
    
    validacao = validar_quantidade_times(
        len(lista_jogadores), len(payload.times), formato=payload.modo, formato_torneio=payload.formato_torneio
    )
    if not validacao["valido"]:
        raise HTTPException(status_code=400, detail=validacao["mensagem"])
        
    if payload.modo == "solo":
        participantes = [j["nome"] for j in lista_jogadores]
    else:
        participantes = sortear_duplas(lista_jogadores, balanceado=payload.balanceado)
        
    participantes_com_times = sortear_times(participantes, payload.times)
    chaveamento = gerar_chaveamento_aleatorio(participantes_com_times, payload.formato_torneio)

    if payload.torneio_id:
        db.query(database.Partida).filter(database.Partida.torneio_id == payload.torneio_id).delete()
        db.query(database.Participante).filter(database.Participante.torneio_id == payload.torneio_id).delete()
        db.commit()

        mapa_participantes = {}
        for item in participantes_com_times:
            nome_jogador = (
                item["participantes"] 
                if isinstance(item["participantes"], str) 
                else " & ".join([p["nome"] for p in item["participantes"]])
            )
            
            novo_part = database.Participante(
                torneio_id=payload.torneio_id,
                nome_clube=item["time"],
                jogador=nome_jogador,
                sigla=item["time"][:3].upper()
            )
            db.add(novo_part)
            db.commit()
            db.refresh(novo_part)
            
            # Guarda o ID real do banco usando o nome do time como chave
            mapa_participantes[item["time"]] = novo_part.id

        confrontos = (
            chaveamento.get("partidas_iniciais") or 
            chaveamento.get("confrontos") or 
            []
        )
        fase_nome = chaveamento.get("fase", "Fase Inicial")

        for jogo in confrontos:
            nome_casa = obter_nome_time(jogo.get("casa"))
            nome_fora = obter_nome_time(jogo.get("fora") or jogo.get("visitante"))

            nova_partida = database.Partida(
                torneio_id=payload.torneio_id,
                fase=fase_nome,
                time_casa_id=mapa_participantes.get(nome_casa),
                time_fora_id=mapa_participantes.get(nome_fora),
                status="pendente"
            )
            db.add(nova_partida)
        
        db.commit()

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

from standings import calcular_tabela_classificacao, avancar_vencedor_mata_mata

class PlacarRequest(BaseModel):
    torneio_id: str
    formato_torneio: str
    rodada_ou_fase: str
    index_partida: int
    partida_id: Optional[int] = None  
    gols_casa: int
    gols_visitante: int
    penaltis_casa: Optional[int] = None
    penaltis_visitante: Optional[int] = None

@app.post("/api/torneios/placar")
def registrar_placar_partida(payload: PlacarRequest, db: Session = Depends(get_db)):
    """
    Valida e persiste o placar de um jogo no banco SQLite (banco.db).
    Aplica critérios de desempate ou avança o vencedor no Mata-Mata.
    """
    if payload.gols_casa < 0 or payload.gols_visitante < 0:
        raise HTTPException(status_code=400, detail="Gols não podem ser negativos.")

    # Validação de pênaltis para jogos eliminatórios empatados
    if payload.formato_torneio == "mata_mata" and payload.gols_casa == payload.gols_visitante:
        if payload.penaltis_casa is None or payload.penaltis_visitante is None:
            raise HTTPException(status_code=400, detail="Empates em mata-mata exigem decisão por pênaltis!")
        if payload.penaltis_casa == payload.penaltis_visitante:
            raise HTTPException(status_code=400, detail="A disputa de pênaltis não pode terminar empatada!")

    # 1. PERSISTÊNCIA NO BANCO DE DADOS (database.Partida)
    partida = None
    if payload.partida_id:
        partida = db.query(database.Partida).filter(database.Partida.id == payload.partida_id).first()
    else:
        # Busca por torneio e offset caso não envie o ID explícito
        partidas_fase = db.query(database.Partida).filter(
            database.Partida.torneio_id == payload.torneio_id,
            database.Partida.fase == payload.rodada_ou_fase
        ).all()
        if len(partidas_fase) > payload.index_partida:
            partida = partidas_fase[payload.index_partida]

    msg_avanco = None
    if partida:
        partida.gols_casa = payload.gols_casa
        partida.gols_fora = payload.gols_visitante
        partida.penaltis_casa = payload.penaltis_casa
        partida.penaltis_fora = payload.penaltis_visitante
        partida.status = "finalizada"
        db.commit()
        db.refresh(partida)

        # 2. AVANÇO AUTOMÁTICO PARA MATA-MATA
        if payload.formato_torneio == "mata_mata":
            msg_avanco = avancar_vencedor_mata_mata(db, partida)

    # 3. RETORNA CLASSIFICAÇÃO ATUALIZADA (com critérios de desempate)
    tabela_atualizada = []
    if payload.formato_torneio in ["pontos_corridos", "copa"]:
        tabela_atualizada = calcular_tabela_classificacao(db, payload.torneio_id)

    return {
        "status": "sucesso",
        "mensagem": "Placar persistido corretamente no banco de dados!",
        "avanco_mata_mata": msg_avanco,
        "classificacao": tabela_atualizada
    }