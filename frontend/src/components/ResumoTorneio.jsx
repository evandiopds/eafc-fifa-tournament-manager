import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Trophy, Award, TrendingUp, Target, BarChart3, ShieldAlert, Sparkles, Scale, Download } from 'lucide-react';
import { buscarTime } from '../utils/teamSearch';
import escudoGen from '../assets/escudo_gen.svg';

function getEscudo(nomeTime) {
  if (!nomeTime || nomeTime === 'Aguardando' || nomeTime === 'A definir') return escudoGen;
  const timeEncontrado = buscarTime(nomeTime);
  if (!timeEncontrado || timeEncontrado.escudo === '/escudo-padrao.png') return escudoGen;
  return timeEncontrado.escudo;
}

// Extrai de forma segura o nome do jogador/dupla a partir de um objeto participante ou string
function extrairNomeParticipante(participante) {
  if (!participante) return null;
  if (typeof participante === 'string') return null;
  if (participante.participantes) {
    if (typeof participante.participantes === 'string') return participante.participantes;
    if (Array.isArray(participante.participantes)) {
      return participante.participantes.map((p) => p.nome).join(' & ');
    }
  }
  return participante.nome || participante.jogador || null;
}

// Card visual de partida em Modo Leitura para exibir goleadas e jogos marcantes
function CardJogoLeitura({ jogo, tagTitulo, tagCor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', subtexto }) {
  if (!jogo) return null;

  const nomeCasa = typeof jogo.casa === 'string' ? jogo.casa : jogo.casa?.time || 'A definir';
  const nomeFora = typeof jogo.fora === 'string' ? jogo.fora : jogo.fora?.time || 'A definir';
  const jogCasa = extrairNomeParticipante(jogo.casa);
  const jogFora = extrairNomeParticipante(jogo.fora);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-md p-4 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
        <span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider border ${tagCor}`}>
          {tagTitulo}
        </span>
        {subtexto && <span className="text-xs font-bold text-slate-400">{subtexto}</span>}
      </div>

      <div className="space-y-2.5 my-auto">
        {/* Time Casa */}
        <div className="flex items-center justify-between gap-2 bg-slate-900/60 px-3 py-2 rounded-sm border border-slate-800/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src={getEscudo(nomeCasa)} alt={nomeCasa} className="w-6 h-6 object-contain shrink-0" />
            <div className="truncate">
              <p className="text-sm font-bold text-white truncate">{nomeCasa}</p>
              {jogCasa && <p className="text-[10px] text-emerald-400 font-semibold truncate">{jogCasa}</p>}
            </div>
          </div>
          <span className="text-base font-black text-white px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
            {jogo.gols_casa}
          </span>
        </div>

        {/* Time Visitante */}
        <div className="flex items-center justify-between gap-2 bg-slate-900/60 px-3 py-2 rounded-sm border border-slate-800/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src={getEscudo(nomeFora)} alt={nomeFora} className="w-6 h-6 object-contain shrink-0" />
            <div className="truncate">
              <p className="text-sm font-bold text-white truncate">{nomeFora}</p>
              {jogFora && <p className="text-[10px] text-emerald-400 font-semibold truncate">{jogFora}</p>}
            </div>
          </div>
          <span className="text-base font-black text-white px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
            {jogo.gols_visitante}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ResumoTorneio({ dadosTorneio }) {
  const resumoRef = useRef(null);
  const [gerandoImagem, setGerandoImagem] = useState(false);

  if (!dadosTorneio) return null;

  const { formato_torneio, chaveamento = {}, classificacao = [] } = dadosTorneio;

  // 1. EXTRAÇÃO DE TODOS OS JOGOS REALIZADOS NO TORNEIO
  const extrairJogos = () => {
    const listaJogos = [];

    if (formato_torneio === 'pontos_corridos' && Array.isArray(chaveamento.tabela)) {
      listaJogos.push(...chaveamento.tabela);
    } else if (formato_torneio === 'copa') {
      const grupos = chaveamento.grupos || {};
      Object.values(grupos).forEach((jogosGrupo) => listaJogos.push(...jogosGrupo));
      const arvore = chaveamento.arvore || {};
      Object.values(arvore).forEach((jogosFase) => listaJogos.push(...jogosFase));
    } else if (formato_torneio === 'mata_mata') {
      const arvore = chaveamento.arvore || {};
      Object.values(arvore).forEach((jogosFase) => listaJogos.push(...jogosFase));
    }

    return listaJogos.filter(
      (j) => j.gols_casa !== '' && j.gols_casa != null && j.gols_visitante !== '' && j.gols_visitante != null
    );
  };

  const jogosFinalizados = extrairJogos();

  // Mapeamento auxiliar de colocação em Pontos Corridos para desempate
  const mapaPosicaoClassificacao = {};
  if (Array.isArray(classificacao)) {
    classificacao.forEach((item, index) => {
      if (item?.nome_clube) {
        mapaPosicaoClassificacao[item.nome_clube] = index + 1;
      }
    });
  }

  // Função para definir peso de relevância (Fase no Mata-Mata vs. Posição no Ranking)
  const obterPesoRelevancia = (jogoOuTimeNome) => {
    if (formato_torneio === 'pontos_corridos') {
      const nomeTime = typeof jogoOuTimeNome === 'string' 
        ? jogoOuTimeNome 
        : (typeof jogoOuTimeNome?.casa === 'string' ? jogoOuTimeNome.casa : jogoOuTimeNome?.casa?.time);
      const pos = mapaPosicaoClassificacao[nomeTime] || 99;
      return 100 - pos; // Quanto menor a posição (1º lugar), maior o peso
    }

    // Em Mata-Mata ou Copa, valoriza a fase da partida
    const fase = jogoOuTimeNome?.fase || '';
    if (fase === 'Final') return 100;
    if (fase === 'Terceiro Lugar') return 90;
    if (fase.includes('Semi')) return 80;
    if (fase.includes('Quartas')) return 70;
    if (fase.includes('Oitavas')) return 60;
    return 50;
  };

  // 2. IDENTIFICAÇÃO DO PÓDIO
  const obterPodio = () => {
    let campeao = { time: null, jogador: null };
    let vice = { time: null, jogador: null };
    let terceiro = { time: null, jogador: null };

    if (formato_torneio === 'pontos_corridos') {
      if (classificacao.length > 0) {
        campeao = { time: classificacao[0]?.nome_clube, jogador: classificacao[0]?.jogador };
        vice = { time: classificacao[1]?.nome_clube, jogador: classificacao[1]?.jogador };
        terceiro = { time: classificacao[2]?.nome_clube, jogador: classificacao[2]?.jogador };
      }
    } else {
      const arvore = chaveamento.arvore || {};
      
      const jogosFinal = arvore['Final'] || [];
      if (jogosFinal.length > 0) {
        const jFinal = jogosFinal[0];
        const gCasa = Number(jFinal.gols_casa);
        const gFora = Number(jFinal.gols_visitante);
        const nomeCasa = typeof jFinal.casa === 'string' ? jFinal.casa : jFinal.casa?.time;
        const nomeFora = typeof jFinal.fora === 'string' ? jFinal.fora : jFinal.fora?.time;
        const jogCasa = extrairNomeParticipante(jFinal.casa);
        const jogFora = extrairNomeParticipante(jFinal.fora);

        if (gCasa > gFora || (gCasa === gFora && Number(jFinal.penaltis_casa) > Number(jFinal.penaltis_visitante))) {
          campeao = { time: nomeCasa, jogador: jogCasa };
          vice = { time: nomeFora, jogador: jogFora };
        } else {
          campeao = { time: nomeFora, jogador: jogFora };
          vice = { time: nomeCasa, jogador: jogCasa };
        }
      }

      const jogosTerceiro = arvore['Terceiro Lugar'] || [];
      if (jogosTerceiro.length > 0) {
        const jTerceiro = jogosTerceiro[0];
        const gCasa = Number(jTerceiro.gols_casa);
        const gFora = Number(jTerceiro.gols_visitante);
        const nomeCasa = typeof jTerceiro.casa === 'string' ? jTerceiro.casa : jTerceiro.casa?.time;
        const nomeFora = typeof jTerceiro.fora === 'string' ? jTerceiro.fora : jTerceiro.fora?.time;
        const jogCasa = extrairNomeParticipante(jTerceiro.casa);
        const jogFora = extrairNomeParticipante(jTerceiro.fora);

        if (gCasa > gFora || (gCasa === gFora && Number(jTerceiro.penaltis_casa) > Number(jTerceiro.penaltis_visitante))) {
          terceiro = { time: nomeCasa, jogador: jogCasa };
        } else {
          terceiro = { time: nomeFora, jogador: jogFora };
        }
      }
    }

    return { campeao, vice, terceiro };
  };

  const podio = obterPodio();

  // 3. CÁLCULO DE ESTATÍSTICAS POR TIME (COM GOLS SOFRIDOS E SALDO)
  const calcularEstatisticas = () => {
    const mapaTimes = {};

    const mapaJogadoresClassificacao = {};
    if (Array.isArray(classificacao)) {
      classificacao.forEach((item) => {
        if (item?.nome_clube && item?.jogador) {
          mapaJogadoresClassificacao[item.nome_clube] = item.jogador;
        }
      });
    }

    const registrarTime = (nome, jogador = null) => {
      if (!nome || nome === 'Aguardando' || nome === 'A definir') return;
      if (!mapaTimes[nome]) {
        mapaTimes[nome] = {
          time: nome,
          jogador: jogador || mapaJogadoresClassificacao[nome] || null,
          jogos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          golsPro: 0,
          golsContra: 0,
        };
      } else if (!mapaTimes[nome].jogador && jogador) {
        mapaTimes[nome].jogador = jogador;
      }
    };

    jogosFinalizados.forEach((jogo) => {
      const nomeCasa = typeof jogo.casa === 'string' ? jogo.casa : jogo.casa?.time;
      const nomeFora = typeof jogo.fora === 'string' ? jogo.fora : jogo.fora?.time;
      const jogCasa = extrairNomeParticipante(jogo.casa);
      const jogFora = extrairNomeParticipante(jogo.fora);
      const gCasa = Number(jogo.gols_casa);
      const gFora = Number(jogo.gols_visitante);

      registrarTime(nomeCasa, jogCasa);
      registrarTime(nomeFora, jogFora);

      if (mapaTimes[nomeCasa]) {
        mapaTimes[nomeCasa].jogos += 1;
        mapaTimes[nomeCasa].golsPro += gCasa;
        mapaTimes[nomeCasa].golsContra += gFora;
      }
      if (mapaTimes[nomeFora]) {
        mapaTimes[nomeFora].jogos += 1;
        mapaTimes[nomeFora].golsPro += gFora;
        mapaTimes[nomeFora].golsContra += gCasa;
      }

      if (gCasa > gFora) {
        if (mapaTimes[nomeCasa]) mapaTimes[nomeCasa].vitorias += 1;
        if (mapaTimes[nomeFora]) mapaTimes[nomeFora].derrotas += 1;
      } else if (gFora > gCasa) {
        if (mapaTimes[nomeFora]) mapaTimes[nomeFora].vitorias += 1;
        if (mapaTimes[nomeCasa]) mapaTimes[nomeCasa].derrotas += 1;
      } else {
        if (mapaTimes[nomeCasa]) mapaTimes[nomeCasa].empates += 1;
        if (mapaTimes[nomeFora]) mapaTimes[nomeFora].empates += 1;
      }
    });

    return Object.values(mapaTimes).map((t) => ({
      ...t,
      saldoGols: t.golsPro - t.golsContra,
      taxaVitoria: t.jogos > 0 ? ((t.vitorias / t.jogos) * 100).toFixed(1) : '0.0',
      mediaGols: t.jogos > 0 ? (t.golsPro / t.jogos).toFixed(2) : '0.00',
      mediaSofridos: t.jogos > 0 ? (t.golsContra / t.jogos).toFixed(2) : '0.00',
    }));
  };

  const statsTimes = calcularEstatisticas();

  // 4. CÁLCULO DAS 4 DESTAQUES / HONRA AO MÉRITO
  const calcularDestaques = () => {
    if (jogosFinalizados.length === 0 || statsTimes.length === 0) return {};

    // 1. Maior Goleada
    const jogosOrdenadosGoleada = [...jogosFinalizados].sort((a, b) => {
      const diffA = Math.abs(Number(a.gols_casa) - Number(a.gols_visitante));
      const diffB = Math.abs(Number(b.gols_casa) - Number(b.gols_visitante));
      if (diffB !== diffA) return diffB - diffA;

      const maxGolsA = Math.max(Number(a.gols_casa), Number(a.gols_visitante));
      const maxGolsB = Math.max(Number(b.gols_casa), Number(b.gols_visitante));
      if (maxGolsB !== maxGolsA) return maxGolsB - maxGolsA;

      return obterPesoRelevancia(b) - obterPesoRelevancia(a);
    });
    const jogoMaiorGoleada = jogosOrdenadosGoleada[0];

    // Badge Dinâmica do Massacre/Surra/Goleada
    let tagGoleada = 'MAIOR GOLEADA';
    let corGoleada = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (jogoMaiorGoleada) {
      const diff = Math.abs(Number(jogoMaiorGoleada.gols_casa) - Number(jogoMaiorGoleada.gols_visitante));
      if (diff >= 6) {
        tagGoleada = 'MASSACRE';
        corGoleada = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      } else if (diff === 4 || diff === 5) {
        tagGoleada = 'SURRA';
        corGoleada = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      }
    }

    // 2. Defesa de Ferro (Menor média de gols sofridos)
    const timesOrdenadosDefesa = [...statsTimes].sort((a, b) => {
      if (Number(a.mediaSofridos) !== Number(b.mediaSofridos)) {
        return Number(a.mediaSofridos) - Number(b.mediaSofridos);
      }
      if (b.jogos !== a.jogos) return b.jogos - a.jogos;
      return b.golsPro - a.golsPro;
    });
    const timeDefesaFerro = timesOrdenadosDefesa[0];

    // 3. Chuva de Gols (Partida com mais gols somados)
    const jogosOrdenadosChuva = [...jogosFinalizados].sort((a, b) => {
      const totalA = Number(a.gols_casa) + Number(a.gols_visitante);
      const totalB = Number(b.gols_casa) + Number(b.gols_visitante);
      if (totalB !== totalA) return totalB - totalA;

      if (obterPesoRelevancia(b) !== obterPesoRelevancia(a)) {
        return obterPesoRelevancia(b) - obterPesoRelevancia(a);
      }

      const diffA = Math.abs(Number(a.gols_casa) - Number(a.gols_visitante));
      const diffB = Math.abs(Number(b.gols_casa) - Number(b.gols_visitante));
      return diffA - diffB; // Prioriza jogo mais equilibrado
    });
    const jogoChuvaGols = jogosOrdenadosChuva[0];

    // 4. Rei do Empate (Time com mais empates)
    const timesOrdenadosEmpate = [...statsTimes].sort((a, b) => {
      if (b.empates !== a.empates) return b.empates - a.empates;
      if (b.jogos !== a.jogos) return b.jogos - a.jogos;
      return b.saldoGols - a.saldoGols;
    });
    const timeReiEmpate = timesOrdenadosEmpate[0];

    return {
      jogoMaiorGoleada,
      tagGoleada,
      corGoleada,
      timeDefesaFerro,
      jogoChuvaGols,
      timeReiEmpate,
    };
  };

  const destaques = calcularDestaques();

  // Ordenação para os Rankings Táticos
  const rankingTaxaVitoria = [...statsTimes].sort((a, b) => Number(b.taxaVitoria) - Number(a.taxaVitoria)).slice(0, 5);
  const rankingMediaGols = [...statsTimes].sort((a, b) => Number(b.mediaGols) - Number(a.mediaGols)).slice(0, 5);
  const totalGolsTorneio = statsTimes.reduce((acc, curr) => acc + curr.golsPro, 0);

  const formatarTextoVitorias = (vit, jog) => {
    const textoVit = vit === 1 ? '1 Vitória' : `${vit} Vitórias`;
    const textoJog = jog === 1 ? '1 Jogo' : `${jog} Jogos`;
    return `${textoVit} em ${textoJog}`;
  };

  const formatarTextoGols = (gols, jog) => {
    const textoGols = gols === 1 ? '1 Gol' : `${gols} Gols`;
    const textoJog = jog === 1 ? '1 Jogo' : `${jog} Jogos`;
    return `${textoGols} em ${textoJog}`;
  };

  // 5. GERAÇÃO DO ARQUIVO PNG
  const handleBaixarPng = async () => {
    if (!resumoRef.current) return;
    setGerandoImagem(true);

    try {
      const dataUrl = await toPng(resumoRef.current, {
        cacheBust: true,
        backgroundColor: '#020617', // Garante o fundo slate-950 perfeitinho no PNG
        quality: 0.98,
      });

      const link = document.createElement('a');
      link.download = `resumo-torneio-${dadosTorneio?.nome || 'fut-manager'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
    } finally {
      setGerandoImagem(false);
    }
  };

  return (
    <div
      ref={resumoRef}
      className="w-full bg-slate-900/95 border border-slate-700/80 rounded-md p-6 sm:p-8 shadow-2xl space-y-10 mt-6"
    >
      {/* Cabeçalho de Encerramento com Botão Tático de Download */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded-sm text-emerald-400 text-xs font-black uppercase tracking-widest mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Estatísticas de Encerramento</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider">
            PÓDIO & <span className="text-emerald-400">DESEMPENHO GERAL</span>
          </h3>
          <p className="text-slate-400 text-xs uppercase tracking-wider mt-1">
            {jogosFinalizados.length} partidas concluídas • {totalGolsTorneio} Gols marcados
          </p>
        </div>

        <button
          type="button"
          onClick={handleBaixarPng}
          disabled={gerandoImagem}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white border border-slate-700 px-4 py-2.5 rounded-sm text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 w-full sm:w-auto"
          title="Baixar imagem PNG das estatísticas"
        >
          <Download className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{gerandoImagem ? 'GERANDO IMAGEM...' : 'BAIXAR RESUMO (.PNG)'}</span>
        </button>
      </div>

      {/* PÓDIO OFICIAL (OURO, PRATA, BRONZE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 2º LUGAR (PRATA) */}
        <div className="bg-slate-950/80 border border-slate-400/40 rounded-md p-5 flex flex-col items-center justify-center text-center relative overflow-hidden order-2 md:order-1">
          <div className="absolute top-0 right-0 bg-slate-400/20 px-2.5 py-1 rounded-bl-sm text-[10px] font-black uppercase tracking-widest text-slate-300">
            Prata
          </div>
          <Award className="w-8 h-8 text-slate-300 mb-2" />
          <img src={getEscudo(podio.vice.time)} alt={podio.vice.time || 'Vice'} className="w-14 h-14 object-contain my-2" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">2º Lugar</span>
          <h4 className="text-base font-extrabold text-slate-100 truncate w-full mt-0.5">
            {podio.vice.time || 'A definir'}
          </h4>
          {podio.vice.jogador && (
            <p className="text-xs font-bold text-emerald-400 truncate w-full mt-1">
              {podio.vice.jogador}
            </p>
          )}
        </div>

        {/* 1º LUGAR (OURO) */}
        <div className="bg-amber-500/10 border-2 border-amber-500/70 rounded-md p-6 flex flex-col items-center justify-center text-center relative overflow-hidden order-1 md:order-2 shadow-lg shadow-amber-500/5 scale-105">
          <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 px-3 py-1 rounded-bl-sm text-[10px] font-black uppercase tracking-widest">
            Campeão
          </div>
          <Trophy className="w-10 h-10 text-amber-400 mb-2" />
          <img src={getEscudo(podio.campeao.time)} alt={podio.campeao.time || 'Campeão'} className="w-16 h-16 object-contain my-2" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">1º Lugar</span>
          <h4 className="text-lg font-extrabold text-white truncate w-full mt-0.5">
            {podio.campeao.time || 'A definir'}
          </h4>
          {podio.campeao.jogador && (
            <p className="text-sm font-black text-emerald-400 truncate w-full mt-1">
              {podio.campeao.jogador}
            </p>
          )}
        </div>

        {/* 3º LUGAR (BRONZE) */}
        <div className="bg-slate-950/80 border border-amber-700/50 rounded-md p-5 flex flex-col items-center justify-center text-center relative overflow-hidden order-3">
          <div className="absolute top-0 right-0 bg-amber-700/20 px-2.5 py-1 rounded-bl-sm text-[10px] font-black uppercase tracking-widest text-amber-500">
            Bronze
          </div>
          <Award className="w-8 h-8 text-amber-600 mb-2" />
          <img src={getEscudo(podio.terceiro.time)} alt={podio.terceiro.time || '3º'} className="w-14 h-14 object-contain my-2" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-500">3º Lugar</span>
          <h4 className="text-base font-extrabold text-slate-200 truncate w-full mt-0.5">
            {podio.terceiro.time || 'A definir'}
          </h4>
          {podio.terceiro.jogador && (
            <p className="text-xs font-bold text-emerald-400 truncate w-full mt-1">
              {podio.terceiro.jogador}
            </p>
          )}
        </div>
      </div>

      {/* DESTAQUES & HONRA AO MÉRITO */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Destaques & Honra ao Mérito
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. MAIOR GOLEADA (MASSACRE / SURRA) */}
          <div className="flex flex-col">
            <CardJogoLeitura
              jogo={destaques.jogoMaiorGoleada}
              tagTitulo={destaques.tagGoleada}
              tagCor={destaques.corGoleada}
              subtexto={
                destaques.jogoMaiorGoleada
                  ? `+${Math.abs(Number(destaques.jogoMaiorGoleada.gols_casa) - Number(destaques.jogoMaiorGoleada.gols_visitante))} Gols de diferença`
                  : null
              }
            />
          </div>

          {/* 2. CHUVA DE GOLS */}
          <div className="flex flex-col">
            <CardJogoLeitura
              jogo={destaques.jogoChuvaGols}
              tagTitulo="CHUVA DE GOLS"
              tagCor="bg-sky-500/20 text-sky-400 border-sky-500/40"
              subtexto={
                destaques.jogoChuvaGols
                  ? `${Number(destaques.jogoChuvaGols.gols_casa) + Number(destaques.jogoChuvaGols.gols_visitante)} Gols no total`
                  : null
              }
            />
          </div>

          {/* 3. DEFESA DE FERRO */}
          {destaques.timeDefesaFerro && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <ShieldAlert className="w-6 h-6 text-emerald-400 shrink-0" />
                <img
                  src={getEscudo(destaques.timeDefesaFerro.time)}
                  alt={destaques.timeDefesaFerro.time}
                  className="w-8 h-8 object-contain shrink-0"
                />
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm font-bold text-white truncate">{destaques.timeDefesaFerro.time}</span>
                    {destaques.timeDefesaFerro.jogador && (
                      <span className="text-xs font-bold text-emerald-400 shrink-0">
                        ({destaques.timeDefesaFerro.jogador})
                      </span>
                    )}
                  </div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    Defesa de Ferro • {destaques.timeDefesaFerro.golsContra} gols em {destaques.timeDefesaFerro.jogos} jogos
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-base font-black text-emerald-400">{destaques.timeDefesaFerro.mediaSofridos}</span>
                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-500">Média/Jogo</span>
              </div>
            </div>
          )}

          {/* 4. REI DO EMPATE */}
          {destaques.timeReiEmpate && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <Scale className="w-6 h-6 text-emerald-400 shrink-0" />
                <img
                  src={getEscudo(destaques.timeReiEmpate.time)}
                  alt={destaques.timeReiEmpate.time}
                  className="w-8 h-8 object-contain shrink-0"
                />
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm font-bold text-white truncate">{destaques.timeReiEmpate.time}</span>
                    {destaques.timeReiEmpate.jogador && (
                      <span className="text-xs font-bold text-emerald-400 shrink-0">
                        ({destaques.timeReiEmpate.jogador})
                      </span>
                    )}
                  </div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    Rei do Empate • {destaques.timeReiEmpate.empates} empates em {destaques.timeReiEmpate.jogos} jogos
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-base font-black text-emerald-400">{destaques.timeReiEmpate.empates}</span>
                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-500">Empates</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RANKINGS TÁTICOS (APROVEITAMENTO & OFENSIVIDADE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* APROVEITAMENTO (% DE VITÓRIA) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-md p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Aproveitamento (Taxa de Vitória)
            </h4>
          </div>

          <div className="space-y-3">
            {rankingTaxaVitoria.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 rounded-sm">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-xs font-black text-slate-500 w-4">{idx + 1}º</span>
                  <img src={getEscudo(item.time)} alt={item.time} className="w-6 h-6 object-contain shrink-0" />
                  <div className="truncate">
                    <span className="text-sm font-bold text-slate-200">{item.time}</span>
                    {item.jogador && (
                      <span className="text-xs font-bold text-emerald-400 ml-1.5">
                        ({item.jogador})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-sm font-black text-emerald-400">{item.taxaVitoria}%</span>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    {formatarTextoVitorias(item.vitorias, item.jogos)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OFENSIVIDADE (MÉDIA DE GOLS POR JOGO) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-md p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Ofensividade (Média de Gols/Jogo)
            </h4>
          </div>

          <div className="space-y-3">
            {rankingMediaGols.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 rounded-sm">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-xs font-black text-slate-500 w-4">{idx + 1}º</span>
                  <img src={getEscudo(item.time)} alt={item.time} className="w-6 h-6 object-contain shrink-0" />
                  <div className="truncate">
                    <span className="text-sm font-bold text-slate-200">{item.time}</span>
                    {item.jogador && (
                      <span className="text-xs font-bold text-emerald-400 ml-1.5">
                        ({item.jogador})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-sm font-black text-emerald-400">{item.mediaGols}</span>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    {formatarTextoGols(item.golsPro, item.jogos)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}