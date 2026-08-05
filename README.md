# E-FUT MANAGER - Gerenciador de Torneios de Futebol Digital

Sistema web focado no gerenciamento ágil de torneios de futebol digital. Projetado para eliminar a necessidade de cadastro ou criação de contas, o sistema permite que torneios sejam gerados e acessados instantaneamente por meio de um ID único e senha, fornecendo controle de tabelas, chaveamentos e estatísticas em tempo real.

---

## Acesso Direto e Documentação

- **Aplicação em Produção (Web App):** [https://e-fut-manager.vercel.app/](https://e-fut-manager.vercel.app/)
- **Documentação Técnica Oficial:** [Documentação no Google Docs](https://docs.google.com/document/d/e/2PACX-1vSOSRK8ZOlLekKXsMKVE0Goc6--XpOu9XIKZLgCpvncGiCQcF1zRFc9wQgK0JkZul6LKYawtPdT3NYu/pub)

---

## Funcionalidades e Regras de Negócio

* **Formatos de Competição:** Suporte completo para criação de torneios nos formatos **Mata-Mata** direto, **Modo Copa** (Fase de Grupos + Playoffs) e **Pontos Corridos**.
* **Algoritmo de Matchmaking e Potes (Beta):** Sorteio de duplas (2v2) utilizando potes por nível de habilidade (*Ouro, Prata e Bronze*). **Atenção:** Funcionalidade em fase de testes (Beta), podendo apresentar falhas no balanceamento automático. O modo Solo (1v1) está 100% estável.
* **Hierarquia Rígida de Desempate:** Em torneios de Pontos Corridos, o sistema aplica uma ordem automática de prioridade para separar posições empatadas: Pontos > Confronto Direto > Saldo de Gols > Gols Marcados.
* **Empate Absoluto e Rodada D:** Quando 100% das partidas normais dos Pontos Corridos são finalizadas e ocorre um "empate absoluto" (duas ou mais equipes igualadas em todos os critérios de desempate), o sistema gera automaticamente uma Rodada Extra ("Rodada D"). Os organizadores podem optar por disputar essas partidas no jogo ou deixar o sistema decidir o campeão por sorteio. *No Modo Copa, empates absolutos são resolvidos diretamente por sorteio.*
* **Ciclo de Vida e Expiração Automática:** Limpeza contínua em segundo plano no banco de dados. Torneios inativos ou finalizados são removidos após 7 dias sem acesso, e qualquer torneio é apagado automaticamente após 14 dias.
* **Integridade de Cadastros:** Validação contra nicks duplicados no cadastro de participantes, permitindo que jogadores escolham os mesmos clubes sem gerar conflitos nas tabelas.
* **Acervo de Escudos Integrado:** Biblioteca nativa com mais de 200 logos e escudos oficiais, incluindo clubes globais, seleções e times lendários.
* **Interface Responsiva:** Layout otimizado para dispositivos móveis, tablets e desktops, com atualizações de placar e navegação por abas em tempo real.

---

## Divergências entre o Repositório Vitrine e a Versão em Deploy

Este repositório contém o código-fonte base estruturado para desenvolvimento e demonstração. A versão atualmente em produção no deploy possui otimizações de infraestrutura, comunicação, segurança e ativos visuais:

| Recurso / Camada | Repositório Vitrine (Desenvolvimento) | Versão em Deploy (Produção) |
| :--- | :--- | :--- |
| **Hospedagem Front-End** | Ambiente Local (`localhost`) | **Vercel** (Deploy contínuo via CI/CD) |
| **Hospedagem Back-End** | Ambiente Local (`localhost`) | **Render** (Web Service hospedado em nuvem) |
| **Comunicação Front-Back** | Endpoints direcionados a `http://localhost:8000` | **Integração via HTTPS** utilizando variável de ambiente (`VITE_API_URL`) para apontar dinamicamente ao servidor do Render |
| **Banco de Dados** | SQLite (Arquivo local `.db`) | **PostgreSQL** (Instância em nuvem com persistência contínua) |
| **Segurança e Rate Limiting** | Sem restrição de requisições | **SlowAPI / Rate Limiting** habilitado para proteção contra abuso de endpoints |
| **Biblioteca de Escudos** | Escudos padrão / demonstrativos | **200+ Escudos Internos** de times, seleções e lendas globais pré-carregados |
| **Driver de Banco (ORM)** | SQLAlchemy (Driver SQLite) | SQLAlchemy + **psycopg2-binary** adaptável via variável de ambiente `DATABASE_URL` |

---

## Tecnologias Utilizadas

| Camada | Stack Principal |
| :--- | :--- |
| **Back-End** | Python, FastAPI, Pydantic, SQLAlchemy, SlowAPI |
| **Front-End** | React.js, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Banco de Dados** | SQLite (Dev) / PostgreSQL (Prod) |
| **Infraestrutura** | Vercel (Front-End), Render (Back-End) |

---

## Sugestões Pessoais para Melhorias

1. **Repositório/Biblioteca Privada de Assets SVG (CDN de Escudos):**
   * Na versão atual em deploy, a aplicação carrega mais de 200 arquivos SVG internos.
   * O próximo passo arquitetural é criar um repositório dedicado/privado para hospedar e entregar essas imagens vetoriais (SVG CDN). Isso reduzirá o peso da aplicação no front-end e permitirá adicionar novos escudos sem precisar fazer um novo deploy do sistema principal.

2. **Homologação do Modo 2v2:**
   * Concluir a bateria de testes operacionais no sistema de sorteio de duplas e potes de habilidade para remover o selo Beta.

---

## Histórico de Desenvolvimento (Scrum Roadmap)

- [x] **Sprint 1 (Base e Sorteios):** Estruturação do Back-End e criação do algoritmo de Sorteio com validações de duplas.
- [x] **Sprint 2 (Motor de Torneios):** Lógica do algoritmo Round-Robin, geração de tabelas e chaveamento Mata-Mata.
- [x] **Sprint 3 (Regras e Validações):** Implementação dos critérios de desempate e validação rígida de ID e Senha.
- [x] **Sprint 4 (Front-End e UI):** Construção da interface Web responsiva e formulários dinâmicos.
- [x] **Sprint 5 (Integração e Limpeza):** Conexão das rotas da API e tratamento de exceções.
- [x] **Sprint 6 (Polimento e Regras de Negócio):** Animações, validação de nicks duplicados, cálculo de confronto direto e trava da Rodada D.
- [x] **Sprint 7 (Migração para Nuvem e Persistência):** Configuração de infraestrutura de produção com Vercel, Render, migração para PostgreSQL e proteção por Rate Limiting.

---

*Projeto desenvolvido por Evandio de Souza Filho com o auxílio de Inteligência Artificial.*