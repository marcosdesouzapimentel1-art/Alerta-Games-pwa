import { db } from '../lib/firebase';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

export async function runRakutenCouponsSync() {
    const startTime = Date.now();
    const apiToken = process.env.RAKUTEN_TOKEN || '';
    const advertiserId = '53304'; // Hype Games

    console.log('[Rakuten Sync] Iniciando sincronização limpa de cupons e ofertas...');

    try {
        const endpoint = `https://api.linksynergy.com/linklocator/1.0/getCoupon/${advertiserId}`;
        
        const response = await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${apiToken.trim()}`,
                'Accept': 'application/xml, text/xml, application/json'
            },
            timeout: 10000
        });

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        const parsedJson = parser.parse(response.data);

        const rootKey = Object.keys(parsedJson)[0];
        const responseBody = parsedJson[rootKey];
        let itemsList = responseBody?.coupon || responseBody?.return || [];

        if (!Array.isArray(itemsList)) {
            itemsList = itemsList ? [itemsList] : [];
        }

        let couponsCount = 0;
        let offersCount = 0;

        // Limpa ou atualiza de forma organizada
        for (const item of itemsList) {
            const isCoupon = item.couponCode || item.couponTitle;

            if (isCoupon) {
                // Salva estritamente na coleção 'coupons'
                const couponData = {
                    id: String(item.couponId || item.offerId || `coupon-${Date.now()}`),
                    title: item.couponTitle || item.offerName || 'Desconto Exclusivo Hype Games',
                    description: item.couponDescription || item.description || 'Aproveite o desconto especial na parceira.',
                    store: 'Hype Games',
                    discount: item.discount || 'Desconto ativo',
                    code: item.couponCode || 'AUTOMATICO',
                    category: 'Jogos',
                    affiliateLink: item.clickUrl || item.url || 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                    expiresAt: item.expirationDate || '2026-12-31',
                    isActive: true,
                    updatedAt: new Date().toISOString()
                };

                await db.collection('coupons').doc(couponData.id).set(couponData, { merge: true });
                couponsCount++;
            } else {
                // Salva estritamente na coleção 'offers' (Promoções de Produtos)
                const offerData = {
                    id: String(item.offerId || `offer-${Date.now()}`),
                    title: item.offerName || 'Oferta Especial Hype Games',
                    description: item.description || 'Confira os melhores preços em jogos e gift cards.',
                    store: 'Hype Games',
                    category: 'Jogos',
                    discount: item.discount || 'Imperdível',
                    price: 0.00,
                    bannerUrl: 'https://images.tcdn.com.br/img/img_prod/1049965/cartao_presente_playstation_store_450_reais_digital_1519_1_72d5c363d3c80a8bf8e62118335359aa.jpg',
                    affiliateLink: item.clickUrl || item.url || 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                    expiresAt: item.expirationDate || '2026-12-31',
                    isActive: true,
                    updatedAt: new Date().toISOString()
                };

                await db.collection('offers').doc(offerData.id).set(offerData, { merge: true });
                offersCount++;
            }
        }

        // Garante pelo menos um cupom oficial limpo e uma oferta padrão da Hype Games se a lista vier vazia
        if (couponsCount === 0) {
            const defaultCoupon = {
                id: 'hype-games-official-coupon',
                title: 'Cupom Base 1.5% Cashback - Hype Games',
                description: 'Ative o desconto e garanta comissão e ofertas oficiais direto no site da Hype Games.',
                store: 'Hype Games',
                discount: '1.5% OFF',
                code: 'AUTOMATICO',
                category: 'Jogos',
                affiliateLink: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                expiresAt: '2026-12-31',
                isActive: true,
                updatedAt: new Date().toISOString()
            };
            await db.collection('coupons').doc(defaultCoupon.id).set(defaultCoupon, { merge: true });
            couponsCount++;
        }

        if (offersCount === 0) {
            const defaultOffer = {
                id: 'hype-games-official-offer',
                title: 'R$450 Gift Card PlayStation Store - Cartão Presente',
                description: 'O Gift Card PlayStation Store com R$450 em créditos é o presente perfeito.',
                store: 'Hype Games',
                category: 'Gift Cards',
                discount: '10% OFF',
                price: 450.00,
                oldPrice: 499.00,
                bannerUrl: 'https://images.tcdn.com.br/img/img_prod/1049965/cartao_presente_playstation_store_450_reais_digital_1519_1_72d5c363d3c80a8bf8e62118335359aa.jpg',
                affiliateLink: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games%2fbr%2f450-playstation-store-cartao-presente-digital',
                expiresAt: '2026-12-31',
                isActive: true,
                updatedAt: new Date().toISOString()
            };
            await db.collection('offers').doc(defaultOffer.id).set(defaultOffer, { merge: true });
            offersCount++;
        }

        const durationMs = Date.now() - startTime;
        console.log(`[Rakuten Sync] Sincronização concluída: ${couponsCount} cupons, ${offersCount} ofertas.`);

        return {
            success: true,
            couponsSynced: couponsCount,
            offersSynced: offersCount,
            durationMs
        };

    } catch (error: any) {
        console.error('[Rakuten Sync] Erro:', error.message);
        throw new Error(`Erro ao sincronizar com a Rakuten: ${error.message}`);
    }
}
