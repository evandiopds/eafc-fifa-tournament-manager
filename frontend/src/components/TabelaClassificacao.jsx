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
      <div className="w-full max-w-5xl mx-auto bg-slate-800/90 rounded-md border border-slate-700 p-6 text-center text-slate-400 text-sm">
        Nenhuma classificação disponível no momento. Registre os placares das partidas!
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-800/90 rounded-md border border-slate-700 shadow-xl overflow-hidden mt-8">
      {/* Cabeçalho da Tabela */}
      <div className="bg-slate-900/95 px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-extrabold text-emerald-400 uppercase tracking-wider">
          Classificação Geral - Pontos Corridos
        </h3>
      </div>

      {/* Estrutura da Tabela com Geometria Tática */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-300 whitespace-nowrap">
          <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-700/80">
            <tr>
              <th className="px-6 py-3.5 w-16">Pos</th>
              <th className="px-6 py-3.5">Clube</th>
              <th className="px-6 py-3.5">Jogador(es)</th>
              <th className="px-4 py-3.5 text-center">Pts</th>
              <th className="px-4 py-3.5 text-center">SG</th>
              <th className="px-4 py-3.5 text-center">GP</th>
              <th className="px-4 py-3.5 text-center">PJ</th>
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
                  {/* Posição com formato angular tático */}
                  <td className="px-6 py-3.5 font-bold text-slate-100">
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-sm text-xs font-black ${
                        posicao === 1
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {posicao}º
                    </span>
                  </td>
                  
                  {/* Escudo e Nome do Clube */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={escudo} alt={time.nome_clube} className="w-7 h-7 object-contain" />
                      <span className="font-bold text-slate-100 text-sm">{time.nome_clube}</span>
                    </div>
                  </td>

                  {/* Jogador(es) */}
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-semibold text-slate-300">
                      {time.jogador || '-'}
                    </span>
                  </td>
                  
                  {/* Estatísticas */}
                  <td className="px-4 py-3.5 text-center font-black text-emerald-400 text-base">{time.pontos || 0}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-sm text-slate-200">{time.saldo_gols || 0}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-sm text-slate-200">{time.gols_pro || 0}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-xs text-slate-400">{time.jogos || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}