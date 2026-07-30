# Guia de Deploy das Cloud Functions v2 - Alerta Game

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Compilar TypeScript:
   ```bash
   npm run build
   ```

3. Definir Secret da Gemini API Key:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```

4. Fazer Deploy no Firebase Blaze:
   ```bash
   firebase deploy --only functions
   ```
