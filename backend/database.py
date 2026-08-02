import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Configuração da conexão com o banco SQLite local
SQLALCHEMY_DATABASE_URL = "sqlite:///./banco.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Definição das tabelas e relacionamentos do sistema no banco de dados
class Torneio(Base):
    __tablename__ = "torneios"

    id = Column(String, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True)
    formato = Column(String)
    senha_hash = Column(String)
    status = Column(String, default="ativo")
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)
    ultimo_acesso = Column(DateTime, default=datetime.datetime.utcnow)

    participantes = relationship("Participante", back_populates="torneio")
    partidas = relationship("Partida", back_populates="torneio")


class Participante(Base):
    __tablename__ = "participantes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    torneio_id = Column(String, ForeignKey("torneios.id"))
    sigla = Column(String)
    nome_clube = Column(String)
    jogador = Column(String)
    escudo_url = Column(String)

    torneio = relationship("Torneio", back_populates="participantes")


class Partida(Base):
    __tablename__ = "partidas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    torneio_id = Column(String, ForeignKey("torneios.id"))
    fase = Column(String)
    time_casa_id = Column(Integer, ForeignKey("participantes.id"))
    time_fora_id = Column(Integer, ForeignKey("participantes.id"))
    gols_casa = Column(Integer, nullable=True)
    gols_fora = Column(Integer, nullable=True)
    penaltis_casa = Column(Integer, nullable=True)
    penaltis_fora = Column(Integer, nullable=True)
    status = Column(String, default="pendente")

    torneio = relationship("Torneio", back_populates="partidas")


# Cria o arquivo de banco e estrutura as tabelas fisicamente
Base.metadata.create_all(bind=engine)