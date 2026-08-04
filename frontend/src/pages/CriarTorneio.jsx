import { useState } from 'react';

// Renderiza o fluxo de criação de um novo torneio dividido por abas sequenciais
export default function CriarTorneio() {
  const [abaAtual, setAbaAtual] = useState(1);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl mt-8">
        {/* Cabeçalho de Apresentação */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-emerald-400">Novo Torneio</h2>
          <p className="text-slate-400 mt-2">Configure as regras e os participantes</p>
        </div>

        {/* Indicador de Etapas / Navegação Superior */}
        <div className="flex justify-between border-b border-slate-700 mb-8 pb-4">
          {['Formato', 'Jogadores', 'Times', 'Segurança'].map((titulo, index) => {
            const numeroAba = index + 1;
            const ativa = abaAtual === numeroAba;
            
            return (
              <button
                key={numeroAba}
                onClick={() => setAbaAtual(numeroAba)}
                className={`text-sm font-semibold transition-colors ${
                  ativa ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {numeroAba}. {titulo}
              </button>
            );
          })}
        </div>

        {/* Conteúdo da Etapa Selecionada */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl min-h-[300px]">
          {abaAtual === 1 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Escolha o Formato do Jogo</h3>
              <p className="text-slate-400">Aqui entrarão os botões: Pontos Corridos, Copa e Mata-Mata.</p>
            </div>
          )}

          {abaAtual === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Configuração de Jogadores</h3>
              <p className="text-slate-400">Aqui entrará a alternância Solo/Dupla e as mecânicas de Tiers (Ouro/Prata/Bronze).</p>
            </div>
          )}

          {abaAtual === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Seleção de Times</h3>
              <p className="text-slate-400">Aqui ficará o nosso motor de busca para preencher os participantes.</p>
            </div>
          )}

          {abaAtual === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Segurança e Finalização</h3>
              <p className="text-slate-400">Aqui entraremos com o ID, Senha e o botão de Gerar Torneio.</p>
            </div>
          )}
        </div>

        {/* Ações de Navegação Inferior */}
        <div className="flex justify-between mt-6">
          <button 
            disabled={abaAtual === 1}
            onClick={() => setAbaAtual(abaAtual - 1)}
            className="px-4 py-2 bg-slate-700 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-600 transition-colors"
          >
            Voltar
          </button>
          
          <button 
            disabled={abaAtual === 4}
            onClick={() => setAbaAtual(abaAtual + 1)}
            className="px-4 py-2 bg-emerald-600 rounded-lg text-white font-bold disabled:opacity-50 hover:bg-emerald-500 transition-colors"
          >
            Avançar
          </button>
        </div>
      </div>
    </div>
  );
}