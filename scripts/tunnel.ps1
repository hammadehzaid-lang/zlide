$cloudflared = Join-Path $HOME 'Downloads\cloudflared-windows-amd64.exe'

if (-not (Test-Path $cloudflared)) {
  Write-Error "cloudflared was not found at $cloudflared"
  exit 1
}

Write-Host 'Starting Cloudflare quick tunnel for http://127.0.0.1:5173'
& $cloudflared tunnel --url http://127.0.0.1:5173
