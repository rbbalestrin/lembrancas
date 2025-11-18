#!/usr/bin/env pwsh
# Script para exibir o QR code do Expo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LEMBRANCAS - QR CODE EXPO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se o container esta rodando
$containerStatus = docker ps --filter "name=lembrancas-frontend" --format "{{.Status}}"

if (-not $containerStatus) {
    Write-Host "Container nao esta rodando!" -ForegroundColor Red
    Write-Host "Execute: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

# Aguarda alguns segundos para o Expo inicializar
Start-Sleep -Seconds 2

# Mostra os logs com o QR code
docker logs lembrancas-frontend --tail 40
