import { Dices, PencilLine, Trash2, LogOut } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Importação dinâmica de até 12 capas da pasta assets/capas para o background
const modulosCapas = import.meta.glob('../assets/capas/*.{png,jpg,jpeg,webp}', { eager: true });
const listaCapas = Object.values(modulosCapas).map((m) => m.default).slice(0, 12);

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
          balanceado: modoJogo === 'duplas' ? balanceado : false,
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

  // Encerra a sessão e retorna o usuário diretamente para a tela de Acesso/Login
  const handleSair = () => {
    window.location.reload();
  };

  return (
    // Prende a tela nas extremidades (fixed inset-0), eliminando a barra de rolagem da janela
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Background Mosaico Fixo em segundo plano */}
      {listaCapas.length > 0 && (
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-4 gap-4 w-[130vw] min-h-[130vh] -rotate-6 scale-110 opacity-25">
            {listaCapas.map((capaUrl, idx) => (
              <div key={idx} className="w-full aspect-[3/4] overflow-hidden rounded-md border border-slate-800/60 shadow-xl">
                <img
                  src={capaUrl}
                  alt="Capa de jogo"
                  className="w-full h-full object-cover filter grayscale contrast-125"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90" />
        </div>
      )}

      {/* Card Principal com altura máxima travada (max-h-[92vh]) e rolagem interna limpa */}
      <div className="relative z-10 w-full max-w-4xl mx-auto max-h-[92vh] overflow-y-auto bg-slate-900/95 border border-slate-700/80 rounded-md p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-5 mb-5 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              Configurar <span className="text-emerald-400">Participantes</span>
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">
              Cadastre os jogadores e times que disputarão {torneio?.nome || 'o torneio'}
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => setModoJogo('solo')}
              className={`px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
                modoJogo === 'solo'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SOLO (1v1)
            </button>
            {/* Opção de Duplas com o indicador BETA elevado ao lado */}
            <button
              type="button"
              onClick={() => setModoJogo('duplas')}
              className={`flex items-center justify-center px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
                modoJogo === 'duplas'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>DUPLAS (2v2)</span>
              <sup
                className={`ml-1 text-[8px] font-black tracking-normal ${
                  modoJogo === 'duplas' ? 'text-slate-900' : 'text-amber-400'
                }`}
              >
                BETA
              </sup>
            </button>
          </div>
        </div>

        {/* Seletor de Troca Rápida de Formato do Torneio (Task #38) */}
        <div className="bg-slate-950/80 border border-slate-800 px-5 py-3.5 rounded mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Formato da Competição</p>
            <p className="text-xs text-slate-400">Certifique-se de que está utilizando o formato correto antes de gerar a tabela.</p>
          </div>
          <div className="flex bg-slate-900 p-1 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => setFormatoTorneio('mata_mata')}
              className={`px-3 py-1.5 rounded-sm text-xs font-extrabold transition-all ${
                formatoTorneio === 'mata_mata'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MATA-MATA
            </button>
            <button
              type="button"
              onClick={() => setFormatoTorneio('copa')}
              className={`px-3 py-1.5 rounded-sm text-xs font-extrabold transition-all ${
                formatoTorneio === 'copa'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MODO COPA
            </button>
            <button
              type="button"
              onClick={() => setFormatoTorneio('pontos_corridos')}
              className={`px-3 py-1.5 rounded-sm text-xs font-extrabold transition-all ${
                formatoTorneio === 'pontos_corridos'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PONTOS CORRIDOS
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setModoEntrada('aleatorio')}
            className={`flex-1 py-3 px-4 text-xs font-extrabold uppercase tracking-wider rounded border transition-all flex items-center justify-center gap-2 ${
              modoEntrada === 'aleatorio'
                ? 'bg-slate-800 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Dices className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Modo Aleatório (Sortear Jogadores e Times)</span>
          </button>
          <button
            type="button"
            onClick={() => setModoEntrada('manual')}
            className={`flex-1 py-3 px-4 text-xs font-extrabold uppercase tracking-wider rounded border transition-all flex items-center justify-center gap-2 ${
              modoEntrada === 'manual'
                ? 'bg-slate-800 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <PencilLine className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Modo Manual (Times Pré-Definidos)</span>
          </button>
        </div>

        {/* Painel de Potes exibido apenas se estiver em Modo Aleatório E em Duplas */}
        {modoEntrada === 'aleatorio' && modoJogo === 'duplas' && (
          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 px-5 py-3 rounded mb-5">
            <div>
              <p className="text-sm font-bold text-white">Sorteio Balanceado por Potes (Ouro / Prata / Bronze)</p>
              <p className="text-xs text-slate-400">Distribui os níveis de habilidade de forma justa nas duplas</p>
            </div>
            <button
              type="button"
              onClick={() => setBalanceado(!balanceado)}
              className={`px-4 py-2 rounded text-xs font-black uppercase transition-all ${
                balanceado
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {balanceado ? 'Ativado (Potes)' : 'Desativado (Cego)'}
            </button>
          </div>
        )}

        {erro && (
          <div className="mb-5 p-3.5 bg-rose-500/20 border-l-4 border-rose-500 rounded-r text-rose-300 text-xs text-center font-bold">
            {erro}
          </div>
        )}

        {modoEntrada === 'aleatorio' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950/60 p-4 rounded border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3">
                1. Lista de Jogadores ({jogadores.length})
              </h3>
              <form onSubmit={adicionarJogador} className="flex flex-col gap-2 mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputJogador}
                    onChange={(e) => setInputJogador(e.target.value)}
                    placeholder="Nome do Jogador"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  {modoJogo === 'duplas' && (
                    <select
                      value={inputNivel}
                      onChange={(e) => setInputNivel(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 text-xs font-bold text-emerald-400 focus:outline-none"
                    >
                      <option value="Ouro">Ouro</option>
                      <option value="Prata">Prata</option>
                      <option value="Bronze">Bronze</option>
                    </select>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2 rounded text-xs uppercase tracking-wider"
                >
                  Adicionar Jogador
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {jogadores.map((j, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-900 border border-slate-700 px-3 py-1 rounded text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    {j.nome}
                    {modoJogo === 'duplas' && (
                      <span className="text-[10px] text-emerald-400 font-bold">({j.nivel})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removerJogador(idx)}
                      className="text-rose-400 hover:text-rose-300 font-bold ml-1 transition-colors"
                      title="Remover jogador"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3">
                2. Times Disponíveis ({times.length})
              </h3>
              <form onSubmit={adicionarTime} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  placeholder="Ex: Real Madrid"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 rounded text-sm"
                >
                  +
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {times.map((t, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-900 border border-slate-700 px-3 py-1 rounded text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removerTime(idx)}
                      className="text-rose-400 hover:text-rose-300 font-bold ml-1 transition-colors"
                      title="Remover time"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 p-5 rounded border border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">
              Vincular Jogador/Dupla ao Clube
            </h3>
            <form onSubmit={adicionarParManual} className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                type="text"
                value={inputNomeManual}
                onChange={(e) => setInputNomeManual(e.target.value)}
                placeholder="Nome do Jogador ou Dupla (Ex: Carlos & Marcos)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={inputTimeManual}
                onChange={(e) => setInputTimeManual(e.target.value)}
                placeholder="Nome do Clube (Ex: Real Madrid)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-xs px-6 py-2 rounded"
              >
                Adicionar Par
              </button>
            </form>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {paresManuais.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Nenhum par cadastrado ainda. Adicione acima!
                </p>
              ) : (
                paresManuais.map((par, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-3 rounded text-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-100">{par.participante}</span>
                      <span className="text-slate-400 mx-2">→</span>
                      <span className="text-emerald-400 font-semibold">{par.time}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerParManual(idx)}
                      className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                      title="Remover par"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Barra inferior contendo SAIR na esquerda e GERAR CHAVEAMENTO na direita */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSair}
            className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 font-black uppercase text-xs px-6 py-3.5 rounded tracking-wider transition-all w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>SAIR DO TORNEIO</span>
          </button>

          <button
            type="button"
            disabled={carregando}
            onClick={handleGerarTorneio}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black uppercase text-xs px-8 py-3.5 rounded tracking-wider transition-all shadow-lg shadow-emerald-500/20"
          >
            {carregando ? 'GERANDO TABELAS...' : 'GERAR TABELAS / CHAVEAMENTO'}
          </button>
        </div>
      </div>
    </div>
  );
}