import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicialização segura do SDK Admin para o Cloud Functions
if (!getApps().length) {
  initializeApp({
    projectId: 'alerta-game'
  });
}

export const db = getFirestore('(default)');
