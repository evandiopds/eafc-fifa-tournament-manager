import { useState } from 'react';
import axios from 'axios';
import { buscarTime } from '../utils/teamSearch';
import escudoGen from '../assets/escudo_gen.svg';
import escudoOff from '../assets/escudo_off.svg';
import TabelaClassificacao from './TabelaClassificacao';

const API_URL = 'http://127.0.0.1:8000/api';

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

// Card individual da partida na Árvore
function CardPartida({ jogo, idx, formato, rodadaOuFase, torneioId, onPlacarSalvo }) {
  const [golsCasa, setGolsCasa] = useState(jogo.gols_casa ?? '');
  const [golsVisitante, setGolsVisitante] = useState(jogo.gols_visitante ?? '');
  const [penCasa, setPenCasa] = useState(jogo.penaltis_casa ?? '');
  const [penVisitante, setPenVisitante] = useState(jogo.penaltis_visitante ?? '');
  const [statusMsg, setStatusMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const nomeCasa = typeof jogo.casa === 'string' ? jogo.casa : jogo.casa?.time || jogo.time || 'Aguardando';
  const nomeFora = typeof jogo.fora === 'string' ? jogo.fora : jogo.fora?.time || jogo.visitante?.time || 'Aguardando';

  const isAguardando = nomeCasa === 'Aguardando' || nomeFora === 'Aguardando';

  const handleNumeroChange = (setter, valor) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    setter(apenasNumeros);
  };

  const empatadoNoMataMata =
    !isAguardando &&
    formato === 'mata_mata' &&
    golsCasa !== '' &&
    golsVisitante !== '' &&
    Number(golsCasa) === Number(golsVisitante);

  const handleSalvarPlacar = async () => {
    if (isAguardando) return;

    if (golsCasa === '' || golsVisitante === '') {
      setStatusMsg({ erro: true, texto: 'Preencha o placar!' });
      return;
    }

    const finalGolsCasa = Number(golsCasa);
    const finalGolsVisitante = Number(golsVisitante);

    if (formato === 'mata_mata' && finalGolsCasa === finalGolsVisitante) {
      if (penCasa === '' || penVisitante === '') {
        setStatusMsg({ erro: true, texto: 'Empate exige pênaltis!' });
        return;
      }
    }

    setCarregando(true);
    setStatusMsg(null);

    try {
      const resp = await axios.post(`${API_URL}/torneios/placar`, {
        torneio_id: torneioId,
        formato_torneio: formato,
        rodada_ou_fase: rodadaOuFase,
        index_partida: idx,
        gols_casa: finalGolsCasa,
        gols_visitante: finalGolsVisitante,
        penaltis_casa: empatadoNoMataMata ? Number(penCasa) : null,
        penaltis_visitante: empatadoNoMataMata ? Number(penVisitante) : null,
      });

      setStatusMsg({ erro: false, texto: 'Salvo!' });

      // Atualiza a tabela de classificação em tempo real se retornada pelo backend
      if (resp.data?.classificacao && onPlacarSalvo) {
        onPlacarSalvo(resp.data.classificacao);
      }
    } catch (err) {
      setStatusMsg({
        erro: true,
        texto: err.response?.data?.detail || 'Erro ao salvar',
      });
    } finally {
      setCarregando(false);
    }
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
        isAguardando ? 'border-slate-700/50 bg-slate-900/40 opacity-75' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      {/* Mandante */}
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
          disabled={isAguardando}
          value={golsCasa}
          onChange={(e) => handleNumeroChange(setGolsCasa, e.target.value)}
          placeholder="-"
          className="w-9 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-sm font-black text-white focus:outline-none focus:border-emerald-500 disabled:opacity-30"
        />
      </div>

      {/* Visitante */}
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
          disabled={isAguardando}
          value={golsVisitante}
          onChange={(e) => handleNumeroChange(setGolsVisitante, e.target.value)}
          placeholder="-"
          className="w-9 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-sm font-black text-white focus:outline-none focus:border-emerald-500 disabled:opacity-30"
        />
      </div>

      {/* Botão de salvar placar condicional */}
      {!isAguardando && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-700/40">
          {empatadoNoMataMata ? (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
              <span>Pênaltis:</span>
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
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Placar Oficial
            </span>
          )}

          <button
            onClick={handleSalvarPlacar}
            disabled={carregando}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1 rounded text-[11px] font-black uppercase transition-all shadow-sm ml-auto"
          >
            {carregando ? '...' : 'Salvar ✓'}
          </button>
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

export default function Chaveamento({ torneio, dadosSorteados }) {
  const [rodadaSelecionada, setRodadaSelecionada] = useState(1);
  
  // Guardamos apenas atualizações feitas ao salvar placares na tela
  const [tabelaAtualizada, setTabelaAtualizada] = useState(null);

  if (!dadosSorteados || !dadosSorteados.chaveamento) {
    return (
      <div className="w-full text-center py-12 bg-slate-800/60 rounded-2xl border border-slate-700">
        <p className="text-slate-400">
          Nenhum chaveamento gerado para {torneio?.nome || 'este torneio'} ainda.
        </p>
      </div>
    );
  }

  const { formato_torneio, chaveamento } = dadosSorteados;

  // A tabela exibida será a atualizada em tempo real (se existir), ou a inicial do chaveamento
  const classificacao =
    tabelaAtualizada ||
    chaveamento?.classificacao ||
    dadosSorteados?.classificacao ||
    [];

  const handleAtualizarClassificacao = (novaClassificacao) => {
    if (novaClassificacao && Array.isArray(novaClassificacao)) {
      setTabelaAtualizada(novaClassificacao);
    }
  };

  const renderCopa = () => {
    const grupos = chaveamento.grupos || {};
    const nomesGrupos = Object.keys(grupos);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            Fase de <span className="text-emerald-400">Grupos</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nomesGrupos.map((nomeGrupo) => (
            <div key={nomeGrupo} className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-sm">{nomeGrupo}</h4>
              </div>
              <div className="p-4 space-y-3">
                {grupos[nomeGrupo].map((item, idx) => (
                  <CardPartida 
                    key={idx} 
                    idx={idx} 
                    jogo={item} 
                    formato={formato_torneio} 
                    rodadaOuFase={nomeGrupo}
                    torneioId={torneio?.id}
                    onPlacarSalvo={handleAtualizarClassificacao}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tabela de Classificação da Copa */}
        <TabelaClassificacao classificacao={classificacao} />
      </div>
    );
  };

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

        <div className="space-y-3">
          {jogosRodada.map((jogo, idx) => (
            <CardPartida 
              key={idx} 
              idx={idx} 
              jogo={jogo} 
              formato={formato_torneio} 
              rodadaOuFase={`Rodada ${jogo.rodada}`}
              torneioId={torneio?.id}
              onPlacarSalvo={handleAtualizarClassificacao}
            />
          ))}
        </div>

        {/* TASK #39: Componente TabelaClassificacao logo abaixo dos confrontos da rodada */}
        <TabelaClassificacao classificacao={classificacao} />
      </div>
    );
  };

  const renderMataMata = () => {
    const arvore = chaveamento.arvore || {};
    const fases = Object.keys(arvore);

    if (fases.length === 0) {
      const confrontos = chaveamento.partidas_iniciais || [];
      return (
        <div className="space-y-4">
          {confrontos.map((jogo, idx) => (
            <CardPartida 
              key={idx} 
              idx={idx} 
              jogo={jogo} 
              formato={formato_torneio} 
              rodadaOuFase="Mata-Mata"
              torneioId={torneio?.id}
              onPlacarSalvo={handleAtualizarClassificacao}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            Árvore do <span className="text-emerald-400">Torneio</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
            Acompanhe o caminho até a grande final
          </p>
        </div>

        <div className="overflow-x-auto pb-8 pt-2">
          <div className="flex items-stretch justify-start md:justify-center gap-8 min-w-max px-4">
            {fases.map((nomeFase) => (
              <div key={nomeFase} className="flex flex-col justify-around gap-6 relative">
                <div className="text-center pb-2 border-b border-slate-700/80 mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                    {nomeFase}
                  </span>
                </div>

                <div className="flex flex-col justify-around flex-1 gap-6">
                  {arvore[nomeFase].map((jogo, idx) => (
                    <CardPartida
                      key={idx}
                      idx={idx}
                      jogo={jogo}
                      formato={formato_torneio}
                      rodadaOuFase={nomeFase}
                      torneioId={torneio?.id}
                      onPlacarSalvo={handleAtualizarClassificacao}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {formato_torneio === 'copa' && renderCopa()}
      {formato_torneio === 'pontos_corridos' && renderPontosCorridos()}
      {formato_torneio === 'mata_mata' && renderMataMata()}
    </div>
  );
}