import timesData from './teams.json';

/**
 * Remove acentos e converte para minúsculas.
 */
const normalizar = (texto) => {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

/**
 * Busca um time pelo nome, sigla ou apelido.
 * Retorna os dados oficiais ou um objeto de fallback gerado dinamicamente.
 */
export const buscarTime = (nomeBuscado) => {
    if (!nomeBuscado || nomeBuscado.trim() === "") return null;

    const termo = normalizar(nomeBuscado.trim());

    // Varre as chaves (ligas) do JSON
    for (const liga in timesData) {
        for (const time of timesData[liga]) {
            const nomeOficial = normalizar(time.nomeOficial);
            const sigla = normalizar(time.sigla);
            
            // Verifica se o termo bate com o nome, com a sigla ou se está na lista de apelidos
            if (nomeOficial === termo || sigla === termo || time.apelidos.includes(termo)) {
                return time;
            }
        }
    }

    // Se o laço terminar e não encontrar nada, aplica a sua regra de fallback
    return {
        nomeOficial: nomeBuscado,
        sigla: nomeBuscado.substring(0, 3).toUpperCase(),
        escudo: "/escudo-padrao.png" 
    };
};