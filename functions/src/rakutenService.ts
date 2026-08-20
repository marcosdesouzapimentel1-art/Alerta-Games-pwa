import axios from 'axios';

/**
 * Serviço modular para gerenciar as APIs da Rakuten Advertising.
 */
class RakutenService {
    private baseURL: string;

    constructor() {
        this.baseURL = 'https://api.linksynergy.com';
    }

    /**
     * Busca informações de um anunciante específico pelo ID (ex: Hype Games) na Rakuten.
     */
    async getTextLinks(advertiserId: string, apiToken: string): Promise<any> {
        if (!advertiserId || !apiToken) {
            throw new Error('Parâmetros ausentes: advertiserId e apiToken são obrigatórios.');
        }

        // Rota correta conforme a documentação oficial da Rakuten (getMerchByID)
        const endpoint = `${this.baseURL}/linklocator/1.0/getMerchByID/${advertiserId}`;

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
            
            throw new Error(`Falha ao obter dados da Rakuten: ${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)}`);
        }
    }
}

export default new RakutenService();
