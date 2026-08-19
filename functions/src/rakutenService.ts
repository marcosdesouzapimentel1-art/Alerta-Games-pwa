import axios from 'axios';

/**
 * Serviço modular para gerenciar diferentes APIs da Rakuten Advertising.
 */
class RakutenService {
    private baseURL: string;

    constructor() {
        this.baseURL = 'https://api.linksynergy.com';
    }

    /**
     * 1. Endpoint de Cupons (GET /coupon/1.0)
     * Retorna a lista de cupons e links promocionais dos anunciantes.
     */
    async getCoupons(apiToken: string, categoryId?: string): Promise<any> {
        if (!apiToken) {
            throw new Error('Token de segurança ausente para acessar os cupons da Rakuten.');
        }

        // Constrói a URL do endpoint de cupons conforme a documentação
        let endpoint = `${this.baseURL}/coupon/1.0`;
        if (categoryId) {
            endpoint += `?promocat=${categoryId}`;
        }

        try {
            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${apiToken.trim()}`,
                    'Accept': 'application/json' // Tenta pedir JSON; se retornar XML, trataremos abaixo se necessário
                },
                timeout: 10000
            });

            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data || error.message;
            console.error('Erro ao buscar Cupons na Rakuten:', errorMessage);
            throw new Error('Falha ao obter cupons da API da Rakuten.');
        }
    }

    /**
     * 2. Endpoint de Link Locator para Links de Texto (GET /linklocator/1.0/getTextLinks/...)
     */
    async getTextLinks(advertiserId: string, apiToken: string): Promise<any> {
        if (!advertiserId || !apiToken) {
            throw new Error('Parâmetros ausentes: advertiserId e apiToken são obrigatórios.');
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
            console.error(`Erro ao buscar Links de Texto (Advertiser: ${advertiserId}):`, errorMessage);
            throw new Error('Falha ao obter links de texto da Rakuten.');
        }
    }
}

export default new RakutenService();
