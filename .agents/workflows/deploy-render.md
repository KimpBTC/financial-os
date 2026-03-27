---
description: how to deploy the backend to Render.com for 24/7 operation
---

# Deploy Backend a Render.com

## Prerequisitos
- El código ya está en GitHub: https://github.com/KimpBTC/financial-os

## Pasos

// turbo-all

1. Ve a https://render.com y crea una cuenta (o inicia sesión con GitHub)

2. En el Dashboard, haz clic en **"New +"** → **"Web Service"**

3. Conecta tu repositorio GitHub: **KimpBTC/financial-os**

4. Configura el servicio con estos valores:
   - **Name**: `financial-os-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Haz clic en **"Create Web Service"** y espera al deploy (~5 min)

6. Una vez desplegado, copia la URL del servicio (algo como `https://financial-os-api.onrender.com`)

7. Actualiza el frontend con la URL del backend:
```bash
echo "VITE_API_URL=https://financial-os-api.onrender.com/api" > client/.env.production
```

8. Redespliega el frontend:
```bash
cd client && npm run build && cd .. && npx firebase-tools deploy --only hosting --project monasterioberardi-financiero
```

## Notas
- El plan gratuito de Render pone el servidor en "sleep" después de 15 min sin tráfico. La primera visita después de dormir tarda ~30 seg.
- Los cron jobs se ejecutan solo cuando el servidor está activo
- Para un servidor siempre activo, considera el plan Individual ($7/mes)
