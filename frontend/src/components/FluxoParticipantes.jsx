import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export default function FluxoParticipantes({ torneio, onSorteioConcluido }) {
  // Estado para edição do formato (Task #38)
  const [formatoTorneio, setFormatoTorneio] = useState(torneio?.formato || 'mata_mata');
  
  const [modoEntrada, setModoEntrada] = useState('aleatorio');
  const [modoJogo, setModoJogo] = useState('solo');
  const [balanceado, setBalanceado] = useState(true); 

  const [inputJogador, setInputJogador] = useState('');
  const [inputNivel, setInputNivel] = useState('Prata');
  const [inputTime, setInputTime] = useState('');
  
  const [jogadores, setJogadores] = useState([
    { nome: 'Evandio', nivel: 'Ouro' },
    { nome: 'Lucas', nivel: 'Ouro' },
    { nome: 'Ana', nivel: 'Prata' },
    { nome: 'Pedro', nivel: 'Prata' }
  ]);
  
  const [times, setTimes] = useState([
    'Real Madrid', 'Barcelona', 'Bayern de Munique', 'Manchester City'
  ]);

  const [inputNomeManual, setInputNomeManual] = useState('');
  const [inputTimeManual, setInputTimeManual] = useState('');
  const [paresManuais, setParesManuais] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const adicionarJogador = (e) => {
    e.preventDefault();
    if (!inputJogador.trim()) return;
    setJogadores([...jogadores, { nome: inputJogador.trim(), nivel: inputNivel }]);
    setInputJogador('');
  };

  const removerJogador = (index) => {
    setJogadores(jogadores.filter((_, i) => i !== index));
  };

  const adicionarTime = (e) => {
    e.preventDefault();
    if (!inputTime.trim()) return;
    setTimes([...times, inputTime.trim()]);
    setInputTime('');
  };

  const removerTime = (index) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const adicionarParManual = (e) => {
    e.preventDefault();
    if (!inputNomeManual.trim() || !inputTimeManual.trim()) return;
    setParesManuais([
      ...paresManuais,
      { participante: inputNomeManual.trim(), time: inputTimeManual.trim() }
    ]);
    setInputNomeManual('');
    setInputTimeManual('');
  };

  const removerParManual = (index) => {
    setParesManuais(paresManuais.filter((_, i) => i !== index));
  };

  const handleGerarTorneio = async () => {
    setErro(null);
    setCarregando(true);

    try {
      // Task #38: Se o usuário mudou o formato na UI, atualiza no back-end primeiro
      if (torneio?.id && formatoTorneio !== torneio.formato) {
        await axios.put(`${API_URL}/torneios/${torneio.id}/formato`, {
          formato: formatoTorneio
        });
      }

      let payload;

      if (modoEntrada === 'aleatorio') {
        payload = {
          torneio_id: torneio?.id,
          jogadores: jogadores,
          times: times,
          modo: modoJogo,
          formato_torneio: formatoTorneio,
          balanceado: balanceado,
          manual: false
        };
      } else {
        const listaNomes = paresManuais.map((p) => ({ nome: p.participante, nivel: 'Prata' }));
        const listaTimes = paresManuais.map((p) => p.time);

        payload = {
          torneio_id: torneio?.id,
          jogadores: listaNomes,
          times: listaTimes,
          modo: 'solo',
          formato_torneio: formatoTorneio,
          balanceado: false,
          manual: true
        };
      }

      const resposta = await axios.post(`${API_URL}/sorteio/gerar`, payload);
      onSorteioConcluido(resposta.data);
    } catch (err) {
      setErro(
        err.response?.data?.detail || 'Erro ao gerar chaveamento. Verifique a quantidade de times e jogadores.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800/90 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-700 pb-6 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Configurar <span className="text-emerald-400">Participantes</span>
          </h2>
          <p className="text-sm text-slate-400">
            Cadastre os jogadores e times que disputarão {torneio?.nome || 'o torneio'}
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setModoJogo('solo')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              modoJogo === 'solo'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SOLO (1v1)
          </button>
          <button
            type="button"
            onClick={() => setModoJogo('duplas')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              modoJogo === 'duplas'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            DUPLAS (2v2)
          </button>
        </div>
      </div>

      {/* Seletor de Troca Rápida de Formato do Torneio (Task #38) */}
      <div className="bg-slate-900/80 border border-slate-700 px-5 py-4 rounded-xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">Formato da Competição</p>
          <p className="text-xs text-slate-400">Você pode corrigir a modalidade antes de gerar a tabela</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setFormatoTorneio('mata_mata')}
            className={`px-3 py-1.5 rounded text-xs font-extrabold transition-all ${
              formatoTorneio === 'mata_mata'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mata-Mata
          </button>
          <button
            type="button"
            onClick={() => setFormatoTorneio('copa')}
            className={`px-3 py-1.5 rounded text-xs font-extrabold transition-all ${
              formatoTorneio === 'copa'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Modo Copa
          </button>
          <button
            type="button"
            onClick={() => setFormatoTorneio('pontos_corridos')}
            className={`px-3 py-1.5 rounded text-xs font-extrabold transition-all ${
              formatoTorneio === 'pontos_corridos'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pontos Corridos
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setModoEntrada('aleatorio')}
          className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider rounded-lg border transition-all ${
            modoEntrada === 'aleatorio'
              ? 'bg-slate-700 border-emerald-500 text-white'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
          }`}
        >
          🎲 Modo Aleatório (Sortear Membros)
        </button>
        <button
          type="button"
          onClick={() => setModoEntrada('manual')}
          className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider rounded-lg border transition-all ${
            modoEntrada === 'manual'
              ? 'bg-slate-700 border-emerald-500 text-white'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
          }`}
        >
          ✍️ Modo Manual (Times Pré-Definidos)
        </button>
      </div>

      {modoEntrada === 'aleatorio' && (
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-700 px-5 py-3 rounded-xl mb-6">
          <div>
            <p className="text-sm font-bold text-white">Sorteio Balanceado por Potes (Ouro / Prata / Bronze)</p>
            <p className="text-xs text-slate-400">Distribui os níveis de habilidade de forma justa nas duplas</p>
          </div>
          <button
            type="button"
            onClick={() => setBalanceado(!balanceado)}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
              balanceado
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {balanceado ? 'Ativado (Potes)' : 'Desativado (Cego)'}
          </button>
        </div>
      )}

      {erro && (
        <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-300 text-sm text-center font-semibold">
          {erro}
        </div>
      )}

      {modoEntrada === 'aleatorio' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-sm font-bold uppercase text-emerald-400 mb-3">
              1. Lista de Jogadores ({jogadores.length})
            </h3>
            <form onSubmit={adicionarJogador} className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputJogador}
                  onChange={(e) => setInputJogador(e.target.value)}
                  placeholder="Nome do Jogador"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={inputNivel}
                  onChange={(e) => setInputNivel(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 text-xs font-bold text-emerald-400 focus:outline-none"
                >
                  <option value="Ouro">Ouro</option>
                  <option value="Prata">Prata</option>
                  <option value="Bronze">Bronze</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-lg text-xs uppercase"
              >
                Adicionar Jogador
              </button>
            </form>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {jogadores.map((j, idx) => (
                <span
                  key={idx}
                  className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-medium text-slate-200 flex items-center gap-2"
                >
                  {j.nome} <span className="text-[10px] text-emerald-400 font-bold">({j.nivel})</span>
                  <button
                    onClick={() => removerJogador(idx)}
                    className="text-rose-400 hover:text-rose-300 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-sm font-bold uppercase text-emerald-400 mb-3">
              2. Times Disponíveis ({times.length})
            </h3>
            <form onSubmit={adicionarTime} className="flex gap-2 mb-4">
              <input
                type="text"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                placeholder="Ex: Real Madrid"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 rounded-lg text-sm"
              >
                +
              </button>
            </form>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {times.map((t, idx) => (
                <span
                  key={idx}
                  className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-medium text-slate-200 flex items-center gap-2"
                >
                  {t}
                  <button
                    onClick={() => removerTime(idx)}
                    className="text-rose-400 hover:text-rose-300 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/60">
          <h3 className="text-sm font-bold uppercase text-emerald-400 mb-4">
            Vincular Jogador/Dupla ao Clube
          </h3>
          <form onSubmit={adicionarParManual} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={inputNomeManual}
              onChange={(e) => setInputNomeManual(e.target.value)}
              placeholder="Nome do Jogador ou Dupla (Ex: Carlos & Marcos)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={inputTimeManual}
              onChange={(e) => setInputTimeManual(e.target.value)}
              placeholder="Nome do Clube (Ex: Real Madrid)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold uppercase text-xs px-6 py-3 rounded-lg"
            >
              Adicionar Par
            </button>
          </form>

          <div className="space-y-2">
            {paresManuais.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Nenhum par cadastrado ainda. Adicione acima!
              </p>
            ) : (
              paresManuais.map((par, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-800 border border-slate-700 px-4 py-3 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-bold text-slate-100">{par.participante}</span>
                    <span className="text-slate-400 mx-2">→</span>
                    <span className="text-emerald-400 font-semibold">{par.time}</span>
                  </div>
                  <button
                    onClick={() => removerParManual(idx)}
                    className="text-rose-400 hover:text-rose-300 font-bold text-base px-2"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
        <button
          type="button"
          disabled={carregando}
          onClick={handleGerarTorneio}
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black uppercase text-sm px-8 py-4 rounded-xl tracking-wider transition-all shadow-lg shadow-emerald-500/20"
        >
          {carregando ? 'GERANDO TABELAS...' : 'GERAR TABELAS / CHAVEAMENTO →'}
        </button>
      </div>
    </div>
  );
}