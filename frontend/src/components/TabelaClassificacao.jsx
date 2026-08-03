import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
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

// Hierarquia estrita: Confronto Direto -> SG -> GP -> Rodada Extra / Sorteio
function obterMotivoDesempate(time, idx, lista, formato) {
  if (!time || (time.pontos === 0 && time.jogos === 0)) return null;

  const anterior = lista[idx - 1];
  const proximo = lista[idx + 1];

  const empatadoComAnterior = anterior && anterior.pontos === time.pontos && time.pontos > 0;
  const empatadoComProximo = proximo && proximo.pontos === time.pontos && time.pontos > 0;

  if (!empatadoComAnterior && !empatadoComProximo) return null;

  if (time.desempate_criterio || time.motivo_desempate) {
    return time.desempate_criterio || time.motivo_desempate;
  }

  const rival = empatadoComAnterior ? anterior : proximo;

  if (
    (time.pontos_confronto !== undefined && time.pontos_confronto !== rival.pontos_confronto) ||
    time.confronto_vencedor
  ) {
    return 'Confronto Direto';
  }

  if (time.saldo_gols !== rival.saldo_gols) return 'SG (Saldo de Gols)';
  if (time.gols_pro !== rival.gols_pro) return 'GP (Gols Pró)';

  return formato === 'copa' ? 'Sorteio' : 'Rodada Extra / Sorteio';
}

export default function TabelaClassificacao({ classificacao = [], formato = 'pontos_corridos', nomeGrupo = '' }) {
  if (!classificacao || classificacao.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-slate-800/90 rounded-md border border-slate-700 p-4 sm:p-6 text-center text-slate-400 text-sm">
        Nenhuma classificação disponível no momento. Registre os placares das partidas!
      </div>
    );
  }

  const houveDesempate = classificacao.some((time, idx) => obterMotivoDesempate(time, idx, classificacao, formato) !== null);

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-800/90 rounded-md border border-slate-700 shadow-xl overflow-hidden mt-8">
      {/* Cabeçalho */}
      <div className="bg-slate-900/95 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-700 flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-extrabold text-emerald-400 uppercase tracking-wider truncate">
          {formato === 'copa' ? `Classificação - ${nomeGrupo || 'Grupo'}` : 'Classificação Geral - Pontos Corridos'}
        </h3>
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          {classificacao.length} {classificacao.length === 1 ? 'Clube' : 'Clubes'}
        </span>
      </div>

      {/* Alerta Tático de Desempate */}
      {houveDesempate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex items-start sm:items-center gap-2.5 text-amber-300 text-xs font-bold"
        >
          <Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            Empate em pontos detectado: posições definidas automaticamente pelos critérios de desempate.
          </span>
        </motion.div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-300 whitespace-nowrap">
          <thead className="bg-slate-900/60 text-slate-400 text-[11px] sm:text-xs uppercase tracking-widest border-b border-slate-700/80">
            <tr>
              <th className="px-3 sm:px-6 py-3 w-12 sm:w-16">Pos</th>
              <th className="px-3 sm:px-6 py-3">Clube</th>
              <th className="px-3 sm:px-6 py-3">Jogador(es)</th>
              <th className="px-2 sm:px-4 py-3 text-center">Pts</th>
              <th className="px-2 sm:px-4 py-3 text-center">SG</th>
              <th className="px-2 sm:px-4 py-3 text-center">GP</th>
              <th className="px-2 sm:px-4 py-3 text-center">PJ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {classificacao.map((time, idx) => {
              const posicao = time.posicao || idx + 1;
              const escudo = getEscudoClube(time.nome_clube, time.escudo_url);
              const motivoDesempate = obterMotivoDesempate(time, idx, classificacao, formato);

              return (
                <motion.tr
                  key={time.participante_id || idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.25) }}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  {/* Posição */}
                  <td className="px-3 sm:px-6 py-3 sm:py-3.5 font-bold text-slate-100">
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-sm text-xs font-black ${
                        posicao === 1
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {posicao}º
                    </span>
                  </td>
                  
                  {/* Escudo, Nome do Clube e Badge de Desempate (empilhada no mobile) */}
                  <td className="px-3 sm:px-6 py-3 sm:py-3.5">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <img src={escudo} alt={time.nome_clube} className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" />
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <span className="font-bold text-slate-100 text-xs sm:text-sm">{time.nome_clube}</span>
                        {motivoDesempate && (
                          <span
                            className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded-sm text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
                            title={`Posição decidida pelo critério: ${motivoDesempate}`}
                          >
                            <span>Desempate: {motivoDesempate}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Jogador(es) */}
                  <td className="px-3 sm:px-6 py-3 sm:py-3.5">
                    <span className="text-xs font-semibold text-slate-300">
                      {time.jogador || '-'}
                    </span>
                  </td>
                  
                  {/* Estatísticas */}
                  <td className="px-2 sm:px-4 py-3 sm:py-3.5 text-center font-black text-emerald-400 text-sm sm:text-base">{time.pontos || 0}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-3.5 text-center font-bold text-xs sm:text-sm text-slate-200">{time.saldo_gols || 0}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-3.5 text-center font-bold text-xs sm:text-sm text-slate-200">{time.gols_pro || 0}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-3.5 text-center font-semibold text-xs text-slate-400">{time.jogos || 0}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}