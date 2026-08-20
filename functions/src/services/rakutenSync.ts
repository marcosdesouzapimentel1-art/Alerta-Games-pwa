import { db } from '../lib/firebase';
import rakutenService from '../rakutenService';
import { XMLParser } from 'fast-xml-parser';

export async function runRakutenSync() {
    const startTime = Date.now();
    const advertiserId = '53304'; // Hype Games
    const apiToken = process.env.RAKUTEN_TOKEN || '';

    console.log('[Rakuten Sync] Iniciando sincronização de dados...');

    // 1. Busca os dados da API da Rakuten
    const rawXmlData = await rakutenService.getTextLinks(advertiserId, apiToken);

    // 2. Converte o XML recebido para JSON legível
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });
    const parsedJson = parser.parse(rawXmlData);

    // Navega na estrutura do XML da resposta do getMerchByID
    const merchReturn = parsedJson?.getMerchByIDResponse?.return;

    if (!merchReturn) {
        throw new Error('Estrutura de resposta inválida da Rakuten.');
    }

    // 3. Prepara os dados para salvar no Firestore
    const partnerData = {
        advertiserId: String(merchReturn.mid || advertiserId),
        name: merchReturn.name || 'Hype Games',
        applicationStatus: merchReturn.applicationStatus || 'Desconhecido',
        categories: merchReturn.categories || '',
        offers: Array.isArray(merchReturn.offer) ? merchReturn.offer : [merchReturn.offer].filter(Boolean),
        updatedAt: new Date().toISOString()
    };

    // 4. Salva/Atualiza no Firestore na coleção 'affiliates_rakuten'
    const docRef = db.collection('affiliates_rakuten').doc(partnerData.advertiserId);
    await docRef.set(partnerData, { merge: true });

    const durationMs = Date.now() - startTime;
    console.log(`[Rakuten Sync] Sincronizado com sucesso em ${durationMs}ms`);

    return {
        success: true,
        durationMs,
        data: partnerData
    };
}
