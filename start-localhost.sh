#!/bin/bash

# Script para iniciar o projeto em localhost
echo "🚀 Iniciando Sistema de Rifas em Localhost..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Instale o Node.js primeiro."
    exit 1
fi

# Criar arquivos necessários se não existirem
echo "📁 Criando arquivos necessários..."
touch pagamentos.db
echo "[]" > pagamentos.db

# Dar permissões
echo "🔧 Configurando permissões..."
chmod 666 pagamentos.db

# Instalar dependências Node.js
echo "📦 Instalando dependências..."
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi

echo "🎯 Projeto configurado! Agora execute o comando abaixo:"
echo ""
echo "cd \"$(pwd)\""
echo "npm run dev"
echo ""
echo "🌐 Depois acesse: http://localhost:3000"
echo ""
echo "✅ Sistema pronto para uso!"