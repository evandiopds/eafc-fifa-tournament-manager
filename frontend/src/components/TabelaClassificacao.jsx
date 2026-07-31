import { buscarTime } from '../utils/teamSearch';
import escudoGen from '../assets/escudo_gen.svg';

function getEscudoClube(nomeClube, urlBanco) {
  if (urlBanco) return urlBanco;
  const timeEncontrado = buscarTime(nomeClube);
  if (!timeEncontrado || timeEncontrado.escudo === '/escudo-padrao.png') {
    return escudoGen;
  }
  return timeEncontrado.escudo;
}

export default function TabelaClassificacao({ classificacao = [] }) {
  if (!classificacao || classificacao.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-slate-400">
        Nenhuma classificação disponível no momento. Registre os placares das partidas!
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden mt-8">
      {/* Cabeçalho da Tabela */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
        <h3 className="text-xl font-bold text-emerald-400">Classificação Geral - Pontos Corridos</h3>
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
            {classificacao.map((time, idx) => {
              const posicao = time.posicao || idx + 1;
              const escudo = getEscudoClube(time.nome_clube, time.escudo_url);

              return (
                <tr 
                  key={time.participante_id || idx} 
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  {/* Posição */}
                  <td className="px-6 py-4 font-bold text-slate-100">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${posicao === 1 ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
                      {posicao}º
                    </span>
                  </td>
                  
                  {/* Escudo e Nome do Clube */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={escudo} alt={time.nome_clube} className="w-8 h-8 object-contain" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100">{time.nome_clube}</span>
                      </div>
                    </div>
                  </td>

                  {/* Jogador(es) */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-200">
                      {time.jogador || '-'}
                    </span>
                  </td>
                  
                  {/* Estatísticas */}
                  <td className="px-4 py-4 text-center font-bold text-emerald-400 text-lg">{time.pontos || 0}</td>
                  <td className="px-4 py-4 text-center">{time.saldo_gols || 0}</td>
                  <td className="px-4 py-4 text-center">{time.gols_pro || 0}</td>
                  <td className="px-4 py-4 text-center font-semibold text-slate-300">{time.jogos || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}