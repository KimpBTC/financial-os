---
description: how to configure the Telegram bot for alerts
---

# Configurar Bot de Telegram

## Crear el Bot

1. Abre Telegram y busca **@BotFather**

2. Envía `/newbot`

3. Elige un nombre para tu bot (ej: "Financial OS Bot")

4. Elige un username (ej: "financial_os_bot")

5. BotFather te dará un **token** (ejemplo: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Obtener tu Chat ID

6. Envía cualquier mensaje a tu nuevo bot en Telegram

7. Abre en el navegador:
```
https://api.telegram.org/bot<TU_TOKEN>/getUpdates
```

8. Busca `"chat":{"id":123456789}` — ese número es tu Chat ID

## Conectar en Financial OS

9. Ve a la tab **🤖 Telegram** en Financial OS

10. Pega el **Token** y el **Chat ID**

11. Haz clic en **"Conectar Bot"**

12. Haz clic en **"Enviar Test"** — deberías recibir un mensaje en Telegram

## Alertas Configurables
- 🌡️ **Mercado**: cuando el score sube de 15 (oportunidad)
- 💵 **Dólar**: cuando está < $860 (barato) o > $980 (caro)
- 📊 **Acciones**: cuando el score de una acción sube de 60
- 📋 **Resumen diario**: a las 18:00 todos los días hábiles
