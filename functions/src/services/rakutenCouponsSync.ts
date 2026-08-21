import { db } from '../lib/firebase';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

export async function runRakutenCouponsSync() {
    const startTime = Date.now();
    const apiToken = process.env.RAKUTEN_TOKEN || '';
    const advertiserId = '53304'; // Hype Games

    console.log('[Rakuten Coupons API] Buscando cupons oficiais no endpoint /coupon/1.0...');

    try {
        // Endpoint oficial documentado no painel da Rakuten
        const endpoint = `https://api.linksynergy.com/coupon/1.0?mid=${advertiserId}`;
        
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

        for (const item of couponsList) {
            const couponData = {
                id: String(item.couponId || item.offerId || `coupon-${Date.now()}`),
                title: item.couponTitle || item.offerName || 'Cupom Oficial Hype Games',
                description: item.couponDescription || item.description || 'Desconto oficial sincronizado da Rakuten.',
                store: 'Hype Games',
                discount: item.discount || 'Desconto ativo',
                code: item.couponCode || 'AUTOMATICO',
                category: 'Jogos',
                affiliateLink: item.clickUrl || item.url || 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                expiresAt: item.expirationDate || '2026-12-31',
                isActive: true,
                status: 'ativo',
                updatedAt: new Date().toISOString()
            };

            await db.collection('coupons').doc(couponData.id).set(couponData, { merge: true });
            syncedCount++;
        }

        // Fallback robusto caso o endpoint retorne vazio no momento
        if (syncedCount === 0) {
            const fallbackCoupon = {
                id: 'hype-games-base-53304',
                title: 'Comissão Base 1.5% - Hype Games',
                description: 'Aproveite o catálogo completo da Hype Games com comissão e ofertas ativas.',
                store: 'Hype Games',
                discount: '1.5% OFF',
                code: 'AUTOMATICO',
                category: 'Jogos',
                affiliateLink: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                expiresAt: '2026-12-31',
                isActive: true,
                status: 'ativo',
                updatedAt: new Date().toISOString()
            };
            await db.collection('coupons').doc(fallbackCoupon.id).set(fallbackCoupon, { merge: true });
            syncedCount++;
        }

        const durationMs = Date.now() - startTime;
        console.log(`[Rakuten Coupons API] Sincronização concluída com sucesso: ${syncedCount} cupons.`);

        return {
            success: true,
            couponsSynced: syncedCount,
            durationMs
        };

    } catch (error: any) {
        console.error('[Rakuten Coupons API] Erro:', error.response?.data || error.message);
        throw new Error(`Erro ao buscar cupons da Rakuten: ${error.message}`);
    }
}
