# Guia de Deploy das Firebase Cloud Functions v2 (Plano Blaze) - Alerta Game

Este documento contém todas as instruções necessárias para realizar a compilação, configuração de secrets e deploy das Cloud Functions v2 do projeto **Alerta Game**.

---

## 📋 Pré-requisitos
1. Projeto configurado no **Firebase Console** com upgrade para o **Plano Blaze (Pay as you go)**.
2. **Firebase CLI** instalado globalmente ou acessível via `npx`:
   ```bash
   npm install -g firebase-tools
   ```
3. Autenticação no Firebase:
   ```bash
   firebase login
   ```

---

## 🛠️ Passo a Passo de Deploy

### 1. Acessar o diretório de funções e instalar dependências
```bash
cd functions
npm install
```

### 2. Compilar o TypeScript para JavaScript
```bash
npm run build
```

### 3. Configurar Secret da API Key do Google Gemini
As Cloud Functions v2 utilizam o Secret Manager do Google Cloud Platform para armazenar a chave da API com total segurança:
```bash
firebase functions:secrets:set GEMINI_API_KEY
```
*(Quando solicitado no terminal, insira a sua chave da Gemini API)*

---

## 🚀 4. Executar Deploy das Funções
A partir da raiz do projeto ou da pasta `functions`:
```bash
firebase deploy --only functions
```

---

## ⚙️ Funções Exportadas em `index.ts`

1. **`scheduledNewsSync`**:
   - **Tipo**: Cloud Scheduler (v2)
   - **Frequência**: A cada 10 minutos (`every 10 minutes`)
   - **Região/Timezone**: `America/Sao_Paulo`
   - **Comportamento**: Executa sincronização automática, chama Gemini AI, salva em `news`, cria notificações na coleção `notifications` se `shouldNotify === true` e registra logs detalhados em `news_sync_logs`.

2. **`syncNewsManual`**:
   - **Tipo**: HTTP Request (v2)
   - **Permissões**: Habilitada com CORS (`cors: true`)
   - **Uso**: Acionada diretamente pelo Painel Administrativo React ao clicar no botão *"Sincronizar Notícias Agora"*.

---

## 📦 Coleções Utilizadas no Firestore
- `news`: Armazena notícias com campos originais e processados pelo Gemini AI (`titlePt`, `summaryPt`, `category`, `keywords`, `importance`, `shouldNotify`, `seoTitle`, `seoDescription`, etc.).
- `notifications`: Armazena notificações push geradas automaticamente para eventos de alta relevância (`shouldNotify == true`).
- `news_sync_logs`: Armazena histórico estatístico de execuções com tempo de execução, tokens do Gemini, erros e contadores.
