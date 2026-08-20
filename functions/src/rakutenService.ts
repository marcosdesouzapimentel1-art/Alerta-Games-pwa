import axios from 'axios';

class RakutenService {
    private baseURL: string;

    constructor() {
        this.baseURL = 'https://api.linksynergy.com';
    }

    async getTextLinks(advertiserId: string, apiToken: string): Promise<any> {
        if (!advertiserId || !apiToken) {
            throw new Error('Parâmetros ausentes: advertiserId e apiToken são obrigatórios.');
        }

        // Endpoint oficial do Link Locator para buscar dados do anunciante aceitando Bearer Token
        const endpoint = `${this.baseURL}/linklocator/1.0/getMerchByID/${advertiserId}`;

        try {
            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${apiToken.trim()}`,
                    'Accept': 'application/xml, text/xml, application/json'
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
