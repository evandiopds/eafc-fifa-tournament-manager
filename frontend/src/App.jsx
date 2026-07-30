import { useState } from 'react';
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
      {/* 1. SE NÃO TIVER TORNEIO ATIVO -> EXIBE A TELA INICIAL */}
      {!torneioAtivo ? (
        <TelaInicial
          onTorneioAcessado={(dadosTorneio) => {
            setTorneioAtivo(dadosTorneio);
          }}
        />
      ) : (
        /* SE ESTIVER COM TORNEIO ATIVO -> ABA SUPERIOR + CONTEÚDO */
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between mb-6 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-emerald-400">
                {torneioAtivo.nome}
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Formato: {torneioAtivo.formato.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleTrocarTorneio}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg font-semibold text-slate-200 transition-colors"
            >
              Trocar Torneio
            </button>
          </div>

          {/* 2. SE NÃO GEROU O CHAVEAMENTO AINDA -> EXIBE O FLUXO DE PARTICIPANTES */}
          {!dadosSorteados ? (
            <FluxoParticipantes
              torneio={torneioAtivo}
              onSorteioConcluido={(resultadoBackend) => {
                console.log("🎲 Sorteio gerado pelo Back-End:", resultadoBackend);
                setDadosSorteados(resultadoBackend);
              }}
            />
          ) : (
            /* 3. QUANDO GERAR -> MOSTRA O CHAVEAMENTO DO TORNEIO */
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