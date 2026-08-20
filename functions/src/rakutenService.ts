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

        // Passando o token diretamente como parâmetro na URL, que é o padrão de muitas APIs da Rakuten
        const endpoint = `${this.baseURL}/linklocator/1.0/getMerchByID/${advertiserId}?token=${apiToken.trim()}`;

        try {
            const response = await axios.get(endpoint, {
                headers: {
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
