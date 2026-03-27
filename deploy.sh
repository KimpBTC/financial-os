#!/bin/bash
# ═══════════════════════════════════════════════════
# Financial OS v3.0 — Deploy Script
# Despliega frontend a Firebase y backend a Render
# ═══════════════════════════════════════════════════

set -e

echo "🚀 Financial OS — Deploy"
echo "═══════════════════════════"

# 1. Build frontend
echo ""
echo "📦 Building frontend..."
cd client
npm run build
cd ..

# 2. Deploy frontend to Firebase
echo ""
echo "☁️  Deploying frontend to Firebase..."
npx firebase-tools deploy --only hosting --project monasterioberardi-financiero

echo ""
echo "═══════════════════════════════════════════"
echo "✅ Frontend deployed!"
echo "   🌐 https://monasterioberardi-financiero.web.app"
echo ""
echo "📌 Para el backend (Render.com):"
echo "   1. Crea una cuenta en https://render.com"
echo "   2. New → Web Service → Connect a Git repo"
echo "   3. Root Directory: server"
echo "   4. Build Command: npm install && npm run build"
echo "   5. Start Command: npm start"
echo "   6. Plan: Free"
echo ""
echo "   Luego actualiza VITE_API_URL en client/.env"
echo "   con la URL de Render y redespliega."
echo "═══════════════════════════════════════════"
