import { useState } from 'react';

export default function Chaveamento({ torneio, dadosSorteados }) {
  // Estado da rodada atual
  const [rodadaSelecionada, setRodadaSelecionada] = useState(1);

  // Proteção para dados vazios
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

  // Layout da Copa
  const renderCopa = () => {
    const grupos = chaveamento.grupos || {};
    const nomesGrupos = Object.keys(grupos);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            Fase de <span className="text-emerald-400">Grupos</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
            Total de Grupos: {chaveamento.total_grupos || nomesGrupos.length}
          </p>
        </div>

        {/* Grid dos grupos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nomesGrupos.map((nomeGrupo) => (
            <div
              key={nomeGrupo}
              className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Cabeçalho do grupo */}
              <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-sm">
                  {nomeGrupo}
                </h4>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-semibold border border-slate-700">
                  {grupos[nomeGrupo].length} times
                </span>
              </div>

              {/* Lista de participantes */}
              <div className="p-4 space-y-3">
                {grupos[nomeGrupo].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-900/50 hover:bg-slate-700/30 transition-colors p-3 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {typeof item.participantes === 'string'
                            ? item.participantes
                            : item.participantes.map((p) => p.nome).join(' & ')}
                        </p>
                        <p className="text-xs text-emerald-400 font-semibold">{item.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Layout de Pontos Corridos
  const renderPontosCorridos = () => {
    const tabela = chaveamento.tabela || [];
    const totalRodadas = chaveamento.total_rodadas || 1;

    // Filtra jogos por rodada
    const jogosRodada = tabela.filter((jogo) => jogo.rodada === rodadaSelecionada);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            Pontos <span className="text-emerald-400">Corridos</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
            {chaveamento.ida_e_volta ? 'Dois Turnos (Ida e Volta)' : 'Turno Único'}
          </p>
        </div>

        {/* Seletor de rodadas */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
          {Array.from({ length: totalRodadas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setRodadaSelecionada(num)}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                rodadaSelecionada === num
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {num}ª
            </button>
          ))}
        </div>

        {/* Lista de confrontos */}
        <div className="space-y-3">
          {jogosRodada.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-6">
              Nenhum jogo gerado para esta rodada.
            </p>
          ) : (
            jogosRodada.map((jogo, idx) => (
              <div
                key={idx}
                className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md"
              >
                {/* Time mandante */}
                <div className="w-full sm:w-2/5 text-left sm:text-right">
                  <p className="text-base font-extrabold text-white">{jogo.casa.time}</p>
                  <p className="text-xs text-slate-400">
                    {typeof jogo.casa.participantes === 'string'
                      ? jogo.casa.participantes
                      : jogo.casa.participantes.map((p) => p.nome).join(' & ')}
                  </p>
                </div>

                {/* Turno e rodada */}
                <div className="w-full sm:w-1/5 flex flex-col items-center justify-center bg-slate-900/80 border border-slate-700 py-2 px-3 rounded-lg">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                    {jogo.turno || 'VS'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                    Rodada {jogo.rodada}
                  </span>
                </div>

                {/* Time visitante */}
                <div className="w-full sm:w-2/5 text-left">
                  <p className="text-base font-extrabold text-white">{jogo.fora.time}</p>
                  <p className="text-xs text-slate-400">
                    {typeof jogo.fora.participantes === 'string'
                      ? jogo.fora.participantes
                      : jogo.fora.participantes.map((p) => p.nome).join(' & ')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Layout de Mata-Mata
  const renderMataMata = () => {
    const partidas = chaveamento.partidas_iniciais || [];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">
            Chaveamento <span className="text-emerald-400">Eliminatório</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
            Partidas Iniciais
          </p>
        </div>

        <div className="space-y-4">
          {partidas.map((jogo, idx) => (
            <div
              key={idx}
              className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
            >
              {/* Time mandante */}
              <div className="w-full sm:w-2/5 text-left sm:text-right">
                <p className="text-lg font-extrabold text-white">
                  {typeof jogo.casa === 'string' ? jogo.casa : jogo.casa.time}
                </p>
                {typeof jogo.casa !== 'string' && (
                  <p className="text-xs text-emerald-400 font-semibold">
                    {typeof jogo.casa.participantes === 'string'
                      ? jogo.casa.participantes
                      : jogo.casa.participantes.map((p) => p.nome).join(' & ')}
                  </p>
                )}
              </div>

              {/* Indicador de fase */}
              <div className="w-full sm:w-1/5 flex flex-col items-center justify-center bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  {jogo.fase || 'VS'}
                </span>
              </div>

              {/* Time visitante */}
              <div className="w-full sm:w-2/5 text-left">
                <p className="text-lg font-extrabold text-white">
                  {typeof jogo.fora === 'string' ? jogo.fora : jogo.fora.time}
                </p>
                {typeof jogo.fora !== 'string' && (
                  <p className="text-xs text-emerald-400 font-semibold">
                    {typeof jogo.fora.participantes === 'string'
                      ? jogo.fora.participantes
                      : jogo.fora.participantes.map((p) => p.nome).join(' & ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderiza pelo formato selecionado
  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      {formato_torneio === 'copa' && renderCopa()}
      {formato_torneio === 'pontos_corridos' && renderPontosCorridos()}
      {formato_torneio === 'mata_mata' && renderMataMata()}
    </div>
  );
}