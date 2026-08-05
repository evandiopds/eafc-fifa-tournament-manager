import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CircleStar, LockKeyhole, FilePen, FileCheck, AlertTriangle, X } from 'lucide-react';
import { buscarTime } from '../utils/teamSearch';
import escudoGen from '../assets/escudo_gen.svg';
import escudoOff from '../assets/escudo_off.svg';
import whistleIcon from '../assets/whistle.svg';
import penaltyIcon from '../assets/penalty.svg';
import TabelaClassificacao from './TabelaClassificacao';
import ResumoTorneio from './ResumoTorneio';

const API_URL = 'http://127.0.0.1:8000/api';

// Busca o escudo oficial do time ou retorna o escudo padrão
function getEscudo(nomeTime) {
  if (!nomeTime || nomeTime === 'Aguardando' || nomeTime === 'A definir') {
    return escudoOff || escudoGen;
  }

  const timeEncontrado = buscarTime(nomeTime);
  if (!timeEncontrado || !timeEncontrado.escudo || timeEncontrado.escudo === '/escudo-padrao.png') {
    return escudoGen;
  }

  return timeEncontrado.escudo;
}

function getNomeExibicao(nomeTime) {
  if (!nomeTime || nomeTime === 'Aguardando' || nomeTime === 'A definir') {
    return nomeTime || 'Aguardando';
  }

  const timeEncontrado = buscarTime(nomeTime);
  if (timeEncontrado && timeEncontrado.nomeOficial) {
    return timeEncontrado.nomeOficial;
  }
  if (timeEncontrado && timeEncontrado.nome) {
    return timeEncontrado.nome;
  }

  return nomeTime;
}

// Extrai clube, jogador(es) e id do participante
function getDadosParticipante(alvo) {
  if (!alvo) return { clube: 'Aguardando', jogador: null, id: null };
  if (typeof alvo === 'string') return { clube: alvo, jogador: null, id: null };

  const clube = alvo.nome_clube || alvo.time || alvo.clube || 'Aguardando';
  const id = alvo.participante_id || alvo.id || null;
  let jogador = alvo.jogador || null;

  if (!jogador && alvo.participantes) {
    jogador = typeof alvo.participantes === 'string'
      ? alvo.participantes
      : Array.isArray(alvo.participantes)
      ? alvo.participantes.map((p) => p.nome).join(' & ')
      : null;
  }

  return { clube, jogador, id };
}

// Modal de confirmação para encerramento de fases, torneios e avisos táticos
function ModalConfirmacao({ isOpen, onClose, onConfirm, titulo, mensagem, textoBotao = 'Confirmar', isAlerta = false }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700 rounded-md p-4 sm:p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{titulo}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{mensagem}</p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              {!isAlerta && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className={`px-3 sm:px-4 py-2 rounded-sm text-xs font-black uppercase transition-all shadow-md ${
                  isAlerta
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {textoBotao}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Card individual de partida com edição de placar, W.O. e pênaltis
function CardPartida({ jogo, idx, formato, rodadaOuFase, torneioId, onPlacarSalvo, isBloqueado, isEliminatorio = false, isCompacto = false }) {
  const [golsCasa, setGolsCasa] = useState(jogo.gols_casa ?? '');
  const [golsVisitante, setGolsVisitante] = useState(jogo.gols_visitante ?? '');
  const [penCasa, setPenCasa] = useState(jogo.penaltis_casa ?? '');
  const [penVisitante, setPenVisitante] = useState(jogo.penaltis_visitante ?? '');
  
  const [emModoEdicao, setEmModoEdicao] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const { clube: nomeCasa, jogador: partCasa } = getDadosParticipante(jogo.casa || jogo.time);
  const { clube: nomeFora, jogador: partFora } = getDadosParticipante(jogo.fora || jogo.visitante);

  const nomeExibicaoCasa = getNomeExibicao(nomeCasa);
  const nomeExibicaoFora = getNomeExibicao(nomeFora);

  const isAguardando = nomeCasa === 'Aguardando' || nomeFora === 'Aguardando';
  const bloqueado = isAguardando || isBloqueado;

  const handleNumeroChange = (setter, valor) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    setter(apenasNumeros);
  };

  const ehMataMata = isEliminatorio || formato === 'mata_mata';

  const empatadoNoMataMata =
    !isAguardando &&
    ehMataMata &&
    golsCasa !== '' &&
    golsVisitante !== '' &&
    Number(golsCasa) === Number(golsVisitante);

  const temPenaltis =
    ehMataMata &&
    !emModoEdicao &&
    penCasa !== '' &&
    penCasa != null &&
    penVisitante !== '' &&
    penVisitante != null;

  const isFinal = jogo.fase === 'Final';
  const isTerceiro = jogo.fase === 'Terceiro Lugar';

  // Rótulo interno com a nomenclatura e # com opacidade menor ("SEMI-FINAL #1", "OITAVAS #4")
  const getRotuloInterno = () => {
    if (!ehMataMata || isFinal || isTerceiro) return null;
    let faseLimpa = (jogo.fase || rodadaOuFase || '')
      .replace(/de Final/i, '')
      .replace(/16avos/i, 'PLAYOFFS')
      .replace(/Semifinal/i, 'SEMI-FINAL')
      .trim()
      .toUpperCase();
    return {
      texto: faseLimpa,
      numero: `#${idx + 1}`,
    };
  };

  const getPodioStyles = (isCasa) => {
    if (!jogo.status || jogo.status !== 'finalizada') return '';

    const gCasa = Number(golsCasa);
    const gFora = Number(golsVisitante);
    let vitoriaCasa = gCasa > gFora;
    let vitoriaFora = gFora > gCasa;

    if (gCasa === gFora && temPenaltis) {
      vitoriaCasa = Number(penCasa) > Number(penVisitante);
      vitoriaFora = Number(penVisitante) > Number(penCasa);
    }

    if (isFinal) {
      if ((isCasa && vitoriaCasa) || (!isCasa && vitoriaFora)) {
        return 'bg-amber-500/15 border-amber-500/50 text-amber-200';
      }
      return 'bg-slate-300/10 border-slate-400/40 text-slate-300';
    }

    if (isTerceiro) {
      if ((isCasa && vitoriaCasa) || (!isCasa && vitoriaFora)) {
        return 'bg-amber-700/20 border-amber-700/50 text-amber-400';
      }
    }

    return '';
  };

  const salvarNoBackend = async (casaGols, foraGols, casaPen = null, foraPen = null) => {
    setCarregando(true);
    setStatusMsg(null);

    try {
      const resp = await axios.post(`${API_URL}/torneios/placar`, {
        torneio_id: torneioId,
        formato_torneio: formato,
        rodada_ou_fase: rodadaOuFase,
        index_partida: idx,
        gols_casa: casaGols,
        gols_visitante: foraGols,
        penaltis_casa: casaPen,
        penaltis_visitante: foraPen,
      });

      setStatusMsg({ erro: false, texto: 'Salvo!' });
      setEmModoEdicao(false);
      if (onPlacarSalvo) onPlacarSalvo(resp.data, casaGols, foraGols, casaPen, foraPen);
    } catch (err) {
      if (rodadaOuFase === 'Rodada D') {
        setStatusMsg({ erro: false, texto: 'Salvo!' });
        setEmModoEdicao(false);
        if (onPlacarSalvo) onPlacarSalvo(null, casaGols, foraGols, casaPen, foraPen);
      } else {
        setStatusMsg({
          erro: true,
          texto: err.response?.data?.detail || 'Erro ao salvar',
        });
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvarPlacar = () => {
    if (bloqueado) return;

    if (golsCasa === '' || golsVisitante === '') {
      setStatusMsg({ erro: true, texto: 'Preencha o placar!' });
      return;
    }

    const finalGolsCasa = Number(golsCasa);
    const finalGolsVisitante = Number(golsVisitante);

    if (ehMataMata && finalGolsCasa === finalGolsVisitante) {
      if (penCasa === '' || penVisitante === '') {
        setStatusMsg({ erro: true, texto: 'Empate exige pênaltis!' });
        return;
      }
      if (Number(penCasa) === Number(penVisitante)) {
        setStatusMsg({ erro: true, texto: 'Pênaltis não empatam!' });
        return;
      }
    }

    salvarNoBackend(
      finalGolsCasa,
      finalGolsVisitante,
      empatadoNoMataMata ? Number(penCasa) : null,
      empatadoNoMataMata ? Number(penVisitante) : null
    );
  };

  const handleWO = (vencedor) => {
    if (bloqueado) return;
    const gCasa = vencedor === 'casa' ? 1 : 0;
    const gFora = vencedor === 'fora' ? 1 : 0;
    setGolsCasa(gCasa);
    setGolsVisitante(gFora);
    salvarNoBackend(gCasa, gFora);
  };

  const rotuloInterno = getRotuloInterno();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min((idx || 0) * 0.04, 0.3) }}
      className={`${
        isCompacto ? 'w-60 sm:w-64 p-2 gap-1 text-xs' : 'w-72 p-3 gap-2'
      } bg-slate-800/90 border rounded-md flex flex-col shadow-md transition-colors ${
        isFinal
          ? 'border-amber-500 shadow-amber-500/10'
          : bloqueado
          ? 'border-slate-700/50 bg-slate-900/40 opacity-75'
          : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      {/* Rótulo Interno Acima do Mandante (SEMI-FINAL #1, OITAVAS #2...) */}
      {rotuloInterno && (
        <div className="flex items-center justify-center -mt-0.5 pb-1 border-b border-slate-700/40">
          <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 flex items-center gap-1">
            <span>{rotuloInterno.texto}</span>
            <span className="text-emerald-500/70 font-bold">{rotuloInterno.numero}</span>
          </span>
        </div>
      )}

      {/* Time da Casa */}
      <div
        className={`flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2 px-1 rounded-sm transition-colors ${getPodioStyles(
          true
        )}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={getEscudo(nomeCasa)}
            alt={nomeExibicaoCasa}
            onError={(e) => {
              e.target.src = (!nomeCasa || nomeCasa === 'Aguardando' || nomeCasa === 'A definir') 
                ? (escudoOff || escudoGen) 
                : escudoGen;
            }}
            className={`${isCompacto ? 'w-5 h-5' : 'w-7 h-7'} object-contain shrink-0`}
          />
          <div className="truncate">
            <p
              className={`${
                isCompacto ? 'text-xs sm:text-sm' : 'text-sm'
              } font-bold truncate ${
                nomeCasa === 'Aguardando' ? 'text-slate-500 italic' : 'text-white'
              }`}
            >
              {nomeExibicaoCasa}
            </p>
            {partCasa && <p className="text-[10px] text-emerald-400 font-semibold truncate">{partCasa}</p>}
          </div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          disabled={bloqueado || !emModoEdicao}
          value={golsCasa}
          onChange={(e) => handleNumeroChange(setGolsCasa, e.target.value)}
          placeholder="-"
          className={`${
            isCompacto ? 'w-8 text-xs py-0' : 'w-9 text-sm py-0.5'
          } text-center bg-slate-900 border border-slate-700 rounded-sm font-black text-white focus:outline-none focus:border-emerald-500 disabled:opacity-30`}
        />
      </div>

      {/* Time Visitante */}
      <div
        className={`flex items-center justify-between gap-2 pt-0.5 px-1 rounded-sm transition-colors ${getPodioStyles(
          false
        )}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={getEscudo(nomeFora)}
            alt={nomeExibicaoFora}
            onError={(e) => {
              e.target.src = (!nomeFora || nomeFora === 'Aguardando' || nomeFora === 'A definir') 
                ? (escudoOff || escudoGen) 
                : escudoGen;
            }}
            className={`${isCompacto ? 'w-5 h-5' : 'w-7 h-7'} object-contain shrink-0`}
          />
          <div className="truncate">
            <p
              className={`${
                isCompacto ? 'text-xs sm:text-sm' : 'text-sm'
              } font-bold truncate ${
                nomeFora === 'Aguardando' ? 'text-slate-500 italic' : 'text-white'
              }`}
            >
              {nomeExibicaoFora}
            </p>
            {partFora && <p className="text-[10px] text-emerald-400 font-semibold truncate">{partFora}</p>}
          </div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          disabled={bloqueado || !emModoEdicao}
          value={golsVisitante}
          onChange={(e) => handleNumeroChange(setGolsVisitante, e.target.value)}
          placeholder="-"
          className={`${
            isCompacto ? 'w-8 text-xs py-0' : 'w-9 text-sm py-0.5'
          } text-center bg-slate-900 border border-slate-700 rounded-sm font-black text-white focus:outline-none focus:border-emerald-500 disabled:opacity-30`}
        />
      </div>

      {/* Placar dos Pênaltis */}
      {temPenaltis && (
        <div className="flex items-center justify-center gap-1.5 py-1 bg-slate-900/80 rounded-sm border border-emerald-500/30 text-emerald-400 font-bold text-xs mt-1">
          <img src={penaltyIcon} alt="Pênaltis" className="w-3.5 h-3.5 shrink-0" />
          <span>{penCasa} × {penVisitante}</span>
        </div>
      )}

      {/* Controles de Placar */}
      {!bloqueado && (
        <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-slate-700/40">
          <div className="flex items-center justify-between">
            {emModoEdicao ? (
              <>
                {empatadoNoMataMata ? (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                    <img src={penaltyIcon} alt="Pênalti" className="w-3.5 h-3.5 shrink-0" />
                    <span>Pên:</span>
                    <input
                      type="text"
                      value={penCasa}
                      onChange={(e) => handleNumeroChange(setPenCasa, e.target.value)}
                      className="w-6 text-center bg-slate-900 border border-slate-600 rounded-sm text-xs"
                    />
                    <span>×</span>
                    <input
                      type="text"
                      value={penVisitante}
                      onChange={(e) => handleNumeroChange(setPenVisitante, e.target.value)}
                      className="w-6 text-center bg-slate-900 border border-slate-600 rounded-sm text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleWO('casa')}
                      className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-[9px] font-bold uppercase text-slate-300 rounded-sm"
                      title="Vitória por W.O. (1x0)"
                    >
                      W.O. Casa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWO('fora')}
                      className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-[9px] font-bold uppercase text-slate-300 rounded-sm"
                      title="Vitória por W.O. (0x1)"
                    >
                      W.O. Fora
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSalvarPlacar}
                  disabled={carregando}
                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-2.5 py-1 rounded-sm text-[11px] font-black uppercase transition-all shadow-sm ml-auto"
                >
                  <FileCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{carregando ? '...' : 'Salvar'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStatusMsg(null);
                  setEmModoEdicao(true);
                }}
                className="flex items-center justify-center gap-1.5 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-all"
              >
                <FilePen className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Editar Placar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {statusMsg && (
        <p className={`text-center text-[11px] font-semibold ${statusMsg.erro ? 'text-rose-400' : 'text-emerald-400'}`}>
          {statusMsg.texto}
        </p>
      )}
    </motion.div>
  );
}

export default function Chaveamento({ torneio, dadosSorteados }) {
  const [rodadaSelecionada, setRodadaSelecionada] = useState(1);
  const [secaoMataMata, setSecaoMataMata] = useState('arvore_principal');
  const [dadosTorneio, setDadosTorneio] = useState(dadosSorteados);
  const [prevSorteados, setPrevSorteados] = useState(dadosSorteados);
  const [statusTorneio, setStatusTorneio] = useState(torneio?.status || 'ativo');
  const [abaCopa, setAbaCopa] = useState('grupos');
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [jogosDesempateLocal, setJogosDesempateLocal] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  if (dadosSorteados !== prevSorteados) {
    setPrevSorteados(dadosSorteados);
    setDadosTorneio(dadosSorteados);
  }

  if (!dadosTorneio || !dadosTorneio.chaveamento) {
    return (
      <div className="w-full text-center py-12 bg-slate-800/60 rounded-md border border-slate-700">
        <p className="text-slate-400">
          Nenhum chaveamento gerado para {torneio?.nome || 'este torneio'} ainda.
        </p>
      </div>
    );
  }

  const { formato_torneio, chaveamento, classificacao = [] } = dadosTorneio;
  const isFinalizado = statusTorneio === 'finalizado';

  // Verifica igualdade absoluta na pontuação para ativar a Rodada de Desempate (D)
  const verificarEmpateTopo = () => {
    if (formato_torneio !== 'pontos_corridos' || !classificacao || classificacao.length < 2) {
      return { existe: false, times: [] };
    }

    const tabelaNormais = (chaveamento?.tabela || []).filter((j) => j.rodada !== 'D' && j.rodada !== 'Desempate');
    const todasNormaisFinalizadas = tabelaNormais.length > 0 && tabelaNormais.every(
      (j) => j.gols_casa !== '' && j.gols_casa != null && j.gols_visitante !== '' && j.gols_visitante != null
    );

    if (!todasNormaisFinalizadas) {
      return { existe: false, times: [] };
    }

    const t1 = classificacao[0];
    const t2 = classificacao[1];
    if (!t1 || !t2 || (t1.pontos === 0 && t1.jogos === 0)) {
      return { existe: false, times: [] };
    }

    const getPontosConfronto = (timeA, timeB) => {
      let ptsA = 0;
      let ptsB = 0;
      tabelaNormais.forEach((jogo) => {
        const casaNome = typeof jogo.casa === 'string' ? jogo.casa : jogo.casa?.time || jogo.time;
        const foraNome = typeof jogo.fora === 'string' ? jogo.fora : jogo.fora?.time || jogo.visitante?.time;

        const envolveA = casaNome === timeA.nome_clube || foraNome === timeA.nome_clube;
        const envolveB = casaNome === timeB.nome_clube || foraNome === timeB.nome_clube;

        if (envolveA && envolveB) {
          const gCasa = Number(jogo.gols_casa);
          const gFora = Number(jogo.gols_visitante);
          if (casaNome === timeA.nome_clube) {
            if (gCasa > gFora) ptsA += 3;
            else if (gFora > gCasa) ptsB += 3;
            else { ptsA += 1; ptsB += 1; }
          } else {
            if (gFora > gCasa) ptsA += 3;
            else if (gCasa > gFora) ptsB += 3;
            else { ptsA += 1; ptsB += 1; }
          }
        }
      });
      return { ptsA, ptsB };
    };

    const { ptsA: ptsT1vsT2, ptsB: ptsT2vsT1 } = getPontosConfronto(t1, t2);
    const confrontoEmpatado = ptsT1vsT2 === ptsT2vsT1;

    const empateAbsoluto =
      t1.pontos === t2.pontos &&
      confrontoEmpatado &&
      t1.saldo_gols === t2.saldo_gols &&
      t1.gols_pro === t2.gols_pro;

    if (!empateAbsoluto) return { existe: false, times: [] };

    const t3 = classificacao[2];
    let empateTriplo = false;
    if (t3 && t3.pontos === t1.pontos && t3.saldo_gols === t1.saldo_gols && t3.gols_pro === t1.gols_pro) {
      const { ptsA: pts1vs3, ptsB: pts3vs1 } = getPontosConfronto(t1, t3);
      const { ptsA: pts2vs3, ptsB: pts3vs2 } = getPontosConfronto(t2, t3);
      empateTriplo = (pts1vs3 === pts3vs1) && (pts2vs3 === pts3vs2);
    }

    return {
      existe: true,
      times: empateTriplo ? [t1, t2, t3] : [t1, t2],
      triplo: empateTriplo,
    };
  };

  const infoEmpateTopo = verificarEmpateTopo();

  const obterJogosDesempate = () => {
    const tabela = chaveamento.tabela || [];
    const jogosBackend = tabela.filter((j) => j.rodada === 'D' || j.rodada === 'Desempate');
    if (jogosBackend.length > 0) return jogosBackend;

    if (!infoEmpateTopo.existe) return [];

    const timesD = infoEmpateTopo.times;
    if (timesD.length === 2) {
      const idPar = 'desempate-topo-1';
      return [
        jogosDesempateLocal[idPar] || {
          id: idPar,
          rodada: 'D',
          casa: { time: timesD[0].nome_clube, participantes: timesD[0].jogador },
          fora: { time: timesD[1].nome_clube, participantes: timesD[1].jogador },
          gols_casa: '',
          gols_visitante: '',
          penaltis_casa: '',
          penaltis_visitante: '',
          isDesempate: true,
        },
      ];
    }

    return [
      { tA: timesD[0], tB: timesD[1], id: 'desempate-topo-1' },
      { tA: timesD[1], tB: timesD[2], id: 'desempate-topo-2' },
      { tA: timesD[0], tB: timesD[2], id: 'desempate-topo-3' },
    ].map((item) => {
      return (
        jogosDesempateLocal[item.id] || {
          id: item.id,
          rodada: 'D',
          casa: { time: item.tA.nome_clube, participantes: item.tA.jogador },
          fora: { time: item.tB.nome_clube, participantes: item.tB.jogador },
          gols_casa: '',
          gols_visitante: '',
          penaltis_casa: '',
          penaltis_visitante: '',
          isDesempate: true,
        }
      );
    });
  };

  const handleAtualizarDados = (respostaApi) => {
    if (respostaApi?.dados_sorteados) {
      setDadosTorneio(respostaApi.dados_sorteados);
    } else if (respostaApi?.classificacao) {
      setDadosTorneio((prev) => ({
        ...prev,
        classificacao: respostaApi.classificacao,
      }));
    }
  };

  const handleConfirmarFinalizacao = async () => {
    try {
      const resp = await axios.post(`${API_URL}/torneios/${torneio?.id}/finalizar`);
      const novoStatus = resp.data?.novo_status || 'finalizado';
      setStatusTorneio(novoStatus);

      if (resp.data?.dados_sorteados) {
        setDadosTorneio(resp.data.dados_sorteados);
      }

      if (novoStatus === 'mata_mata') {
        setAbaCopa('mata_mata');
      }
    } catch (err) {
      setModalConfig({
        titulo: 'Erro ao Finalizar',
        mensagem: err.response?.data?.detail || 'Não foi possível concluir a etapa atual.',
        textoBotao: 'Entendi',
        isAlerta: true,
        onConfirm: null,
      });
      setModalOpen(true);
    }
  };

  const handleFinalizar = () => {
    const isGrupos = formato_torneio === 'copa' && statusTorneio === 'fase_grupos';

    if (formato_torneio === 'pontos_corridos' && infoEmpateTopo.existe) {
      const jogosD = obterJogosDesempate();
      const desempatePendente = jogosD.some(
        (j) => j.gols_casa === '' || j.gols_casa == null || j.gols_visitante === '' || j.gols_visitante == null
      );

      if (desempatePendente) {
        setModalConfig({
          titulo: 'Desempate Pendente!',
          mensagem:
            'As partidas da Rodada de Desempate (D) ainda não foram preenchidas! Você pode preencher os placares para definir o campeão no campo ou encerrar agora e deixar o sistema decidir o vencedor na sorte.',
          textoBotao: 'Encerrar na Sorte',
          isAlerta: true,
          onConfirm: handleConfirmarFinalizacao,
        });
        setModalOpen(true);
        return;
      }
    }

    setModalConfig({
      titulo: isGrupos ? 'Finalizar Fase de Grupos' : 'Finalizar Torneio',
      mensagem: isGrupos
        ? 'Deseja encerrar a Fase de Grupos? Os confrontos do Mata-Mata serão gerados e os placares de grupo bloqueados.'
        : 'Deseja finalizar o torneio? Todas as alterações de placar serão bloqueadas permanentemente.',
      textoBotao: isGrupos ? 'Avançar para Mata-Mata' : 'Encerrar Torneio',
      isAlerta: false,
      onConfirm: handleConfirmarFinalizacao,
    });
    setModalOpen(true);
  };

  // Renderiza a Árvore Eliminatória:
  // - Aba separada para Play-In, Playoffs (antigo 16avos) e Oitavas (tanto em PC quanto em Mobile)
  // - Árvore simétrica (Quartas -> Semis -> Decisões) a partir de 8 participantes
  const renderArvoreEliminatoria = (arvoreDados, isBloqueadoPorFase = false) => {
    const arvoreProcessada = {};
    
    Object.keys(arvoreDados || {}).forEach((fase) => {
      const jogosComIndexOriginal = (arvoreDados[fase] || [])
        .slice()
        .sort((a, b) => {
          if (a.index_partida !== undefined && b.index_partida !== undefined) {
            return Number(a.index_partida) - Number(b.index_partida);
          }
          if (a.id !== undefined && b.id !== undefined) {
            const numA = Number(a.id);
            const numB = Number(b.id);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return String(a.id).localeCompare(String(b.id));
          }
          return 0;
        })
        .map((j, idxOriginal) => ({
          ...j,
          _idxOriginal: idxOriginal,
        }));

      if (
        fase === 'Final' ||
        fase === 'Terceiro Lugar' ||
        fase === 'Decisões' ||
        (fase.includes('Final') && fase.includes('Decis'))
      ) {
        if (!arvoreProcessada['Decisões']) {
          arvoreProcessada['Decisões'] = [];
        }
        arvoreProcessada['Decisões'].push(...jogosComIndexOriginal);
      } else {
        arvoreProcessada[fase] = jogosComIndexOriginal;
      }
    });

    if (arvoreProcessada['Decisões']) {
      arvoreProcessada['Decisões'].sort((a, b) => {
        if (a.fase === 'Final') return -1;
        if (b.fase === 'Final') return 1;
        return 0;
      });
    }

    const fases = Object.keys(arvoreProcessada);

    if (fases.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400 text-sm">
          Nenhum jogo eliminatório disponível no momento.
        </div>
      );
    }

    const temPlayIn = fases.includes('Play-In');
    const temPlayoffs = fases.includes('16avos de Final') || fases.includes('16avos') || fases.includes('Playoffs');
    const temOitavas = fases.includes('Oitavas de Final') || fases.includes('Oitavas');

    const fasesAbasExclusivas = fases.filter((f) =>
      ['Play-In', '16avos de Final', '16avos', 'Playoffs', 'Oitavas de Final', 'Oitavas'].includes(f)
    );

    const fasesArvorePrincipal = fases.filter(
      (f) => !fasesAbasExclusivas.includes(f)
    );

    const abaAtual =
      secaoMataMata === 'arvore_principal' && fasesArvorePrincipal.length > 0
        ? 'arvore_principal'
        : fasesAbasExclusivas.includes(secaoMataMata)
        ? secaoMataMata
        : fasesArvorePrincipal.length > 0
        ? 'arvore_principal'
        : fases[0];

    const temAbas = fasesAbasExclusivas.length > 0;

    return (
      <div className="space-y-6">
        {/* ABAS SUPERIORES (Playoffs | Oitavas | Fase Final) */}
        {temAbas && (
          <div className="flex justify-center border-b border-slate-700/80 pb-3">
            <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 p-1.5 rounded-md border border-slate-700">
              {temPlayIn && (
                <button
                  type="button"
                  onClick={() => setSecaoMataMata('Play-In')}
                  className={`px-4 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
                    abaAtual === 'Play-In'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Play-In
                </button>
              )}
              {temPlayoffs && (
                <button
                  type="button"
                  onClick={() =>
                    setSecaoMataMata(
                      fases.find((f) => f.includes('16avos') || f.includes('Playoffs')) || ''
                    )
                  }
                  className={`px-4 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
                    abaAtual.includes('16avos') || abaAtual.includes('Playoffs')
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Playoffs
                </button>
              )}
              {temOitavas && (
                <button
                  type="button"
                  onClick={() =>
                    setSecaoMataMata(fases.find((f) => f.includes('Oitavas')) || '')
                  }
                  className={`px-4 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
                    abaAtual.includes('Oitavas')
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Oitavas
                </button>
              )}
              {fasesArvorePrincipal.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSecaoMataMata('arvore_principal')}
                  className={`px-4 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
                    abaAtual === 'arvore_principal'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fase Final
                </button>
              )}
            </div>
          </div>
        )}

        {/*  RND DE ABA ISOLADA (Play-In, Playoffs ou Oitavas selecionado) */}
        {abaAtual !== 'arvore_principal' && arvoreProcessada[abaAtual] && (
          <motion.div
            key={abaAtual}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 py-2"
          >
            {arvoreProcessada[abaAtual].map((jogo, idx) => (
              <CardPartida
                key={`${jogo.id || idx}-${jogo.gols_casa}-${jogo.gols_visitante}`}
                idx={jogo._idxOriginal ?? idx}
                jogo={jogo}
                formato={formato_torneio}
                rodadaOuFase={jogo.fase || abaAtual}
                torneioId={torneio?.id}
                onPlacarSalvo={handleAtualizarDados}
                isBloqueado={isFinalizado || isBloqueadoPorFase}
                isEliminatorio={true}
                isCompacto={false}
              />
            ))}
          </motion.div>
        )}

        {/*  ÁRVORE PRINCIPAL (Quartas -> Semis -> Decisões) */}
        {abaAtual === 'arvore_principal' && (
          <div
            className="overflow-x-auto pb-8 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-color:_#10b981_#0f172a] [scrollbar-width:_thin]"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #0f172a' }}
          >
            <div className="flex items-stretch justify-start md:justify-center gap-6 sm:gap-10 min-w-max">
              {fasesArvorePrincipal.map((nomeFase, idxFase) => {
                const isDecisoes = nomeFase === 'Decisões';

                return (
                  <div
                    key={nomeFase}
                    className="flex flex-col justify-around relative"
                  >
                    <div className="text-center pb-2 border-b border-slate-700/80 mb-6">
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                        {isDecisoes ? 'Decisões' : nomeFase}
                      </span>
                    </div>

                    <div
                      className={`flex flex-col flex-1 my-auto ${
                        isDecisoes
                          ? 'justify-center gap-4'
                          : idxFase === 0
                          ? 'justify-around gap-6'
                          : idxFase === 1
                          ? 'justify-center gap-16'
                          : 'justify-around gap-24'
                      }`}
                    >
                      {arvoreProcessada[nomeFase].map((jogo, idx) => {
                        const isFinal = jogo.fase === 'Final';
                        const isTerceiro = jogo.fase === 'Terceiro Lugar';

                        return (
                          <div
                            key={`${jogo.id || idx}-${jogo.gols_casa}-${jogo.gols_visitante}`}
                            className={`flex flex-col gap-1.5 items-center ${
                              isFinal
                                ? 'z-10'
                                : isTerceiro
                                ? 'mt-1 opacity-80 hover:opacity-100 scale-95 transition-all'
                                : ''
                            }`}
                          >
                            {(isFinal || isTerceiro) && (
                              <span
                                className={`flex flex-row items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-sm border ${
                                  isFinal
                                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                                    : 'bg-slate-800/80 border-slate-700 text-slate-400 text-[10px]'
                                }`}
                              >
                                {isFinal ? (
                                  <>
                                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>FINAL</span>
                                  </>
                                ) : (
                                  <>
                                    <CircleStar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>TERCEIRO LUGAR</span>
                                  </>
                                )}
                              </span>
                            )}

                            <CardPartida
                              idx={jogo._idxOriginal ?? idx}
                              jogo={jogo}
                              formato={formato_torneio}
                              rodadaOuFase={jogo.fase || nomeFase}
                              torneioId={torneio?.id}
                              onPlacarSalvo={handleAtualizarDados}
                              isBloqueado={isFinalizado || isBloqueadoPorFase}
                              isEliminatorio={true}
                              isCompacto={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderiza a Fase de Grupos com barra de abas (A, B, C...) e jogos dispostos em grade flexível horizontal
  const renderCopa = () => {
    const grupos = chaveamento.grupos || {};
    const arvoreMataMata = chaveamento.arvore || {};
    const nomesGrupos = Object.keys(grupos);
    const inFaseGrupos = statusTorneio === 'fase_grupos' || statusTorneio === 'ativo';

    const grupoAtivo = grupoSelecionado && nomesGrupos.includes(grupoSelecionado)
      ? grupoSelecionado
      : (nomesGrupos[0] || '');

    const tabelaGrupo = Array.isArray(classificacao)
      ? classificacao
      : classificacao[grupoAtivo] || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-center border-b border-slate-700 pb-4">
          <div className="flex bg-slate-900 p-1 rounded-md border border-slate-700">
            <button
              type="button"
              onClick={() => setAbaCopa('grupos')}
              className={`text-[11px] sm:text-xs px-4 sm:px-6 py-2 rounded-sm font-black uppercase tracking-wider transition-all ${
                abaCopa === 'grupos'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fase de Grupos
            </button>
            <button
              type="button"
              onClick={() => setAbaCopa('mata_mata')}
              className={`flex items-center justify-center gap-1.5 text-[11px] sm:text-xs px-4 sm:px-6 py-2 rounded-sm font-black uppercase tracking-wider transition-all ${
                abaCopa === 'mata_mata'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Mata-Mata</span>
              {inFaseGrupos && <LockKeyhole className="w-3.5 h-3.5 shrink-0" />}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {abaCopa === 'grupos' ? (
            <motion.div
              key="grupos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Seletor Horizontal de Grupos */}
              <div className="w-full max-w-full overflow-x-auto pb-2 px-1 flex items-center justify-start sm:justify-center gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1 shrink-0">
                  Grupos:
                </span>
                {nomesGrupos.map((nomeGrupo) => {
                  const letraGrupo = nomeGrupo.replace(/Grupo\s+/i, '');
                  return (
                    <button
                      key={nomeGrupo}
                      type="button"
                      onClick={() => setGrupoSelecionado(nomeGrupo)}
                      className={`px-4 py-2 rounded-sm text-xs font-extrabold shrink-0 transition-all ${
                        grupoAtivo === nomeGrupo
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {letraGrupo}
                    </button>
                  );
                })}
              </div>

              {/* Partidas dispostas na horizontal com quebra automática */}
              {grupoAtivo && grupos[grupoAtivo] && (
                <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                  {grupos[grupoAtivo].map((item, idx) => (
                    <CardPartida 
                      key={`${item.id || idx}-${item.gols_casa}-${item.gols_visitante}`} 
                      idx={idx} 
                      jogo={item} 
                      formato={formato_torneio} 
                      rodadaOuFase={grupoAtivo}
                      torneioId={torneio?.id}
                      onPlacarSalvo={handleAtualizarDados}
                      isBloqueado={!inFaseGrupos || isFinalizado}
                      isEliminatorio={false}
                    />
                  ))}
                </div>
              )}

              {/* Tabela do Grupo Ativo */}
              {grupoAtivo && (
                <TabelaClassificacao 
                  classificacao={tabelaGrupo} 
                  formato="copa" 
                  nomeGrupo={grupoAtivo} 
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="mata_mata"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {inFaseGrupos && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-amber-300 text-xs text-center font-bold">
                  Conclua e finalize a Fase de Grupos para habilitar os jogos do Mata-Mata!
                </div>
              )}
              {renderArvoreEliminatoria(arvoreMataMata, inFaseGrupos)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Renderiza rodadas e confrontos em grade horizontal responsiva no formato Pontos Corridos
  const renderPontosCorridos = () => {
    const tabela = chaveamento.tabela || [];
    const totalRodadas = chaveamento.total_rodadas || 1;
    const isRodadaD = rodadaSelecionada === 'D';

    const jogosRodada = isRodadaD ? obterJogosDesempate() : tabela.filter((jogo) => jogo.rodada === rodadaSelecionada);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            Pontos <span className="text-emerald-400">Corridos</span>
          </h3>
        </div>

        {/* Seletor Horizontal de Rodadas */}
        <div className="w-full max-w-full overflow-x-auto pb-2 px-1 flex items-center justify-start sm:justify-center gap-2">
          {Array.from({ length: totalRodadas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setRodadaSelecionada(num)}
              className={`px-3.5 py-2 rounded-sm text-xs font-extrabold shrink-0 transition-all ${
                rodadaSelecionada === num
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {num}ª
            </button>
          ))}

          {infoEmpateTopo.existe && (
            <button
              type="button"
              onClick={() => setRodadaSelecionada('D')}
              className={`px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                isRodadaD
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-amber-400 border border-amber-500/50 hover:bg-amber-500/10'
              }`}
              title="Rodada Extra de Desempate pelo Título"
            >
              D
            </button>
          )}
        </div>

        <AnimatePresence>
          {isRodadaD && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="w-full max-w-2xl mx-auto bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-sm text-amber-200 text-xs leading-relaxed shadow-md"
            >
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-amber-400 mb-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Rodada de Desempate (Empate Absoluto)</span>
              </div>
              <p>
                Essa rodada surgiu devido a um empate absoluto entre duas equipes, infelizmente é impossível para o sistema decidir que será o campeão devido a todos os critérios do sistema terem sido igualados entre duas equipes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={rodadaSelecionada}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-wrap items-center justify-center gap-4 w-full"
          >
            {jogosRodada.map((jogo, idx) => (
              <CardPartida 
                key={`${jogo.id || idx}-${jogo.gols_casa}-${jogo.gols_visitante}`} 
                idx={idx} 
                jogo={jogo} 
                formato={formato_torneio} 
                rodadaOuFase={isRodadaD ? 'Rodada D' : `Rodada ${jogo.rodada}`}
                torneioId={torneio?.id}
                onPlacarSalvo={(resp, gCasa, gFora, pCasa, pFora) => {
                  handleAtualizarDados(resp);
                  if (isRodadaD) {
                    setJogosDesempateLocal((prev) => ({
                      ...prev,
                      [jogo.id]: {
                        ...jogo,
                        gols_casa: gCasa,
                        gols_visitante: gFora,
                        penaltis_casa: pCasa,
                        penaltis_visitante: pFora,
                        status: 'finalizada',
                      },
                    }));
                  }
                }}
                isBloqueado={isFinalizado}
                isEliminatorio={isRodadaD}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <TabelaClassificacao 
          classificacao={classificacao} 
          formato="pontos_corridos" 
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 space-y-8">
      {formato_torneio === 'copa' && renderCopa()}
      {formato_torneio === 'pontos_corridos' && renderPontosCorridos()}
      {formato_torneio === 'mata_mata' && renderArvoreEliminatoria(chaveamento.arvore, isFinalizado)}

      <AnimatePresence mode="wait">
        {isFinalizado ? (
          <motion.div
            key="resumo-torneio"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <ResumoTorneio dadosTorneio={dadosTorneio} torneio={torneio} />
          </motion.div>
        ) : (
          <motion.div
            key="botao-finalizar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center pt-4 border-t border-slate-700/60"
          >
            <button
              onClick={handleFinalizar}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-md shadow-lg transition-all"
            >
              <img src={whistleIcon} alt="Apito" className="w-4 h-4 shrink-0" />
              <span>
                {formato_torneio === 'copa' && statusTorneio === 'fase_grupos'
                  ? 'Finalizar Fase de Grupos'
                  : 'Finalizar Torneio'}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalConfirmacao
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        {...modalConfig}
      />
    </div>
  );
}