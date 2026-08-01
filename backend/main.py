import asyncio
import uuid
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import List, Optional
from collections import defaultdict

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

import database
from matchmaking import sortear_duplas, sortear_times, gerar_chaveamento_aleatorio
from validators import validar_quantidade_times, validar_id_torneio, validar_senha_torneio
from standings import calcular_tabela_classificacao, avancar_vencedor_mata_mata


# Rotina em segundo plano para excluir torneios inativos há mais de 30 dias
async def rotina_limpeza_banco():
    while True:
        db = database.SessionLocal()
        try:
            data_limite = datetime.utcnow() - timedelta(days=30)
            torneios_vencidos = db.query(database.Torneio).filter(
                database.Torneio.ultimo_acesso < data_limite
            ).all()
            
            for torneio in torneios_vencidos:
                db.delete(torneio)
            if torneios_vencidos:
                db.commit()
        except Exception as e:
            print(f"Erro na limpeza do banco: {e}")
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
    manual: bool = False


class TorneioCreate(BaseModel):
    nome: str
    formato: str
    senha: str


class TorneioAcesso(BaseModel):
    nome_ou_id: str
    senha: str


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


def obter_nome_time(item):
    if not item:
        return None
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("time")
    return None


# Reconstrói a estrutura de chaveamento e classificação a partir do banco de dados
def montar_dados_torneio(db: Session, torneio: database.Torneio):
    participantes_db = db.query(database.Participante).filter(
        database.Participante.torneio_id == torneio.id
    ).all()
    partidas_db = db.query(database.Partida).filter(
        database.Partida.torneio_id == torneio.id
    ).all()

    if not partidas_db or not participantes_db:
        return None

    mapa_participantes = {
        p.id: {
            "id": p.id,
            "time": p.nome_clube,
            "participantes": p.jogador,
            "sigla": p.sigla,
            "escudo_url": p.escudo_url
        }
        for p in participantes_db
    }

    partidas_formatadas = []
    for p in partidas_db:
        partida_obj = {
            "id": p.id,
            "fase": p.fase,
            "casa": mapa_participantes.get(p.time_casa_id, "Aguardando"),
            "fora": mapa_participantes.get(p.time_fora_id, "Aguardando"),
            "gols_casa": p.gols_casa,
            "gols_visitante": p.gols_fora,
            "penaltis_casa": p.penaltis_casa,
            "penaltis_visitante": p.penaltis_fora,
            "status": p.status
        }

        if p.fase and "Rodada" in p.fase:
            try:
                partida_obj["rodada"] = int(p.fase.split(" ")[1])
            except (IndexError, ValueError):
                partida_obj["rodada"] = 1

        partidas_formatadas.append(partida_obj)

    chaveamento_reconstruido = {
        "fase": "Em Andamento",
        "partidas_iniciais": partidas_formatadas,
        "confrontos": partidas_formatadas
    }

    if torneio.formato == "mata_mata":
        arvore = defaultdict(list)
        for j in partidas_formatadas:
            fase_nome = j.get("fase") or "Mata-Mata"
            arvore[fase_nome].append(j)
        chaveamento_reconstruido["arvore"] = dict(arvore)

    elif torneio.formato == "pontos_corridos":
        chaveamento_reconstruido["tabela"] = partidas_formatadas
        n_times = len(participantes_db)
        chaveamento_reconstruido["total_rodadas"] = max((n_times - 1) * 2, 1) if n_times > 1 else 1
        chaveamento_reconstruido["classificacao"] = calcular_tabela_classificacao(db, torneio.id)

    elif torneio.formato == "copa":
        grupos = defaultdict(list)
        for j in partidas_formatadas:
            grupo_nome = j.get("fase") or "Fase de Grupos"
            grupos[grupo_nome].append(j)
        chaveamento_reconstruido["grupos"] = dict(grupos)
        chaveamento_reconstruido["classificacao"] = calcular_tabela_classificacao(db, torneio.id)

    return {
        "status": "sucesso",
        "formato_torneio": torneio.formato,
        "chaveamento": chaveamento_reconstruido,
        "classificacao": chaveamento_reconstruido.get("classificacao", [])
    }


@app.post("/api/sorteio/gerar")
def realizar_sorteio_geral(payload: SorteioRequest, db: Session = Depends(get_db)):
    lista_jogadores = [{"nome": j.nome, "nivel": j.nivel} for j in payload.jogadores]
    
    validacao = validar_quantidade_times(
        len(lista_jogadores), len(payload.times), formato=payload.modo, formato_torneio=payload.formato_torneio
    )
    if not validacao["valido"]:
        raise HTTPException(status_code=400, detail=validacao["mensagem"])
        
    if payload.manual:
        participantes_com_times = [
            {"participantes": j["nome"], "time": t}
            for j, t in zip(lista_jogadores, payload.times)
        ]
    else:
        if payload.modo == "solo":
            participantes = [j["nome"] for j in lista_jogadores]
        else:
            participantes = sortear_duplas(lista_jogadores, balanceado=payload.balanceado)
            
        participantes_com_times = sortear_times(participantes, payload.times)

    chaveamento = gerar_chaveamento_aleatorio(participantes_com_times, payload.formato_torneio)

    # Substitui os dados antigos no banco se o sorteio pertencer a um torneio existente
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
            
            mapa_participantes[item["time"]] = novo_part.id

        confrontos = (
            chaveamento.get("partidas_iniciais") or 
            chaveamento.get("confrontos") or 
            chaveamento.get("tabela") or 
            []
        )
        fase_nome = chaveamento.get("fase", "Fase Inicial")

        for jogo in confrontos:
            nome_casa = obter_nome_time(jogo.get("casa"))
            nome_fora = obter_nome_time(jogo.get("fora") or jogo.get("visitante"))

            if jogo.get("rodada"):
                fase_partida = f"Rodada {jogo.get('rodada')}"
            else:
                fase_partida = jogo.get("fase") or fase_nome

            nova_partida = database.Partida(
                torneio_id=payload.torneio_id,
                fase=fase_partida,
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
    val_id = validar_id_torneio(torneio.nome)
    if not val_id["valido"]:
        raise HTTPException(status_code=400, detail=val_id["mensagem"])

    val_senha = validar_senha_torneio(torneio.senha)
    if not val_senha["valido"]:
        raise HTTPException(status_code=400, detail=val_senha["mensagem"])

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

    dados_sorteados = montar_dados_torneio(db, torneio)

    return {
        "status": "sucesso",
        "mensagem": "Acesso concedido!",
        "torneio": {
            "id": torneio.id,
            "nome": torneio.nome,
            "formato": torneio.formato,
            "criado_em": torneio.criado_em,
            "ultimo_acesso": torneio.ultimo_acesso
        },
        "dados_sorteados": dados_sorteados
    }


@app.post("/api/torneios/placar")
def registrar_placar_partida(payload: PlacarRequest, db: Session = Depends(get_db)):
    if payload.gols_casa < 0 or payload.gols_visitante < 0:
        raise HTTPException(status_code=400, detail="Gols não podem ser negativos.")

    if payload.formato_torneio == "mata_mata" and payload.gols_casa == payload.gols_visitante:
        if payload.penaltis_casa is None or payload.penaltis_visitante is None:
            raise HTTPException(status_code=400, detail="Empates em mata-mata exigem decisão por pênaltis!")
        if payload.penaltis_casa == payload.penaltis_visitante:
            raise HTTPException(status_code=400, detail="A disputa de pênaltis não pode terminar empatada!")

    partida = None
    if payload.partida_id:
        partida = db.query(database.Partida).filter(database.Partida.id == payload.partida_id).first()
    else:
        partidas_fase = db.query(database.Partida).filter(
            database.Partida.torneio_id == payload.torneio_id,
            database.Partida.fase == payload.rodada_ou_fase
        ).all()
        if len(partidas_fase) > payload.index_partida:
            partida = partidas_fase[payload.index_partida]

    if not partida:
        raise HTTPException(status_code=404, detail="Partida não encontrada no banco de dados!")

    msg_avanco = None
    partida.gols_casa = payload.gols_casa
    partida.gols_fora = payload.gols_visitante
    partida.penaltis_casa = payload.penaltis_casa
    partida.penaltis_fora = payload.penaltis_visitante
    partida.status = "finalizada"
    db.commit()
    db.refresh(partida)

    if payload.formato_torneio == "mata_mata":
        msg_avanco = avancar_vencedor_mata_mata(db, partida)

    # Retorna os dados completos atualizados para atualizar a tela sem precisar relogar
    torneio = db.query(database.Torneio).filter(database.Torneio.id == payload.torneio_id).first()
    dados_atualizados = montar_dados_torneio(db, torneio) if torneio else None

    return {
        "status": "sucesso",
        "mensagem": "Placar persistido corretamente no banco de dados!",
        "avanco_mata_mata": msg_avanco,
        "classificacao": dados_atualizados.get("classificacao", []) if dados_atualizados else [],
        "dados_sorteados": dados_atualizados
    }