const axios = require('axios');

/**
 * Serviço responsável por comunicar com a API da Rakuten Advertising com segurança.
 */
class RakutenService {
    constructor() {
        this.baseURL = 'https://api.linksynergy.com';
    }

    /**
     * Busca links de texto de um anunciante específico.
     * @param {string} advertiserId - O MID do anunciante (ex: '53304' da Hype Games)
     * @param {string} apiToken - Token de autenticação da API
     * @returns {Promise<Object>} - Dados retornados pela API
     */
    async getTextLinks(advertiserId, apiToken) {
        // Validação de segurança básica para evitar requisições vazias ou inválidas
        if (!advertiserId || !apiToken) {
            throw new Error('Parâmetros de segurança ausentes: advertiserId e apiToken são obrigatórios.');
        }

        // Definindo parâmetros dinâmicos ou datas seguras
        const categoryId = '1';
        // Utilizando datas estáticas ou gerando dinamicamente conforme necessário
        const startDate = '2026-08-01';
        const endDate = '2026-12-30';
        const page = '1';

        const endpoint = `${this.baseURL}/linklocator/1.0/getTextLinks/${advertiserId}/${categoryId}/${startDate}/${endDate}/0/${page}`;

        try {
            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${apiToken.trim()}`,
                    'Accept': 'application/json'
                },
                timeout: 10000 // Timeout de segurança de 10 segundos para travar travamentos
            });

            return response.data;
        } catch (error) {
            // Tratamento de erro seguro: loga detalhes técnicos no servidor, mas oculta o token real
            const errorMessage = error.response?.data || error.message;
            console.error(`Erro ao comunicar com a Rakuten (Advertiser: ${advertiserId}):`, errorMessage);
            
            throw new Error('Falha ao obter dados da API da Rakuten com segurança.');
        }
    }
}

module.exports = new RakutenService();
