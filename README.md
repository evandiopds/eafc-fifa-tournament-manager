# 🏆 FIFA (EA FC) Tournament Manager

Um gerenciador de torneios web focado em campeonatos de FIFA. Projetado para ser rápido e sem atritos, o sistema não exige criação de contas: os torneios são gerados e acessados instantaneamente através de um ID único e senha, permitindo o gerenciamento de tabelas, chaveamentos e sorteios de forma ágil pelo navegador.

## Funcionalidades e Fluxo de Uso

### 1. Sistema de Acesso Sem Login
*   **Criar Torneio:** Formulário rápido para iniciar uma nova competição.
*   **Verificar Torneio:** Acesso seguro a um torneio existente utilizando ID e Senha.
    *   **Regra de ID (Nome do Torneio):** Máximo de 15 caracteres. Permitido apenas letras (maiúsculas e minúsculas) e números. Sem caracteres especiais.
    *   **Regra de Senha:** Entre 4 e 8 caracteres, aceitando qualquer variação.

### 2. Criação Dinâmica de Torneios
*   **Modalidades:** Suporte para formatos de Pontos Corridos, Mata-Mata e Híbrido (Grupos + Eliminatórias).
*   **Formato de Participação:** 
    *   **Solo:** Um jogador vinculado a um time (ex: *João (Chelsea)*).
    *   **Dupla:** O formulário se adapta dinamicamente para receber dois jogadores vinculados ao mesmo time (ex: *João e Maria (Chelsea)*).

### 3. Motor de Sorteio (Raffle Engine)
Uma aba independente dedicada a automatizar a divisão dos participantes antes do torneio começar:
*   **Sorteio de Times:** Vincula aleatoriamente uma lista de jogadores a uma lista de times selecionados.
*   **Formação de Duplas:** Sorteia aleatoriamente os jogadores entre si para formar as duplas.
*   **Duplas p/ Times:** Sorteia as duplas formadas para os times disponíveis.
    *   *Validação Lógica:* O sistema exige que o número de times disponíveis seja maior ou igual ao resultado da divisão de pessoas por dois (Ex: Para 15 pessoas, são necessários no mínimo 8 times para viabilizar o sorteio).

### 4. Política de Retenção de Dados (Limpeza Automática)
Para garantir a otimização do banco de dados, o sistema possui regras estritas de ciclo de vida:
*   **Torneios Inativos/Finalizados:** Excluídos automaticamente após **7 dias** de inatividade ou da data de finalização.
*   **Prazo Máximo (Hard Limit):** Qualquer torneio, independentemente de estar ativo ou sofrendo alterações, é permanentemente excluído após **30 dias** da sua criação.

## Tecnologias

*   **Back-End:** Python (FastAPI)
*   **Front-End:** Tailwind CSS, React.js
*   **Banco de Dados:** PostgreSQL

## Backlog do Projeto (Scrum Roadmap)

- [ ] **Sprint 1 (Base e Sorteios):** Estruturação do Back-End e criação do algoritmo de Sorteio (Raffle Engine) com as validações matemáticas de duplas.
- [ ] **Sprint 2 (Motor de Torneios):** Lógica do algoritmo Round-Robin, geração de tabelas e chaveamento (Mata-Mata).
- [ ] **Sprint 3 (Regras e Validações):** Implementação dos critérios de desempate e validação rígida de ID (Regex) e Senha para a criação dos torneios.
- [ ] **Sprint 4 (Front-End & UI):** Construção da interface Web, incluindo o formulário dinâmico em JavaScript que alterna entre Solo e Dupla.
- [ ] **Sprint 5 (Integração, Deploy e Limpeza):** Conexão das rotas, configuração da rotina de exclusão automática (Retenção de Dados) e deploy na nuvem.

---
*Desenvolvido por Evandio Filho.*