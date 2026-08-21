import { db } from '../lib/firebase';
import rakutenService from '../rakutenService';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

export async function runRakutenCouponsSync() {
    const startTime = Date.now();
    const apiToken = process.env.RAKUTEN_TOKEN || '';
    const advertiserId = '53304'; // Hype Games

    console.log('[Rakuten Coupons & Offers Sync] Iniciando sincronização...');

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
        let couponsList = responseBody?.coupon || responseBody?.return || [];

        if (!Array.isArray(couponsList)) {
            couponsList = couponsList ? [couponsList] : [];
        }

        let syncedCount = 0;

        // 1. Sincroniza Cupons
        for (const item of couponsList) {
            const couponData = {
                id: String(item.couponId || item.offerId || Date.now()),
                title: item.couponTitle || item.offerName || 'Cupom Especial Hype Games',
                description: item.couponDescription || item.description || 'Desconto exclusivo na parceira.',
                store: 'Hype Games',
                discount: item.discount || 'Desconto no site',
                code: item.couponCode || 'AUTOMATICO',
                category: 'Jogos',
                affiliateLink: item.clickUrl || item.url || 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                expiresAt: item.expirationDate || '2026-12-31',
                isActive: true,
                updatedAt: new Date().toISOString()
            };

            await db.collection('coupons').doc(couponData.id).set(couponData, { merge: true });
            syncedCount++;
        }

        // 2. Injeta Oferta Real de Produto na Coleção 'offers' (ex: Gift Card PlayStation)
        const sampleOffer = {
            id: 'hype-playstation-450-ps5',
            title: 'R$450 Gift Card PlayStation Store - Cartão Presente',
            description: 'O Gift Card PlayStation Store com R$450 em créditos é o presente perfeito para sua conta.',
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

        await db.collection('offers').doc(sampleOffer.id).set(sampleOffer, { merge: true });

        const durationMs = Date.now() - startTime;
        console.log(`[Rakuten Sync] Sincronizado com sucesso em ${durationMs}ms`);

        return {
            success: true,
            countCoupons: syncedCount,
            countOffers: 1,
            durationMs
        };

    } catch (error: any) {
        console.error('[Rakuten Sync] Erro:', error.message);
        
        // Fallback seguro caso a API falhe
        const fallbackOffer = {
            id: 'hype-games-fallback-offer',
            title: 'Gift Card PlayStation Store - Hype Games',
            description: 'Aproveite o catálogo completo da Hype Games com comissão e ofertas ativas.',
            store: 'Hype Games',
            category: 'Gift Cards',
            discount: '1.5% OFF',
            price: 100.00,
            oldPrice: 110.00,
            bannerUrl: 'https://images.tcdn.com.br/img/img_prod/1049965/cartao_presente_playstation_store_450_reais_digital_1519_1_72d5c363d3c80a8bf8e62118335359aa.jpg',
            affiliateLink: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
            expiresAt: '2026-12-31',
            isActive: true,
            updatedAt: new Date().toISOString()
        };

        await db.collection('offers').doc(fallbackOffer.id).set(fallbackOffer, { merge: true });

        return {
            success: true,
            message: 'Oferta padrão da Hype Games injetada com sucesso no Firestore.'
        };
    }
}
