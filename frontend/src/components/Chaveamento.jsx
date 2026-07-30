import { useState } from 'react';
import axios from 'axios';
import { buscarTime } from '../utils/teamSearch';
import escudoGen from '../assets/escudo_gen.svg';

const API_URL = 'http://127.0.0.1:8000/api';

// Busca escudo oficial ou genérico
function getEscudo(nomeTime) {
  if (!nomeTime) return escudoGen;

  const timeEncontrado = buscarTime(nomeTime);
  
  if (!timeEncontrado || timeEncontrado.escudo === '/escudo-padrao.png') {
    return escudoGen;
  }

  return timeEncontrado.escudo;
}

// Card interativo da partida
function CardPartida({ jogo, idx, formato, rodadaOuFase }) {
  const [golsCasa, setGolsCasa] = useState(jogo.gols_casa ?? '');
  const [golsVisitante, setGolsVisitante] = useState(jogo.gols_visitante ?? '');
  const [penCasa, setPenCasa] = useState(jogo.penaltis_casa ?? '');
  const [penVisitante, setPenVisitante] = useState(jogo.penaltis_visitante ?? '');
  const [statusMsg, setStatusMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Filtro que impede digitação de qualquer coisa que não seja número (0-9)
  const handleNumeroChange = (setter, valor) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    setter(apenasNumeros);
  };

  const empatadoNoMataMata =
    formato === 'mata_mata' &&
    golsCasa !== '' &&
    golsVisitante !== '' &&
    Number(golsCasa) === Number(golsVisitante);

  const handleSalvarPlacar = async () => {
    if (golsCasa === '' || golsVisitante === '') {
      setStatusMsg({ erro: true, texto: 'Preencha o placar!' });
      return;
    }

    const finalGolsCasa = Number(golsCasa);
    const finalGolsVisitante = Number(golsVisitante);

    // 2. SEGUNDO: Só verifica pênaltis se os gols foram preenchidos intencionalmente E empataram
    if (formato === 'mata_mata' && finalGolsCasa === finalGolsVisitante) {
      if (penCasa === '' || penVisitante === '') {
        setStatusMsg({ erro: true, texto: 'Empate exige pênaltis!' });
        return;
      }
    }

    setCarregando(true);
    setStatusMsg(null);

    try {
      await axios.post(`${API_URL}/torneios/placar`, {
        formato_torneio: formato,
        rodada_ou_fase: rodadaOuFase,
        index_partida: idx,
        gols_casa: finalGolsCasa,
        gols_visitante: finalGolsVisitante,
        penaltis_casa: empatadoNoMataMata ? Number(penCasa) : null,
        penaltis_visitante: empatadoNoMataMata ? Number(penVisitante) : null,
      });

      setStatusMsg({ erro: false, texto: 'Salvo!' });
    } catch (err) {
      setStatusMsg({
        erro: true,
        texto: err.response?.data?.detail || 'Erro ao salvar',
      });
    } finally {
      setCarregando(false);
    }
  };

  const nomeCasa = typeof jogo.casa === 'string' ? jogo.casa : jogo.casa?.time || jogo.time || 'Casa';
  const nomeFora = typeof jogo.fora === 'string' ? jogo.fora : jogo.fora?.time || jogo.visitante?.time || 'Visitante';

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
    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 shadow-md transition-transform hover:scale-[1.005]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Mandante com escudo */}
        <div className="flex items-center gap-3 w-full sm:w-2/5 justify-start sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-base font-extrabold text-white">{nomeCasa}</p>
            {partCasa && <p className="text-xs text-emerald-400 font-semibold">{partCasa}</p>}
          </div>
          <img
            src={getEscudo(nomeCasa)}
            alt={nomeCasa}
            onError={(e) => { e.target.src = escudoGen; }}
            className="w-10 h-10 object-contain shrink-0"
          />
        </div>

        {/* Inputs de placar (totalmente limpos e vazios quando não preenchidos) */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 py-2 px-4 rounded-xl shrink-0">
          <input
            type="text"
            inputMode="numeric"
            value={golsCasa}
            onChange={(e) => handleNumeroChange(setGolsCasa, e.target.value)}
            placeholder=""
            className="w-12 text-center bg-slate-800 border border-slate-600 rounded-lg py-1 text-lg font-black text-white focus:outline-none focus:border-emerald-500"
          />
          <span className="text-slate-500 font-bold">×</span>
          <input
            type="text"
            inputMode="numeric"
            value={golsVisitante}
            onChange={(e) => handleNumeroChange(setGolsVisitante, e.target.value)}
            placeholder=""
            className="w-12 text-center bg-slate-800 border border-slate-600 rounded-lg py-1 text-lg font-black text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSalvarPlacar}
            disabled={carregando}
            className="ml-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all shadow-sm"
          >
            {carregando ? '...' : '✓'}
          </button>
        </div>

        {/* Visitante com escudo */}
        <div className="flex items-center gap-3 w-full sm:w-2/5 justify-start">
          <img
            src={getEscudo(nomeFora)}
            alt={nomeFora}
            onError={(e) => { e.target.src = escudoGen; }}
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="text-left">
            <p className="text-base font-extrabold text-white">{nomeFora}</p>
            {partFora && <p className="text-xs text-emerald-400 font-semibold">{partFora}</p>}
          </div>
        </div>
      </div>

      {/* Painel condicional de pênaltis */}
      {empatadoNoMataMata && (
        <div className="flex items-center justify-center gap-3 bg-slate-900/90 border border-emerald-500/40 p-2 rounded-lg mt-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Pênaltis:
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={penCasa}
            onChange={(e) => handleNumeroChange(setPenCasa, e.target.value)}
            placeholder=""
            className="w-10 text-center bg-slate-800 border border-slate-600 rounded text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
          />
          <span className="text-slate-500 text-xs">×</span>
          <input
            type="text"
            inputMode="numeric"
            value={penVisitante}
            onChange={(e) => handleNumeroChange(setPenVisitante, e.target.value)}
            placeholder=""
            className="w-10 text-center bg-slate-800 border border-slate-600 rounded text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Feedback de salvamento */}
      {statusMsg && (
        <p
          className={`text-center text-xs font-semibold ${
            statusMsg.erro ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {statusMsg.texto}
        </p>
      )}
    </div>
  );
}

export default function Chaveamento({ torneio, dadosSorteados }) {
  const [rodadaSelecionada, setRodadaSelecionada] = useState(1);

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
            <div
              key={nomeGrupo}
              className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-xl"
            >
              <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-sm">
                  {nomeGrupo}
                </h4>
              </div>
              <div className="p-4 space-y-3">
                {grupos[nomeGrupo].map((item, idx) => (
                  <CardPartida
                    key={idx}
                    idx={idx}
                    jogo={item}
                    formato={formato_torneio}
                    rodadaOuFase={nomeGrupo}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
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
            />
          ))}
        </div>
      </div>
    );
  };

  const renderMataMata = () => {
    const confrontos = chaveamento.partidas_iniciais || chaveamento.confrontos || [];
    const faseAtual = chaveamento.fase || 'Mata-Mata';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            {faseAtual} <span className="text-emerald-400">Eliminatória</span>
          </h3>
        </div>

        <div className="space-y-4">
          {confrontos.map((jogo, idx) => (
            <CardPartida
              key={idx}
              idx={idx}
              jogo={jogo}
              formato={formato_torneio}
              rodadaOuFase={faseAtual}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      {formato_torneio === 'copa' && renderCopa()}
      {formato_torneio === 'pontos_corridos' && renderPontosCorridos()}
      {formato_torneio === 'mata_mata' && renderMataMata()}
    </div>
  );
}