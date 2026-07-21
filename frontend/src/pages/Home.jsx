export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      
      {/* Cabeçalho / Título */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-4">
          TourneyManager
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Crie, gerencie e acompanhe campeonatos entre amigos com tabelas automáticas e sorteios inteligentes.
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        
        {/* Botão: Criar Torneio */}
        <button className="flex-1 group relative p-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 shadow-lg shadow-emerald-500/30">
          <div className="bg-slate-900 px-6 py-4 rounded-lg group-hover:bg-opacity-0 transition-all duration-300">
            <span className="text-xl font-bold text-white">Criar Torneio</span>
            <p className="text-emerald-200 text-sm mt-1 group-hover:text-white transition-colors">
              Modo Copa, Pontos Corridos ou Mata-Mata
            </p>
          </div>
        </button>

        {/* Botão: Acessar Torneio */}
        <button className="flex-1 border-2 border-slate-700 hover:border-cyan-500 bg-slate-800/50 hover:bg-slate-800 px-6 py-4 rounded-xl transition-all duration-300 shadow-lg">
          <span className="text-xl font-bold text-slate-200">Acessar Torneio</span>
          <p className="text-slate-400 text-sm mt-1">
            Já tem um ID? Entre por aqui
          </p>
        </button>

      </div>
    </div>
  );
}