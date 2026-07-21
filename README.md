# 🏆 EAFC FIFA Tournament Manager

Ao jogar com os amigos pensei em criar esse projeto: um gerenciador de torneios web focado em campeonatos de FIFA. Projetado para ser rápido e sem atritos, o sistema não exige criação de contas: os torneios são gerados e acessados instantaneamente através de um ID único e senha, permitindo o gerenciamento de tabelas, chaveamentos e sorteios de forma ágil pelo navegador.

## Funcionalidades e Fluxo de Uso
* Criação de torneios nos formatos: Mata-Mata, Copa e Pontos Corridos.
* Algoritmo de Matchmaking para sorteio e balanceamento de duplas.
* Validação automática de times e participantes.

> **[Ler Documentação Completa no Google Docs](https://docs.google.com/document/d/e/2PACX-1vSOSRK8ZOlLekKXsMKVE0Goc6--XpOu9XIKZLgCpvncGiCQcF1zRFc9wQgK0JkZul6LKYawtPdT3NYu/pub)**

## Tecnologias

*   **Back-End:** Python, FastAPI, Pydantic
*   **Front-End:** Tailwind CSS, Vite, React.js
*   **Banco de Dados:** SQLite (Ambiente de Desenvolvimento), PostgreSQL (Ambiente de Produção), SQLAlchemy (ORM)

## Backlog do Projeto (Scrum Roadmap)

- [x] **Sprint 1 (Base e Sorteios):** Estruturação do Back-End e criação do algoritmo de Sorteio (Raffle Engine) com as validações matemáticas de duplas.
- [x] **Sprint 2 (Motor de Torneios):** Lógica do algoritmo Round-Robin, geração de tabelas e chaveamento (Mata-Mata).
- [x] **Sprint 3 (Regras e Validações):** Implementação dos critérios de desempate e validação rígida de ID (Regex) e Senha para a criação dos torneios.
- [x] **Sprint 4 (Front-End & UI):** Construção da interface Web, incluindo o formulário dinâmico em JavaScript que alterna entre Solo e Dupla.
- [ ] **Sprint 5 (Integração, Deploy e Limpeza):** Conexão das rotas, configuração da rotina de exclusão automática (Retenção de Dados) e deploy na nuvem.
-  [ ] **Sprint 6 (Polimento e UI/UX):** Elevar a qualidade da interface gráfica e implementar regras avançadas de renderização. 
---
*Desenvolvido por Evandio de Souza Filho.*