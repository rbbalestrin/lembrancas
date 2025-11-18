#!/bin/bash
# Script para exibir o QR code do Expo

echo "========================================"
echo "   LEMBRANCAS - QR CODE EXPO"
echo "========================================"
echo ""

# Verifica se o container esta rodando
if ! docker ps --filter "name=lembrancas-frontend" --format "{{.Status}}" | grep -q "Up"; then
    echo "Container nao esta rodando!"
    echo "Execute: docker compose up -d"
    exit 1
fi

# Aguarda alguns segundos para o Expo inicializar
sleep 2

# Mostra os logs com o QR code
docker logs lembrancas-frontend --tail 40
