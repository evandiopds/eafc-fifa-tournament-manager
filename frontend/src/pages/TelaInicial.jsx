import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Importação dinâmica de até 12 capas da pasta assets/capas
const modulosCapas = import.meta.glob('../assets/capas/*.{png,jpg,jpeg,webp}', { eager: true });
const listaCapas = Object.values(modulosCapas).map((m) => m.default).slice(0, 12);

const DESCRICOES_FORMATO = {
  pontos_corridos: {
    titulo: 'Pontos Corridos (Ida e Volta)',
    texto: 'Todos jogam contra todos em dois turnos (Carrossel). A regularidade premia o campeão com mais pontos ao final de todas as rodadas!'
  },
  mata_mata: {
    titulo: 'Mata-Mata Eliminatório',
    texto: 'Confrontos diretos em chaveamento eliminatório. Quem vence avança de fase, quem perde se despede. Emoção de final a cada jogo!'
  },
  copa: {
    titulo: 'Copa (Fase de Grupos + Chaveamento)',
    texto: 'Divisão inteligente e equilibrada em grupos (estilo distribuição de baralho), ideal para misturar oponentes antes do mata-mata!'
  }
};

export default function TelaInicial({ onTorneioAcessado }) {
  const [abaAtual, setAbaAtual] = useState('acessar');

  const [nomeOuId, setNomeOuId] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [formato, setFormato] = useState('mata_mata');
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleAcessar = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await axios.post(`${API_URL}/torneios/acessar`, {
        nome_ou_id: nomeOuId,
        senha: senha
      });

      onTorneioAcessado(resposta.data);
    } catch (err) {
      setErro(
        err.response?.data?.detail || 'Não foi possível acessar. Verifique o Nome/ID e a senha.'
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await axios.post(`${API_URL}/torneios`, {
        nome: nomeOuId,
        formato: formato,
        senha: senha
      });

      const acesso = await axios.post(`${API_URL}/torneios/acessar`, {
        nome_ou_id: nomeOuId,
        senha: senha
      });

      onTorneioAcessado(acesso.data);
    } catch (err) {
      setErro(
        err.response?.data?.detail || 'Erro ao criar torneio. Tente outro nome ou verifique os dados.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    // Prende a tela nas 4 extremidades do navegador (fixed inset-0), impedindo rolagem
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Background Mosaico com capas de jogos */}
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

      {/* Card Principal Animado com geometria angular */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-md p-6 sm:p-8 shadow-2xl backdrop-blur-md"
      >
        {/* Cabeçalho */}
        <div className="text-center mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold text-white tracking-wider">
            E-FUT <span className="text-emerald-400">MANAGER</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            {abaAtual === 'acessar'
              ? 'Gestão de Competições de Futebol Virtual'
              : 'Configuração Inicial de Torneio'}
          </p>
        </div>

        {/* Mensagem de Erro Animada */}
        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-2.5 bg-rose-500/20 border-l-4 border-rose-500 rounded-r-sm text-rose-300 text-xs text-center font-bold overflow-hidden"
            >
              {erro}
            </motion.div>
          )}
        </AnimatePresence>

        {/* TRANSIÇÃO DE ABAS COM ANIMATEPRESENCE */}
        <AnimatePresence mode="wait">
          {abaAtual === 'acessar' ? (
            <motion.form
              key="aba-acessar"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleAcessar}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nome do Torneio
                </label>
                <input
                  type="text"
                  required
                  value={nomeOuId}
                  onChange={(e) => setNomeOuId(e.target.value)}
                  placeholder="Digite o nome do torneio"
                  className="w-full bg-slate-950 border border-slate-700 rounded-sm px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha do torneio"
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm pl-4 pr-11 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black py-3 rounded-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 text-xs mt-2"
              >
                {carregando ? 'Verificando...' : 'Acessar Torneio'}
              </button>

              {/* Alternar para Criação */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <p className="text-slate-500 text-xs uppercase tracking-wide">Não possui um torneio?</p>
                <button
                  type="button"
                  onClick={() => {
                    setErro(null);
                    setAbaAtual('criar');
                  }}
                  className="mt-1 text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-wider hover:underline"
                >
                  Criar Novo Torneio
                </button>
              </div>
            </motion.form>
          ) : (
            /* ABA 2: CRIAR TORNEIO */
            <motion.form
              key="aba-criar"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleCriar}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nome do Torneio (Único)
                </label>
                <input
                  type="text"
                  required
                  value={nomeOuId}
                  onChange={(e) => setNomeOuId(e.target.value)}
                  placeholder="Digite o nome do torneio"
                  className="w-full bg-slate-950 border border-slate-700 rounded-sm px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Senha de Proteção
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Crie uma senha de acesso"
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm pl-4 pr-11 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* SELETOR HORIZONTAL DE FORMATOS */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Formato de Disputa
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-sm border border-slate-800">
                  {[
                    { id: 'pontos_corridos', label: 'PONTOS C.' },
                    { id: 'mata_mata', label: 'MATA-MATA' },
                    { id: 'copa', label: 'COPA' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormato(item.id)}
                      className={`py-1.5 text-[11px] font-black uppercase tracking-wider rounded-sm transition-all ${
                        formato === item.id
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* CAIXA DESCRITIVA DINÂMICA ANIMADA */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={formato}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-2.5 p-3 bg-slate-950/80 border-l-2 border-emerald-500 rounded-r-sm"
                  >
                    <h4 className="text-xs font-black text-emerald-400 uppercase mb-0.5">
                      {DESCRICOES_FORMATO[formato].titulo}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {DESCRICOES_FORMATO[formato].texto}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black py-3 rounded-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 text-xs mt-1"
              >
                {carregando ? 'Criando Torneio...' : 'Criar e Continuar'}
              </button>

              {/* Alternar para Acesso */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErro(null);
                    setAbaAtual('acessar');
                  }}
                  className="mt-1 text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-wider hover:underline"
                >
                  Voltar para Acessar Torneio
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}