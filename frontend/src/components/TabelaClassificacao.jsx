export default function TabelaClassificacao() {
  // Dados de teste
  const tabelaMock = [
    { posicao: 1, jogador: "Evandio", sigla: "SEP", nome: "Palmeiras", pontos: 12, saldo_gols: 8, gols_pro: 10, partidas_jogadas: 4, escudo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg" },
    { posicao: 2, jogador: "Carlos & Marcos", sigla: "RMA", nome: "Real Madrid", pontos: 10, saldo_gols: 5, gols_pro: 8, partidas_jogadas: 4, escudo: "https://upload.wikimedia.org/wikipedia/pt/9/98/Real_Madrid.png" },
    { posicao: 3, jogador: "Lucas", sigla: "MCI", nome: "Man City", pontos: 10, saldo_gols: 4, gols_pro: 7, partidas_jogadas: 4, escudo: "https://upload.wikimedia.org/wikipedia/pt/0/02/Manchester_City_Football_Club.png" },
    { posicao: 4, jogador: "João", sigla: "CRF", nome: "Flamengo", pontos: 7, saldo_gols: -1, gols_pro: 5, partidas_jogadas: 4, escudo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg" }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
      
      {/* Cabeçalho da Tabela */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
        <h3 className="text-xl font-bold text-emerald-400">Classificação - Pontos Corridos</h3>
      </div>

      {/* Estrutura da Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-300 whitespace-nowrap">
          <thead className="bg-slate-800 text-slate-400 text-sm uppercase">
            <tr>
              <th className="px-6 py-4 w-16">Pos</th>
              <th className="px-6 py-4">Clube</th>
              <th className="px-6 py-4">Jogador(es)</th>
              <th className="px-4 py-4 text-center">Pts</th>
              <th className="px-4 py-4 text-center">SG</th>
              <th className="px-4 py-4 text-center">GP</th>
              <th className="px-4 py-4 text-center">PJ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {tabelaMock.map((time) => (
              <tr 
                key={time.sigla} 
                className="hover:bg-slate-700/30 transition-colors"
              >
                {/* Posição */}
                <td className="px-6 py-4 font-bold text-slate-100">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full ${time.posicao === 1 ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
                    {time.posicao}º
                  </span>
                </td>
                
                {/* Escudo e Sigla */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={time.escudo} alt={time.sigla} className="w-8 h-8 object-contain" />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100">{time.sigla}</span>
                      <span className="text-xs text-slate-400">{time.nome}</span>
                    </div>
                  </div>
                </td>

                {/* Jogador(es) */}
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-200">
                    {time.jogador}
                  </span>
                </td>
                
                {/* Estatísticas */}
                <td className="px-4 py-4 text-center font-bold text-emerald-400 text-lg">{time.pontos}</td>
                <td className="px-4 py-4 text-center">{time.saldo_gols}</td>
                <td className="px-4 py-4 text-center">{time.gols_pro}</td>
                <td className="px-4 py-4 text-center font-semibold text-slate-300">{time.partidas_jogadas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}