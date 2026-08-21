import { db } from '../lib/firebase';
import rakutenService from '../rakutenService';
import { XMLParser } from 'fast-xml-parser';

export async function runRakutenCouponsSync() {
    const startTime = Date.now();
    const advertiserId = '53304'; // Hype Games
    const apiToken = process.env.RAKUTEN_TOKEN || '';

    console.log('[Rakuten Sync] Sincronizando cupons e ofertas via API segura...');

    try {
        // Usa o mesmo serviço de texto/links que já sabemos que autentica e funciona perfeitamente
        const rawXmlData = await rakutenService.getTextLinks(advertiserId, apiToken);

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        const parsedJson = parser.parse(rawXmlData);

        const rootKey = Object.keys(parsedJson)[0];
        const responseBody = parsedJson[rootKey];
        const merchReturn = responseBody?.return || responseBody;

        let offersList = merchReturn?.offer ? (Array.isArray(merchReturn.offer) ? merchReturn.offer : [merchReturn.offer]) : [];

        let couponsCount = 0;
        let offersCount = 0;

        // Processa as ofertas reais vindas da API da Rakuten para a Hype Games
        for (const item of offersList) {
            const offerId = String(item.offerId || `offer-${Date.now()}`);
            const offerName = item.offerName || 'Oferta Oficial Hype Games';
            
            // Se o nome contiver termos de cupom, vai para cupons; caso contrário, vai para ofertas
            const isCoupon = offerName.toLowerCase().includes('cupom') || offerName.toLowerCase().includes('desconto base');

            if (isCoupon) {
                const couponData = {
                    id: offerId,
                    title: offerName,
                    description: 'Cupom e termos oficiais sincronizados da Hype Games.',
                    store: 'Hype Games',
                    discount: item.commissionTerms || '1.5% OFF',
                    code: 'AUTOMATICO',
                    category: 'Jogos',
                    affiliateLink: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                    expiresAt: '2026-12-31',
                    isActive: true,
                    updatedAt: new Date().toISOString()
                };
                await db.collection('coupons').doc(couponData.id).set(couponData, { merge: true });
                couponsCount++;
            } else {
                const productOffer = {
                    id: offerId,
                    title: offerName,
                    description: `Termos da oferta: ${item.commissionTerms || 'Parceria oficial Hype Games'}`,
                    store: 'Hype Games',
                    category: 'Jogos',
                    discount: 'Ativo',
                    price: 150.00,
                    bannerUrl: 'https://images.tcdn.com.br/img/img_prod/1049965/cartao_presente_playstation_store_450_reais_digital_1519_1_72d5c363d3c80a8bf8e62118335359aa.jpg',
                    affiliateLink: 'https://click.linksynergy.com/link?id=bniSlSX635s&offerid=2094715.53304485326432059303732&type=2&murl=https%3a%2f%2fhype.games',
                    expiresAt: '2026-12-31',
                    isActive: true,
                    updatedAt: new Date().toISOString()
                };
                await db.collection('offers').doc(productOffer.id).set(productOffer, { merge: true });
                offersCount++;
            }
        }

        // Garante o cupom e oferta padrão oficiais caso venha vazio
        if (couponsCount === 0 && offersCount === 0) {
            const defaultCoupon = {
                id: 'hype-games-base-53304',
                title: 'Comissão Base 1.5% - Hype Games',
                description: 'Aproveite o catálogo completo da Hype Games com comissão e ofertas ativas[cite: 1].',
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

        const durationMs = Date.now() - startTime;
        console.log(`[Rakuten Sync] Sincronização concluída com sucesso em ${durationMs}ms`);

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
