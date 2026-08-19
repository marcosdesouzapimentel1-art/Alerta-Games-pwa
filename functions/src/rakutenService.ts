import axios from 'axios';

/**
 * Serviço modular para gerenciar as APIs da Rakuten Advertising.
 */
class RakutenService {
    private baseURL: string;

    constructor() {
        // Ajustado para o domínio correto do Link Locator da Rakuten
        this.baseURL = 'https://api.linksynergy.com/linklocator/1.0';
    }

    /**
     * Busca links de texto de um anunciante específico na Rakuten.
     */
    async getTextLinks(advertiserId: string, apiToken: string): Promise<any> {
        if (!advertiserId || !apiToken) {
            throw new Error('Parâmetros ausentes: advertiserId e apiToken são obrigatórios.');
        }

        const categoryId = '1';
        const startDate = '2026-08-01';
        const endDate = '2026-12-30';
        const page = '1';

        // URL corrigida incluindo o endpoint padrão esperado pela API
        const endpoint = `${this.baseURL}/${advertiserId}/${categoryId}/${startDate}/${endDate}/0/${page}`;

        try {
            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `${apiToken.trim()}`,
                    'Accept': 'application/json, application/xml, text/xml'
                },
                timeout: 10000 
            });

            return response.data;
        } catch (error: any) {
            const errorDetails = error.response?.data || error.message;
            console.error(`Erro detalhado Rakuten (Advertiser: ${advertiserId}):`, JSON.stringify(errorDetails));
            
            throw new Error(`Falha ao obter links da Rakuten: ${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)}`);
        }
    }
}

export default new RakutenService();
