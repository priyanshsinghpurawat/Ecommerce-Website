# Frees port 3000 (or $env:PORT) if a Node process is blocking the Lux Spaces API.
param([int]$Port = 3000)

$lines = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
if (-not $lines) {
  Write-Host "Port $Port is free."
  exit 0
}

$pids = $lines | ForEach-Object {
  if ($_ -match '\s+(\d+)\s*$') { [int]$Matches[1] }
} | Select-Object -Unique

foreach ($procId in $pids) {
  $name = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
  Write-Host "Stopping PID $procId ($name) on port $Port..."
  taskkill /PID $procId /F 2>$null
}

Write-Host "Done. Run: npm run dev"
