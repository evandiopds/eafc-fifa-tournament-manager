import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import TelaInicial from './pages/TelaInicial';
import FluxoParticipantes from './components/FluxoParticipantes';
import Chaveamento from './components/Chaveamento';

export default function App() {
  const [torneioAtivo, setTorneioAtivo] = useState(null);
  const [dadosSorteados, setDadosSorteados] = useState(null);

  const handleTrocarTorneio = () => {
    setTorneioAtivo(null);
    setDadosSorteados(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-white">
      {/* 1. SEM TORNEIO ATIVO -> RENDERIZA TELA INICIAL */}
      {!torneioAtivo ? (
        <TelaInicial
          onTorneioAcessado={(respostaAcesso) => {
            const dadosTorneio = respostaAcesso.torneio || respostaAcesso;
            setTorneioAtivo(dadosTorneio);

            if (respostaAcesso.dados_sorteados) {
              setDadosSorteados(respostaAcesso.dados_sorteados);
            } else {
              setDadosSorteados(null);
            }
          }}
        />
      ) : (
        /* 2. COM TORNEIO ATIVO -> BARRA SUPERIOR DE CONTROLE */
        <div className="w-full max-w-6xl mx-auto py-4">
          <div className="flex items-center justify-between mb-6 bg-slate-900/95 p-4 rounded-md border border-slate-800 shadow-lg backdrop-blur-md">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wider">
                {torneioAtivo.nome}
              </h2>
              <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold mt-0.5">
                Formato: {torneioAtivo.formato.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleTrocarTorneio}
              className="flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 px-3.5 py-2 rounded-sm font-black uppercase tracking-wider text-slate-400 hover:text-rose-400 transition-all shadow-sm"
              title="Sair / Trocar Torneio"
            >
              <Minimize2 className="w-3.5 h-3.5 shrink-0" />
              <span>SAIR</span>
            </button>
          </div>

          {/* 3. FLUXO DE NAVEGAÇÃO INTERNA */}
          {!dadosSorteados ? (
            <FluxoParticipantes
              torneio={torneioAtivo}
              onSorteioConcluido={(resultadoBackend) => {
                setDadosSorteados(resultadoBackend);
              }}
              onVoltar={handleTrocarTorneio}
            />
          ) : (
            <Chaveamento 
              torneio={torneioAtivo} 
              dadosSorteados={dadosSorteados} 
            />
          )}
        </div>
      )}
    </div>
  );
}