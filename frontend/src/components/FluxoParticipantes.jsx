import { Dices, PencilLine, Trash2, LogOut, Plus } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Importa dinamicamente imagens para o plano de fundo temático
const modulosCapas = import.meta.glob('../assets/capas/*.{png,jpg,jpeg,webp}', { eager: true });
const listaCapas = Object.values(modulosCapas).map((m) => m.default).slice(0, 12);

export default function FluxoParticipantes({ torneio, onSorteioConcluido }) {
  // Configurações do Torneio
  const [formatoTorneio, setFormatoTorneio] = useState(torneio?.formato || 'mata_mata');
  const [modoEntrada, setModoEntrada] = useState('aleatorio');
  const [modoJogo, setModoJogo] = useState('solo');
  const [balanceado, setBalanceado] = useState(true); 

  // Estados de Entrada - Modo Aleatório
  const [inputJogador, setInputJogador] = useState('');
  const [inputNivel, setInputNivel] = useState('Prata');
  const [inputTime, setInputTime] = useState('');
  
  // Listas limpas sem dados pré-cadastrados (Mocks removidos)
  const [jogadores, setJogadores] = useState([]);
  const [times, setTimes] = useState([]);

  // Estados de Entrada - Modo Manual
  const [inputNomeManual, setInputNomeManual] = useState('');
  const [inputTimeManual, setInputTimeManual] = useState('');
  const [paresManuais, setParesManuais] = useState([]);

  // Controle de UI e Avisos
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Adiciona jogador garantindo que o nick seja único na lista
  const adicionarJogador = (e) => {
    e.preventDefault();
    const nomeLimpo = inputJogador.trim();
    if (!nomeLimpo) return;

    const nomeJaExiste = jogadores.some(
      (j) => j.nome.toLowerCase() === nomeLimpo.toLowerCase()
    );

    if (nomeJaExiste) {
      setErro(`O jogador "${nomeLimpo}" já foi cadastrado! Nicks não podem se repetir.`);
      return;
    }

    setErro(null);
    setJogadores([...jogadores, { nome: nomeLimpo, nivel: inputNivel }]);
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

  // Adiciona par no Modo Manual com trava contra duplicidade de nick
  const adicionarParManual = (e) => {
    e.preventDefault();
    const nomeLimpo = inputNomeManual.trim();
    const timeLimpo = inputTimeManual.trim();
    if (!nomeLimpo || !timeLimpo) return;

    const nomeJaExiste = paresManuais.some(
      (p) => p.participante.toLowerCase() === nomeLimpo.toLowerCase()
    );

    if (nomeJaExiste) {
      setErro(`O jogador/dupla "${nomeLimpo}" já foi cadastrado! Nicks não podem se repetir.`);
      return;
    }

    setErro(null);
    setParesManuais([
      ...paresManuais,
      { participante: nomeLimpo, time: timeLimpo }
    ]);
    setInputNomeManual('');
    setInputTimeManual('');
  };

  const removerParManual = (index) => {
    setParesManuais(paresManuais.filter((_, i) => i !== index));
  };

  // Dispara a geração das tabelas ou chaveamentos no backend
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

  const handleSair = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 p-3 sm:p-4">
      {/* Background Temático */}
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

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #0f172a' }}
        className="relative z-10 w-full max-w-4xl mx-auto max-h-[92vh] overflow-y-auto bg-slate-900/95 border border-slate-700/80 rounded-md p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-md [scrollbar-color:_#10b981_#0f172a] [scrollbar-width:_thin]"
      >
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 sm:pb-5 mb-4 sm:mb-5 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Configurar <span className="text-emerald-400">Participantes</span>
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">
              Cadastre os jogadores e times que disputarão {torneio?.nome || 'o torneio'}
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-sm border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setModoJogo('solo')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
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
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${
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

        {/* Seletor de Formato */}
        <div className="bg-slate-950/80 border border-slate-800 px-4 sm:px-5 py-3.5 rounded-sm mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Formato da Competição</p>
            <p className="text-xs text-slate-400">Certifique-se de que está utilizando o formato correto antes de gerar a tabela.</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto bg-slate-900 p-1 rounded-sm border border-slate-800 gap-1 sm:gap-0">
            <button
              type="button"
              onClick={() => setFormatoTorneio('mata_mata')}
              className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-sm text-xs font-extrabold transition-all ${
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
              className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-sm text-xs font-extrabold transition-all ${
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
              className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-sm text-xs font-extrabold transition-all ${
                formatoTorneio === 'pontos_corridos'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PONTOS CORRIDOS
            </button>
          </div>
        </div>

        {/* Abas Modo Aleatório vs Modo Manual */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <button
            type="button"
            onClick={() => setModoEntrada('aleatorio')}
            className={`flex-1 py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider rounded-sm border transition-all flex items-center justify-center gap-2 ${
              modoEntrada === 'aleatorio'
                ? 'bg-slate-800 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Dices className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Modo Aleatório (Sortear)</span>
          </button>
          <button
            type="button"
            onClick={() => setModoEntrada('manual')}
            className={`flex-1 py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider rounded-sm border transition-all flex items-center justify-center gap-2 ${
              modoEntrada === 'manual'
                ? 'bg-slate-800 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <PencilLine className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Modo Manual (Pré-Definido)</span>
          </button>
        </div>

        {/* Sorteio Balanceado (Apenas visível em Duplas no Modo Aleatório) */}
        <AnimatePresence>
          {modoEntrada === 'aleatorio' && modoJogo === 'duplas' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-950/80 border border-slate-800 px-4 sm:px-5 py-3 rounded-sm mb-5 gap-3 sm:gap-0 overflow-hidden"
            >
              <div>
                <p className="text-sm font-bold text-white">Sorteio Balanceado por Potes (Ouro / Prata / Bronze)</p>
                <p className="text-xs text-slate-400">Distribui os níveis de habilidade de forma justa nas duplas</p>
              </div>
              <button
                type="button"
                onClick={() => setBalanceado(!balanceado)}
                className={`w-full sm:w-auto px-4 py-2 rounded-sm text-xs font-black uppercase transition-all ${
                  balanceado
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {balanceado ? 'Ativado (Potes)' : 'Desativado (Cego)'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerta de Erros */}
        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 bg-rose-500/20 border-l-4 border-rose-500 rounded-r-sm text-rose-300 text-xs text-center font-bold overflow-hidden"
            >
              {erro}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteúdo Dinâmico por Modo */}
        <AnimatePresence mode="wait">
          {modoEntrada === 'aleatorio' ? (
            <motion.div
              key="modo-aleatorio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* 1. Lista de Jogadores */}
              <div className="bg-slate-950/60 p-4 rounded-sm border border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3">
                  1. Lista de Jogadores ({jogadores.length})
                </h3>
                <form onSubmit={adicionarJogador} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={inputJogador}
                    onChange={(e) => setInputJogador(e.target.value)}
                    placeholder="Nome do Jogador"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  {modoJogo === 'duplas' && (
                    <select
                      value={inputNivel}
                      onChange={(e) => setInputNivel(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-sm px-2 text-xs font-bold text-emerald-400 focus:outline-none"
                    >
                      <option value="Ouro">Ouro</option>
                      <option value="Prata">Prata</option>
                      <option value="Bronze">Bronze</option>
                    </select>
                  )}
                  <button
                    type="submit"
                    title="Adicionar Jogador"
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 rounded-sm flex items-center justify-center transition-all shrink-0"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </form>

                <div
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #0f172a' }}
                  className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 [scrollbar-color:_#10b981_#0f172a] [scrollbar-width:_thin]"
                >
                  <AnimatePresence>
                    {jogadores.map((j, idx) => (
                      <motion.span
                        key={`${j.nome}-${idx}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-sm text-xs font-medium text-slate-200 flex items-center gap-1.5"
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
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* 2. Lista de Clubes / Times */}
              <div className="bg-slate-950/60 p-4 rounded-sm border border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3">
                  2. Times Disponíveis ({times.length})
                </h3>
                <form onSubmit={adicionarTime} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={inputTime}
                    onChange={(e) => setInputTime(e.target.value)}
                    placeholder="Ex: Real Madrid"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    title="Adicionar Time"
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 rounded-sm flex items-center justify-center transition-all shrink-0"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </form>

                <div
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #0f172a' }}
                  className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 [scrollbar-color:_#10b981_#0f172a] [scrollbar-width:_thin]"
                >
                  <AnimatePresence>
                    {times.map((t, idx) => (
                      <motion.span
                        key={`${t}-${idx}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-sm text-xs font-medium text-slate-200 flex items-center gap-1.5"
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
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="modo-manual"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="bg-slate-950/60 p-4 sm:p-5 rounded-sm border border-slate-800"
            >
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">
                Vincular Jogador/Dupla ao Clube
              </h3>
              <form onSubmit={adicionarParManual} className="flex flex-col sm:flex-row gap-3 mb-5">
                <input
                  type="text"
                  value={inputNomeManual}
                  onChange={(e) => setInputNomeManual(e.target.value)}
                  placeholder="Nome do Jogador ou Dupla (Ex: Carlos & Marcos)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={inputTimeManual}
                  onChange={(e) => setInputTimeManual(e.target.value)}
                  placeholder="Nome do Clube (Ex: Real Madrid)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-xs px-6 py-2 rounded-sm"
                >
                  Adicionar Par
                </button>
              </form>

              <div
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #0f172a' }}
                className="space-y-2 max-h-40 overflow-y-auto pr-1 [scrollbar-color:_#10b981_#0f172a] [scrollbar-width:_thin]"
              >
                {paresManuais.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Nenhum par cadastrado ainda. Adicione acima!
                  </p>
                ) : (
                  <AnimatePresence>
                    {paresManuais.map((par, idx) => (
                      <motion.div
                        key={`${par.participante}-${idx}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-3 rounded-sm text-sm"
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé e Ações Finais */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleSair}
            className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 font-black uppercase text-xs px-6 py-3.5 rounded-sm tracking-wider transition-all w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>SAIR DO TORNEIO</span>
          </button>

          <button
            type="button"
            disabled={carregando}
            onClick={handleGerarTorneio}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black uppercase text-xs px-8 py-3.5 rounded-sm tracking-wider transition-all shadow-lg shadow-emerald-500/20"
          >
            {carregando ? 'GERANDO TABELAS...' : 'GERAR TABELAS / CHAVEAMENTO'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}