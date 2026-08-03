# FUT MANAGER - Gerenciador de Torneios de FIFA / EA FC

Ao jogar com os amigos pensei em criar esse projeto: um gerenciador de torneios web focado em campeonatos de FIFA. Projetado para ser rápido e sem atritos, o sistema não exige criação de contas: os torneios são gerados e acessados instantaneamente através de um ID único e senha, permitindo o gerenciamento de tabelas, chaveamentos e sorteios de forma ágil pelo navegador.

---

## Funcionalidades e Regras de Negócio

*   **Formatos de Competição:** Suporte completo para criação de torneios nos formatos **Mata-Mata**, **Modo Copa** (Grupos + Eliminatórias) e **Pontos Corridos**.
*   **Algoritmo de Matchmaking & Potes:** Sorteio e balanceamento inteligente de duplas utilizando potes por nível de habilidade (*Ouro, Prata e Bronze.* Ainda em beta) ou modo de disputa Solo (1v1).
*   **Hierarquia Rígida de Desempate:** Em torneios de Pontos Corridos, o sistema aplica ordem de prioridade para posições empatadas em pontos:
    1.  **Confronto Direto:** Compara os pontos somados nos duelos diretos entre as equipes empatadas.
    2.  **SG (Saldo de Gols):** Diferença geral entre gols marcados e sofridos.
    3.  **GP (Gols Pró):** Total de gols marcados no campeonato.
    4.  **Rodada de Desempate (D) ou Sorteio:** Acionada somente em caso de igualdade absoluta em todos os critérios anteriores.
*   **Trava de Segurança da Rodada "D":** A rodada extra pelo título só é habilitada automaticamente após **100% das partidas normais** da tabela estarem finalizadas e com placar preenchido.
*   **Integridade de Cadastros:** Proteção contra nomes/nicks duplicados no cadastro de participantes, permitindo repetição de clubes sem conflitar jogadores na tabela.
*   **Interface Tática & Responsiva:** UI construída com alertas em tempo real para critérios de desempate, transições fluidas e layout compatível com smartphones, tablets e desktops.

> **[Ler Documentação Completa no Google Docs](https://docs.google.com/document/d/e/2PACX-1vSOSRK8ZOlLekKXsMKVE0Goc6--XpOu9XIKZLgCpvncGiCQcF1zRFc9wQgK0JkZul6LKYawtPdT3NYu/pub)**

---

## Tecnologias Utilizadas

| Camada | Stack Principal |
| :--- | :--- |
| **Back-End** | Python, FastAPI, Pydantic, SQLAlchemy |
| **Front-End** | React.js, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Banco de Dados** | SQLite *(Desenvolvimento)* / PostgreSQL *(Produção)* |

---

## Backlog do Projeto (Scrum Roadmap)

- [x] **Sprint 1 (Base e Sorteios):** Estruturação do Back-End e criação do algoritmo de Sorteio (Raffle Engine) com as validações matemáticas de duplas.
- [x] **Sprint 2 (Motor de Torneios):** Lógica do algoritmo Round-Robin, geração de tabelas e chaveamento (Mata-Mata).
- [x] **Sprint 3 (Regras e Validações):** Implementação dos critérios de desempate e validação rígida de ID (Regex) e Senha para a criação dos torneios.
- [x] **Sprint 4 (Front-End e UI):** Construção da interface Web, incluindo o formulário dinâmico em JavaScript que alterna entre Solo e Dupla.
- [x] **Sprint 5 (Integração e Limpeza):** Conexão das rotas e configuração da rotina de exclusão automática (Retenção de Dados).
- [x] **Sprint 6 (Polimento, Regras de Desempate e UI/UX):** Elevar a qualidade da interface gráfica com animações, otimizar a responsividade para dispositivos móveis/tablets, travar nicks duplicados e implementar cálculo de confronto direto e Rodada "D".
- [ ] **Sprint 7 (Deploy em Nuvem, Polimento Final):** Retirar a aplicação do ambiente local de desenvolvimento (`localhost`) e disponibilizá-la publicamente na internet com alta performance e persistência de dados contínua, além de realizar testes ponta a ponta gerais.

---
*Desenvolvido por Evandio de Souza Filho com auxílio de Inteligência Artificial.*