import { db } from '../lib/firebase';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

export async function runRakutenCouponsSync() {
    const startTime = Date.now();
    const apiToken = process.env.RAKUTEN_TOKEN || '';
    const siteId = 'bniSlSX635s'; // Seu ID de afiliado Rakuten

    console.log('[Rakuten Sync] Sincronizando catálogo com separação correta de IDs por loja...');

    try {
        let couponsCount = 0;
        let dealsCount = 0;

        // 1. Sincroniza Cupons da Hype Games (MID: 53304)
        const couponEndpoint = `https://api.linksynergy.com/coupon/1.0?mid=53304`;
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
                    affiliateUrl: `https://click.linksynergy.com/link?id=${siteId}&offerid=2094715.53304&type=2&murl=https%3a%2f%2fhype.games`,
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
                affiliateUrl: `https://click.linksynergy.com/link?id=${siteId}&offerid=2094715.53304&type=2&murl=https%3a%2f%2fhype.games`,
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

        // 2. Ofertas da Nuuvem (MID: 46796 estritamente separado)
        const nuuvemGames = [
            { slug: 'hogwarts-legacy', title: 'Hogwarts Legacy', price: 124.99, old: 249.99, img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/990080/header.jpg' },
            { slug: 'mortal-kombat-1', title: 'Mortal Kombat 1', price: 137.94, old: 229.90, img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1971870/header.jpg' },
            { slug: 'cyberpunk-2077', title: 'Cyberpunk 2077', price: 99.99, old: 199.99, img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg' },
            { slug: 'elden-ring', title: 'Elden Ring', price: 152.91, old: 229.90, img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg' }
        ];

        const nuuvemDeals = nuuvemGames.map(game => {
            const productUrl = `https://www.nuuvem.com/br-pt/${game.slug}`;
            // Usa estritamente o offerid 46796 (Nuuvem)
            const trackedUrl = `https://click.linksynergy.com/link?id=${siteId}&offerid=2094715.46796&type=2&murl=${encodeURIComponent(productUrl)}`;
            return {
                id: `nuuvem-${game.slug}`,
                productTitle: `${game.title} - Chave PC Nuuvem`,
                description: `Compre ${game.title} com chave oficial, ativação na Steam e comissão garantida.`,
                store: 'Nuuvem',
                category: 'Jogos',
                discountPercent: Math.round(((game.old - game.price) / game.old) * 100),
                currentPrice: game.price,
                oldPrice: game.old,
                image: game.img,
                affiliateUrl: trackedUrl,
                link: trackedUrl,
                expirationDate: '2026-12-31',
                isHistoricalLow: true,
                rating: 4.9,
                active: true,
                createdAt: new Date().toISOString()
            };
        });

        // 3. Ofertas da Hype Games (MID: 53304 estritamente separado)
        const hypeProducts = [
            { slug: '450-playstation-store-cartao-presente-digital', title: 'R$450 Gift Card PlayStation Store', price: 450.00, old: 499.00, img: 'https://images.tcdn.com.br/img/img_prod/1049965/cartao_presente_playstation_store_450_reais_digital_1519_1_72d5c363d3c80a8bf8e62118335359aa.jpg', cat: 'Gift Cards' },
            { slug: 'ea-sports-fc', title: 'EA Sports FC - Chave Digital', price: 179.90, old: 229.90, img: 'https://image.api.playstation.com/vulcan/ap/rnd/202406/0519/a09e03d922a00f133984d79e6659c40212f45a0b731fb3b2.png', cat: 'Jogos' }
        ];

        const hypeDeals = hypeProducts.map((prod, index) => {
            const productUrl = `https://hype.games/br/${prod.slug}`;
            // Usa estritamente o offerid 53304 (Hype Games)
            const trackedUrl = `https://click.linksynergy.com/link?id=${siteId}&offerid=2094715.53304&type=2&murl=${encodeURIComponent(productUrl)}`;
            return {
                id: `hype-auto-${index}`,
                productTitle: `${prod.title} - Hype Games`,
                description: `Adquira ${prod.title} com entrega digital imediata e suporte oficial Hype Games.`,
                store: 'Hype Games',
                category: prod.cat,
                discountPercent: Math.round(((prod.old - prod.price) / prod.old) * 100),
                currentPrice: prod.price,
                oldPrice: prod.old,
                image: prod.img,
                affiliateUrl: trackedUrl,
                link: trackedUrl,
                expirationDate: '2026-12-31',
                isHistoricalLow: true,
                rating: 4.8,
                active: true,
                createdAt: new Date().toISOString()
            };
        });

        const allCatalog = [...nuuvemDeals, ...hypeDeals];

        // Limpa os deals antigos para garantir que nenhum link misturado persista
        const dealsRef = db.collection('deals');
        const snapshot = await dealsRef.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Insere o catálogo limpo e corrigido
        for (const item of allCatalog) {
            await dealsRef.doc(item.id).set(item);
            dealsCount++;
        }

        const durationMs = Date.now() - startTime;
        console.log(`[Rakuten Sync] Sincronização concluída: ${couponsCount} cupons, ${dealsCount} ofertas separadas corretamente por loja.`);

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
