# FUT MANAGER - Gerenciador de Torneios de EA FC / FIFA

Sistema web focado no gerenciamento ágil de torneios de futebol digital. Projetado para eliminar a necessidade de cadastro ou criação de contas, o sistema permite que torneios sejam gerados e acessados instantaneamente por meio de um ID único e senha, fornecendo controle de tabelas, chaveamentos e estatísticas em tempo real.

---

## Acesso Direto e Documentação

- **Aplicação em Produção (Web App):** [https://e-fut-manager.vercel.app/](https://e-fut-manager.vercel.app/)
- **Documentação Técnica Oficial:** [Documentação no Google Docs](https://docs.google.com/document/d/e/2PACX-1vSOSRK8ZOlLekKXsMKVE0Goc6--XpOu9XIKZLgCpvncGiCQcF1zRFc9wQgK0JkZul6LKYawtPdT3NYu/pub)

---

## Funcionalidades e Regras de Negócio

* **Formatos de Competição:** Suporte completo para criação de torneios nos formatos **Mata-Mata**, **Modo Copa** (Fase de Grupos + Eliminatórias) e **Pontos Corridos**.
* **Algoritmo de Matchmaking e Potes:** Sorteio e balanceamento inteligente de duplas utilizando potes por nível de habilidade (*Ouro, Prata e Bronze* - em fase Beta) ou modo de disputa Solo (1v1).
* **Hierarquia Rígida de Desempate:** Em torneios de Pontos Corridos, o sistema aplica ordem automática de prioridade para posições empatadas em pontos (Vitórias, Saldo de Gols, Gols Pró, Confronto Direto).
* **Trava de Segurança da Rodada D:** A rodada extra pelo título é habilitada automaticamente apenas após 100% das partidas normais da tabela estarem finalizadas com placar preenchido.
* **Integridade de Cadastros:** Validação contra nomes/nicks duplicados no cadastro de participantes, permitindo a repetição de clubes sem gerar conflitos de jogadores na tabela.
* **Interface Responsiva:** Interface otimizada para dispositivos móveis, tablets e desktops com atualizações visuais em tempo real.

---

## Divergências entre o Repositório Vitrine e a Versão em Deploy

Este repositório contém o código-fonte base estruturado para desenvolvimento e demonstração. A versão atualmente em produção contida no deploy possui otimizações de infraestrutura, comunicação, segurança e ativos visuais:

| Recurso / Camada | Repositório Vitrine (Desenvolvimento) | Versão em Deploy (Produção) |
| :--- | :--- | :--- |
| **Hospedagem Front-End** | Ambiente Local (`localhost`) | **Vercel** (Deploy contínuo via CI/CD) |
| **Hospedagem Back-End** | Ambiente Local (`localhost`) | **Render** (Web Service hospedado em nuvem) |
| **Comunicação Front-Back** | Endpoints direcionados a `http://localhost:8000` | **Integração via HTTPS** utilizando variável de ambiente (`VITE_API_URL`) para apontar dinamicamente ao servidor do Render |
| **Banco de Dados** | SQLite (Arquivo local `.db`) | **PostgreSQL** (Instância em nuvem com persistência contínua) |
| **Segurança e Rate Limiting** | Sem restrição de requisições | **SlowAPI / Rate Limiting** habilitado para proteção contra abuso de endpoints |
| **Biblioteca de Escudos** | Escudos padrão / demonstrativos | **160+ Escudos Internos** de times e seleções globais pré-carregados |
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

## Futuro e Próximos Passos

1. **Repositório/Biblioteca Privada de Assets SVG (CDN de Escudos):**
   * Na versão atual em deploy, a aplicação utiliza aproximadamente 160 arquivos SVG internos de escudos de clubes e seleções.
   * O próximo passo arquitetural consiste no desenvolvimento de um repositório dedicado/privado para hospedagem e entrega de imagens vetoriais (SVG CDN). Isso reduzirá o tamanho do bundle do front-end e permitirá a expansão contínua da biblioteca de ativos visuais sem necessidade de novos deploys da aplicação principal.

2. **Estabilização Oficial do Modo Duplas (2v2 BETA):**
   * Refinamento completo das travas de validação e balanceamento por potes de habilidade (*Ouro, Prata e Bronze*).
   * Conclusão da suíte de testes ponta a ponta para homologação definitiva do formato 2v2 em produção.

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