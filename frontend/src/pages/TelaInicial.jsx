import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

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

      // CORREÇÃO: Enviamos o pacote completo (resposta.data) com torneio + dados_sorteados
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

      // CORREÇÃO: Enviamos o pacote completo (acesso.data) para padronizar a resposta
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
    <div className="w-full max-w-md bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wider">
          EAFC <span className="text-emerald-400">MANAGER</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {abaAtual === 'acessar'
            ? 'Acesse seu torneio para gerenciar jogos e tabelas'
            : 'Configure um novo torneio para começar'}
        </p>
      </div>

      {/* Mensagem de Erro (se houver) */}
      {erro && (
        <div className="mb-6 p-3 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-300 text-sm text-center font-medium">
          {erro}
        </div>
      )}

      {/* ABA 1: ACESSAR TORNEIO */}
      {abaAtual === 'acessar' ? (
        <form onSubmit={handleAcessar} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Nome ou ID do Torneio
            </label>
            <input
              type="text"
              required
              value={nomeOuId}
              onChange={(e) => setNomeOuId(e.target.value)}
              placeholder="Ex: MasterLeague"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-lg uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
          >
            {carregando ? 'Verificando...' : 'Acessar Torneio'}
          </button>

          {/* Opção abaixo de Acessar para Criar */}
          <div className="pt-4 border-t border-slate-700/60 text-center">
            <p className="text-slate-400 text-sm">Não possui um torneio?</p>
            <button
              type="button"
              onClick={() => {
                setErro(null);
                setAbaAtual('criar');
              }}
              className="mt-1 text-emerald-400 hover:text-emerald-300 font-semibold text-sm hover:underline"
            >
              Criar Novo Torneio →
            </button>
          </div>
        </form>
      ) : (
        /* ABA 2: CRIAR TORNEIO */
        <form onSubmit={handleCriar} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Nome do Torneio (Único)
            </label>
            <input
              type="text"
              required
              value={nomeOuId}
              onChange={(e) => setNomeOuId(e.target.value)}
              placeholder="Ex: Liga dos Campeões 2026"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Senha de Proteção
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Crie uma senha de acesso"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* SELETOR HORIZONTAL DE FORMATOS */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Formato de Disputa
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-700">
              {[
                { id: 'pontos_corridos', label: 'PONTOS C.' },
                { id: 'mata_mata', label: 'MATA-MATA' },
                { id: 'copa', label: 'COPA' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormato(item.id)}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    formato === item.id
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* CAIXA DESCRITIVA DINÂMICA */}
            <div className="mt-3 p-3.5 bg-slate-900/80 border border-slate-700/80 rounded-lg">
              <h4 className="text-xs font-bold text-emerald-400 uppercase mb-1">
                {DESCRICOES_FORMATO[formato].titulo}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {DESCRICOES_FORMATO[formato].texto}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-lg uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
          >
            {carregando ? 'Criando Torneio...' : 'Criar e Continuar'}
          </button>

          {/* Opção abaixo de Criar para voltar ao Acesso */}
          <div className="pt-4 border-t border-slate-700/60 text-center">
            <button
              type="button"
              onClick={() => {
                setErro(null);
                setAbaAtual('acessar');
              }}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Voltar para Acessar Torneio
            </button>
          </div>
        </form>
      )}
    </div>
  );
}