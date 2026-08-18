import axios from 'axios';

/**
 * Serviço responsável por comunicar com a API da Rakuten Advertising com segurança.
 */
class RakutenService {
    private baseURL: string;

    constructor() {
        this.baseURL = 'https://api.linksynergy.com';
    }

    /**
     * Busca links de texto de um anunciante específico.
     */
    async getTextLinks(advertiserId: string, apiToken: string): Promise<any> {
        if (!advertiserId || !apiToken) {
            throw new Error('Parâmetros de segurança ausentes: advertiserId e apiToken são obrigatórios.');
        }

        const categoryId = '1';
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
                timeout: 10000 
            });

            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data || error.message;
            console.error(`Erro ao comunicar com a Rakuten (Advertiser: ${advertiserId}):`, errorMessage);
            throw new Error('Falha ao obter dados da API da Rakuten com segurança.');
        }
    }
}

export default new RakutenService();
