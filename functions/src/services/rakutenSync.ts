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

    console.log('[Rakuten Sync] Resposta bruta convertida:', JSON.stringify(parsedJson));

    // 3. Prepara os dados de forma segura (salva o JSON convertido caso a estrutura varie)
    const partnerData = {
        advertiserId: String(advertiserId),
        name: 'Hype Games',
        rawResponse: parsedJson, // Salva o objeto completo para inspecionar se necessário
        updatedAt: new Date().toISOString()
    };

    // 4. Salva no Firestore na coleção 'affiliates_rakuten'
    const docRef = db.collection('affiliates_rakuten').doc(partnerData.advertiserId);
    await docRef.set(partnerData, { merge: true });

    const durationMs = Date.now() - startTime;
    console.log(`[Rakuten Sync] Sincronizado e salvo com sucesso em ${durationMs}ms`);

    return {
        success: true,
        durationMs,
        data: partnerData
    };
}
