import { useState } from 'react';
import axios from 'axios';
import { Trophy, CircleStar, LockKeyhole, FilePen, FileCheck } from 'lucide-react';
import { buscarTime } from '../utils/teamSearch';
import escudoGen from '../assets/escudo_gen.svg';
import escudoOff from '../assets/escudo_off.svg';
import whistleIcon from '../assets/whistle.svg';
import penaltyIcon from '../assets/penalty.svg';
import TabelaClassificacao from './TabelaClassificacao';

const API_URL = 'http://127.0.0.1:8000/api';

// Busca e retorna o escudo oficial do time ou o ícone padrão
function getEscudo(nomeTime) {
  if (!nomeTime || nomeTime === 'Aguardando' || nomeTime === 'A definir') {
    return escudoOff || escudoGen;
  }

  const timeEncontrado = buscarTime(nomeTime);
  if (!timeEncontrado || timeEncontrado.escudo === '/escudo-padrao.png') {
    return escudoGen;
  }

  return timeEncontrado.escudo;
}

// Card individual da partida com suporte a edição de placar, pênaltis e W.O.
function CardPartida({ jogo, idx, formato, rodadaOuFase, torneioId, onPlacarSalvo, isBloqueado, isEliminatorio = false }) {
  const [golsCasa, setGolsCasa] = useState(jogo.gols_casa ?? '');
  const [golsVisitante, setGolsVisitante] = useState(jogo.gols_visitante ?? '');
  const [penCasa, setPenCasa] = useState(jogo.penaltis_casa ?? '');
  const [penVisitante, setPenVisitante] = useState(jogo.penaltis_visitante ?? '');
  
  const [emModoEdicao, setEmModoEdicao] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const nomeCasa = typeof jogo.casa === 'string' ? jogo.casa : jogo.casa?.time || jogo.time || 'Aguardando';
  const nomeFora = typeof jogo.fora === 'string' ? jogo.fora : jogo.fora?.time || jogo.visitante?.time || 'Aguardando';

  const isAguardando = nomeCasa === 'Aguardando' || nomeFora === 'Aguardando';
  const bloqueado = isAguardando || isBloqueado;

  const handleNumeroChange = (setter, valor) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    setter(apenasNumeros);
  };

  // Identifica se o confronto é eliminatório (mata-mata puro ou fase eliminatória da copa)
  const ehMataMata = isEliminatorio || formato === 'mata_mata';

  const empatadoNoMataMata =
    !isAguardando &&
    ehMataMata &&
    golsCasa !== '' &&
    golsVisitante !== '' &&
    Number(golsCasa) === Number(golsVisitante);

  // Envia o placar atualizado para a API no back-end
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
      setEmModoEdicao(false); // Fecha o modo de edição ao salvar com sucesso
      if (onPlacarSalvo) onPlacarSalvo(resp.data);
    } catch (err) {
      setStatusMsg({
        erro: true,
        texto: err.response?.data?.detail || 'Erro ao salvar',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Valida regras de empate/pênaltis antes de salvar o placar
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
    }

    salvarNoBackend(
      finalGolsCasa,
      finalGolsVisitante,
      empatadoNoMataMata ? Number(penCasa) : null,
      empatadoNoMataMata ? Number(penVisitante) : null
    );
  };

  // Aplica vitória rápida por W.O. (1x0 ou 0x1)
  const handleWO = (vencedor) => {
    if (bloqueado) return;
    const gCasa = vencedor === 'casa' ? 1 : 0;
    const gFora = vencedor === 'fora' ? 1 : 0;
    setGolsCasa(gCasa);
    setGolsVisitante(gFora);
    salvarNoBackend(gCasa, gFora);
  };

  const partCasa =
    typeof jogo.casa !== 'string' && jogo.casa?.participantes
      ? typeof jogo.casa.participantes === 'string'
        ? jogo.casa.participantes
        : jogo.casa.participantes.map((p) => p.nome).join(' & ')
      : null;

  const partFora =
    typeof jogo.fora !== 'string' && jogo.fora?.participantes
      ? typeof jogo.fora.participantes === 'string'
        ? jogo.fora.participantes
        : jogo.fora.participantes.map((p) => p.nome).join(' & ')
      : null;

  return (
    <div
      className={`w-72 bg-slate-800/90 border rounded-xl p-3 flex flex-col gap-2 shadow-md transition-all ${
        bloqueado ? 'border-slate-700/50 bg-slate-900/40 opacity-75' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      {/* Time da Casa */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={getEscudo(nomeCasa)}
            alt={nomeCasa}
            onError={(e) => {
              e.target.src = isAguardando ? escudoOff : escudoGen;
            }}
            className="w-7 h-7 object-contain shrink-0"
          />
          <div className="truncate">
            <p className={`text-sm font-bold truncate ${nomeCasa === 'Aguardando' ? 'text-slate-500 italic' : 'text-white'}`}>
              {nomeCasa}
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
          className="w-9 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-sm font-black text-white focus:outline-none focus:border-emerald-500 disabled:opacity-30"
        />
      </div>

      {/* Time Visitante */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={getEscudo(nomeFora)}
            alt={nomeFora}
            onError={(e) => {
              e.target.src = isAguardando ? escudoOff : escudoGen;
            }}
            className="w-7 h-7 object-contain shrink-0"
          />
          <div className="truncate">
            <p className={`text-sm font-bold truncate ${nomeFora === 'Aguardando' ? 'text-slate-500 italic' : 'text-white'}`}>
              {nomeFora}
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
          className="w-9 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-sm font-black text-white focus:outline-none focus:border-emerald-500 disabled:opacity-30"
        />
      </div>

      {/* Ações do Card (Editar Placar, W.O., Pênaltis e Salvar) */}
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
                      className="w-6 text-center bg-slate-900 border border-slate-600 rounded text-xs"
                    />
                    <span>×</span>
                    <input
                      type="text"
                      value={penVisitante}
                      onChange={(e) => handleNumeroChange(setPenVisitante, e.target.value)}
                      className="w-6 text-center bg-slate-900 border border-slate-600 rounded text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleWO('casa')}
                      className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-[9px] font-bold uppercase text-slate-300 rounded"
                      title="Vitória por W.O. (1x0)"
                    >
                      W.O. Casa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWO('fora')}
                      className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-[9px] font-bold uppercase text-slate-300 rounded"
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
                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-2.5 py-1 rounded text-[11px] font-black uppercase transition-all shadow-sm ml-auto"
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
                className="flex items-center justify-center gap-1.5 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded text-[11px] font-bold uppercase transition-all"
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
    </div>
  );
}

// Componente principal que gerencia e renderiza o chaveamento do torneio
export default function Chaveamento({ torneio, dadosSorteados }) {
  const [rodadaSelecionada, setRodadaSelecionada] = useState(1);
  const [dadosTorneio, setDadosTorneio] = useState(dadosSorteados);
  const [prevSorteados, setPrevSorteados] = useState(dadosSorteados);
  const [statusTorneio, setStatusTorneio] = useState(torneio?.status || 'ativo');
  const [abaCopa, setAbaCopa] = useState('grupos');

  if (dadosSorteados !== prevSorteados) {
    setPrevSorteados(dadosSorteados);
    setDadosTorneio(dadosSorteados);
  }

  if (!dadosTorneio || !dadosTorneio.chaveamento) {
    return (
      <div className="w-full text-center py-12 bg-slate-800/60 rounded-2xl border border-slate-700">
        <p className="text-slate-400">
          Nenhum chaveamento gerado para {torneio?.nome || 'este torneio'} ainda.
        </p>
      </div>
    );
  }

  const { formato_torneio, chaveamento, classificacao = [] } = dadosTorneio;
  const isFinalizado = statusTorneio === 'finalizado';

  // Atualiza o estado local ao receber novos dados da API
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

  // Encerra a etapa atual ou finaliza o torneio no back-end
  const handleFinalizar = async () => {
    const textoConfirmacao =
      formato_torneio === 'copa' && statusTorneio === 'fase_grupos'
        ? 'Deseja finalizar a Fase de Grupos? Os confrontos do Mata-Mata serão gerados e os placares de grupo bloqueados.'
        : 'Deseja finalizar o torneio? Todas as alterações de placar serão bloqueadas permanentemente.';

    if (!window.confirm(textoConfirmacao)) return;

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
      alert(err.response?.data?.detail || 'Erro ao finalizar etapa.');
    }
  };

  // Processa e desenha a árvore de confrontos eliminatórios
  const renderArvoreEliminatoria = (arvoreDados, isBloqueadoPorFase = false) => {
    const arvoreProcessada = {};
    
    Object.keys(arvoreDados || {}).forEach((fase) => {
      if (
        fase === 'Final' ||
        fase === 'Terceiro Lugar' ||
        fase === 'Decisões' ||
        (fase.includes('Final') && fase.includes('Decis'))
      ) {
        if (!arvoreProcessada['Decisões']) {
          arvoreProcessada['Decisões'] = [];
        }
        arvoreProcessada['Decisões'].push(...arvoreDados[fase]);
      } else {
        arvoreProcessada[fase] = arvoreDados[fase];
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

    return (
      <div className="overflow-x-auto pb-8 pt-2">
        <div className="flex items-stretch justify-start md:justify-center gap-8 min-w-max px-4">
          {fases.map((nomeFase) => (
            <div key={nomeFase} className="flex flex-col justify-around gap-6 relative">
              <div className="text-center pb-2 border-b border-slate-700/80 mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  {nomeFase === 'Decisões' ? 'Decisões' : nomeFase}
                </span>
              </div>

              <div
                className={`flex flex-col flex-1 ${
                  nomeFase === 'Decisões' ? 'justify-between py-2' : 'justify-around gap-6'
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
                          ? 'my-auto z-10'
                          : isTerceiro
                          ? 'mb-2 mt-0 opacity-75 hover:opacity-100 scale-90 transition-all'
                          : ''
                      }`}
                    >
                      {(isFinal || isTerceiro) && (
                        <span
                          className={`flex flex-row items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            isFinal
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
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
                        idx={idx}
                        jogo={jogo}
                        formato={formato_torneio}
                        rodadaOuFase={jogo.fase || nomeFase}
                        torneioId={torneio?.id}
                        onPlacarSalvo={handleAtualizarDados}
                        isBloqueado={isFinalizado || isBloqueadoPorFase}
                        isEliminatorio={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderiza a estrutura do Modo Copa (Fase de Grupos + Chaveamento)
  const renderCopa = () => {
    const grupos = chaveamento.grupos || {};
    const arvoreMataMata = chaveamento.arvore || {};
    const nomesGrupos = Object.keys(grupos);
    const inFaseGrupos = statusTorneio === 'fase_grupos' || statusTorneio === 'ativo';

    return (
      <div className="space-y-8">
        <div className="flex justify-center border-b border-slate-700 pb-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setAbaCopa('grupos')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
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
              className={`flex items-center justify-center gap-1.5 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
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

        {abaCopa === 'grupos' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nomesGrupos.map((nomeGrupo) => {
              const tabelaGrupo = Array.isArray(classificacao)
                ? classificacao
                : classificacao[nomeGrupo] || [];

              return (
                <div key={nomeGrupo} className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                      <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-sm">{nomeGrupo}</h4>
                    </div>
                    <div className="p-4 space-y-3 flex flex-col items-center">
                      {grupos[nomeGrupo].map((item, idx) => (
                        <CardPartida 
                          key={`${item.id || idx}-${item.gols_casa}-${item.gols_visitante}`} 
                          idx={idx} 
                          jogo={item} 
                          formato={formato_torneio} 
                          rodadaOuFase={nomeGrupo}
                          torneioId={torneio?.id}
                          onPlacarSalvo={handleAtualizarDados}
                          isBloqueado={!inFaseGrupos || isFinalizado}
                          isEliminatorio={false}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-700/60 bg-slate-900/40">
                    <TabelaClassificacao classificacao={tabelaGrupo} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {inFaseGrupos && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs text-center font-bold">
                Conclua e finalize a Fase de Grupos para habilitar os jogos do Mata-Mata!
              </div>
            )}
            {renderArvoreEliminatoria(arvoreMataMata, inFaseGrupos)}
          </div>
        )}
      </div>
    );
  };

  // Renderiza a tabela e rodadas de Pontos Corridos
  const renderPontosCorridos = () => {
    const tabela = chaveamento.tabela || [];
    const totalRodadas = chaveamento.total_rodadas || 1;
    const jogosRodada = tabela.filter((jogo) => jogo.rodada === rodadaSelecionada);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            Pontos <span className="text-emerald-400">Corridos</span>
          </h3>
        </div>

        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
          {Array.from({ length: totalRodadas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setRodadaSelecionada(num)}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                rodadaSelecionada === num
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {num}ª
            </button>
          ))}
        </div>

        <div className="space-y-3 flex flex-col items-center">
          {jogosRodada.map((jogo, idx) => (
            <CardPartida 
              key={`${jogo.id || idx}-${jogo.gols_casa}-${jogo.gols_visitante}`} 
              idx={idx} 
              jogo={jogo} 
              formato={formato_torneio} 
              rodadaOuFase={`Rodada ${jogo.rodada}`}
              torneioId={torneio?.id}
              onPlacarSalvo={handleAtualizarDados}
              isBloqueado={isFinalizado}
              isEliminatorio={false}
            />
          ))}
        </div>

        <TabelaClassificacao classificacao={classificacao} />
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 space-y-8">
      {formato_torneio === 'copa' && renderCopa()}
      {formato_torneio === 'pontos_corridos' && renderPontosCorridos()}
      {formato_torneio === 'mata_mata' && renderArvoreEliminatoria(chaveamento.arvore, isFinalizado)}

      {/* Botão para finalizar fase ou encerrar o torneio com ícone de apito */}
      {!isFinalizado ? (
        <div className="flex justify-center pt-4 border-t border-slate-700/60">
          <button
            onClick={handleFinalizar}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <img src={whistleIcon} alt="Apito" className="w-4 h-4 shrink-0" />
            <span>
              {formato_torneio === 'copa' && statusTorneio === 'fase_grupos'
                ? 'Finalizar Fase de Grupos'
                : 'Finalizar Torneio'}
            </span>
          </button>
        </div>
      ) : (
        <div className="text-center py-4 bg-slate-800/80 border border-slate-700 rounded-xl text-emerald-400 font-bold text-sm">
          ✓ Torneio Finalizado
        </div>
      )}
    </div>
  );
}