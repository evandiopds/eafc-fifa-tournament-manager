import timesData from './teams.json';

const normalizar = (texto) => {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const buscarTime = (nomeBuscado) => {
    if (!nomeBuscado || nomeBuscado.trim() === "") return null;

    const termo = normalizar(nomeBuscado.trim());

    for (const liga in timesData) {
        for (const time of timesData[liga]) {
            const nomeOficial = normalizar(time.nomeOficial);
            const sigla = time.sigla ? normalizar(time.sigla) : "";
            
            const apelidoEncontrado = time.apelidos && time.apelidos.some(
                (apelido) => normalizar(apelido) === termo
            );

            if (nomeOficial === termo || sigla === termo || apelidoEncontrado) {
                return {
                    ...time,
                    nome: time.nomeOficial,
                    nomeOficial: time.nomeOficial,
                    encontrado: true
                };
            }
        }
    }

    return {
        nomeOficial: nomeBuscado,
        nome: nomeBuscado,
        sigla: nomeBuscado.substring(0, 3).toUpperCase(),
        escudo: "/escudo-padrao.png",
        encontrado: false
    };
};