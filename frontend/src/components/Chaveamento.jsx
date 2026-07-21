export default function Chaveamento() {
  // Mock simulando o retorno do Back-End para as Semifinais
  const partidasMock = [
    {
      id: 1,
      fase: "Semifinal",
      timeCasa: { sigla: "SEP", jogador: "Evandio", gols: 2, escudo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg" },
      timeFora: { sigla: "CRF", jogador: "João", gols: 1, escudo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg" },
      status: "Finalizado",
      penaltis: null // Não houve pênaltis
    },
    {
      id: 2,
      fase: "Semifinal",
      timeCasa: { sigla: "RMA", jogador: "Carlos & Marcos", gols: 1, escudo: "https://upload.wikimedia.org/wikipedia/pt/9/98/Real_Madrid.png" },
      timeFora: { sigla: "MCI", jogador: "Lucas", gols: 1, escudo: "https://upload.wikimedia.org/wikipedia/pt/0/02/Manchester_City_Football_Club.png" },
      status: "Finalizado",
      penaltis: { casa: 4, fora: 5 } // O City ganhou nos pênaltis
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-emerald-400">Fase Eliminatória</h3>
        <p className="text-slate-400">Semifinais</p>
      </div>

      {/* Lista de Confrontos */}
      <div className="flex flex-col gap-6">
        {partidasMock.map((partida) => (
          <div key={partida.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-transform hover:scale-[1.01]">
            
            {/* Time da Casa */}
            <div className="flex items-center gap-4 w-full sm:w-1/3 justify-start sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="font-bold text-slate-100 text-lg">{partida.timeCasa.sigla}</p>
                <p className="text-xs text-slate-400">{partida.timeCasa.jogador}</p>
              </div>
              <img src={partida.timeCasa.escudo} alt={partida.timeCasa.sigla} className="w-12 h-12 object-contain" />
            </div>

            {/* Placar Central */}
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 bg-slate-900 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center gap-3 text-2xl font-black text-slate-100">
                <span>{partida.timeCasa.gols}</span>
                <span className="text-slate-500 text-lg">x</span>
                <span>{partida.timeFora.gols}</span>
              </div>
              
              {/* Lógica de exibição de Pênaltis */}
              {partida.penaltis && (
                <div className="text-xs font-semibold text-emerald-400 mt-1 bg-emerald-400/10 px-2 py-1 rounded">
                  Pênaltis: {partida.penaltis.casa} x {partida.penaltis.fora}
                </div>
              )}
            </div>

            {/* Time de Fora */}
            <div className="flex items-center gap-4 w-full sm:w-1/3 justify-start">
              <img src={partida.timeFora.escudo} alt={partida.timeFora.sigla} className="w-12 h-12 object-contain" />
              <div className="text-left">
                <p className="font-bold text-slate-100 text-lg">{partida.timeFora.sigla}</p>
                <p className="text-xs text-slate-400">{partida.timeFora.jogador}</p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}