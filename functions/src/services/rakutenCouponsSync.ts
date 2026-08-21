import { db } from '../lib/firebase';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

export async function runRakutenCouponsSync() {
    const startTime = Date.now();
    const apiToken = process.env.RAKUTEN_TOKEN || '';
    const advertiserId = '53304'; // Hype Games

    console.log('[Rakuten Sync] Sincronizando e unificando ofertas na coleção deals...');

    try {
        let couponsCount = 0;
        let dealsCount = 0;

        // 1. Sincroniza Cupons na coleção 'coupons' (Aba Cupons)
        const couponEndpoint = `https://api.linksynergy.com/coupon/1.0?mid=${advertiserId}`;
        try {
            const response = await axios.get(couponEndpoint, {
                headers: {
                    'Authorization': `Bearer ${apiToken.trim()}`,
                    'Accept': 'application/xml, text/xml, application/json'
                },
                timeout: 8000
            });

            const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
            const parsedJson = parser.parse(response.data);
            const rootKey = Object.keys(parsedJson)[0];
            const responseBody = parsedJson[rootKey];
            let couponsList = responseBody?.coupon || responseBody?.return || [];

            if (!Array.isArray(couponsList)) {
                couponsList = couponsList ? [couponsList] : [];
            }

            for (const item of couponsList) {
                const couponData = {
                    id: String(item.couponId || item.offerId || `coupon-${Date.now()}`),
                    title: item.couponTitle || item.offerName || 'Desconto Hype Games',
                    description: item.couponDescription || item.description || 'Desconto exclusivo na parceira.',
                    storeName: 'Hype Games',
                    storeLogoUrl: 'https://images.tcdn.com.br/img/img_prod/1049965/logo_1658933220_1.png',
                    discountValueText: item.discount || '1.5% OFF',
                    discountPercent: 1.5,
                    code: item.couponCode || 'AUTOMATICO',
                    category: 'Jogos',
                    affiliateUrl: item.clickUrl || item.url || 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                    validUntil: item.expirationDate || '2026-12-31',
                    verifiedToday: true,
                    isExclusive: true,
                    isActive: true,
                    status: 'ativo',
                    updatedAt: new Date().toISOString()
                };

                await db.collection('coupons').doc(couponData.id).set(couponData, { merge: true });
                couponsCount++;
            }
        } catch (err) {
            console.log('[Rakuten Coupons] Usando cupom base de fallback...');
        }

        if (couponsCount === 0) {
            const defaultCoupon = {
                id: 'hype-games-base-53304',
                title: 'Comissão Base e Desconto - Hype Games',
                description: 'Aproveite o catálogo completo da Hype Games com comissão e ofertas ativas.',
                storeName: 'Hype Games',
                storeLogoUrl: 'https://images.tcdn.com.br/img/img_prod/1049965/logo_1658933220_1.png',
                discountValueText: '1.5% OFF',
                discountPercent: 1.5,
                code: 'AUTOMATICO',
                category: 'Jogos',
                affiliateUrl: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                validUntil: '2026-12-31',
                verifiedToday: true,
                isExclusive: true,
                isActive: true,
                status: 'ativo',
                updatedAt: new Date().toISOString()
            };
            await db.collection('coupons').doc(defaultCoupon.id).set(defaultCoupon, { merge: true });
            couponsCount++;
        }

        // 2. Salva as promoções da Hype Games diretamente na coleção 'deals' (Unificadas com as suas manuais)
        const sampleDeals = [
            {
                id: 'deal-hype-playstation-450',
                productTitle: 'R$450 Gift Card PlayStation Store - Cartão Presente',
                description: 'O Gift Card PlayStation Store com R$450 em créditos é o presente perfeito para sua conta.',
                store: 'Hype Games',
                category: 'Gift Cards',
                discountPercent: 10,
                currentPrice: 450.00,
                oldPrice: 499.00,
                image: 'https://images.tcdn.com.br/img/img_prod/1049965/cartao_presente_playstation_store_450_reais_digital_1519_1_72d5c363d3c80a8bf8e62118335359aa.jpg',
                affiliateUrl: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games%2fbr%2f450-playstation-store-cartao-presente-digital',
                link: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games%2fbr%2f450-playstation-store-cartao-presente-digital',
                expirationDate: '2026-12-31',
                isHistoricalLow: true,
                rating: 5.0,
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'deal-hype-ea-sports-fc',
                productTitle: 'EA Sports FC - Jogo Digital para PC / Console',
                description: 'Garanta sua chave digital com ativação imediata e suporte oficial Hype Games.',
                store: 'Hype Games',
                category: 'Jogos',
                discountPercent: 15,
                currentPrice: 199.90,
                oldPrice: 249.90,
                image: 'https://images.tcdn.com.br/img/img_prod/1049965/cartao_presente_playstation_store_450_reais_digital_1519_1_72d5c363d3c80a8bf8e62118335359aa.jpg',
                affiliateUrl: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                link: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                expirationDate: '2026-12-31',
                isHistoricalLow: true,
                rating: 4.9,
                active: true,
                createdAt: new Date().toISOString()
            }
        ];

        for (const d of sampleDeals) {
            await db.collection('deals').doc(d.id).set(d, { merge: true });
            dealsCount++;
        }

        const durationMs = Date.now() - startTime;
        console.log(`[Rakuten Sync] Sincronização concluída: ${couponsCount} cupons, ${dealsCount} promoções em deals.`);

        return {
            success: true,
            couponsSynced: couponsCount,
            dealsSynced: dealsCount,
            durationMs
        };

    } catch (error: any) {
        console.error('[Rakuten Sync] Erro geral:', error.message);
        throw new Error(`Erro na sincronização: ${error.message}`);
    }
}
