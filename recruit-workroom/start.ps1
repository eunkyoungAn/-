$ErrorActionPreference = 'Stop'
$pythonRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path -LiteralPath $pythonRuntime)) {
  $pythonRuntime = (Get-Command python -ErrorAction Stop).Source
}
$taskRoot = $PSScriptRoot
try {
  $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8765/api/config' -TimeoutSec 2 -UseBasicParsing
  if ($response.StatusCode -eq 200) { Start-Process 'http://127.0.0.1:8765'; exit }
} catch {}
Start-Process -FilePath $pythonRuntime -ArgumentList @('"' + (Join-Path $taskRoot 'server.py') + '"') -WorkingDirectory $taskRoot -WindowStyle Hidden
for ($attempt = 0; $attempt -lt 20; $attempt++) {
  Start-Sleep -Milliseconds 300
  try {
    $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8765/api/config' -TimeoutSec 2 -UseBasicParsing
    if ($response.StatusCode -eq 200) { Start-Process 'http://127.0.0.1:8765'; exit }
  } catch {}
}
Write-Error '실행되지 않았습니다. Python 경로 또는 8765 포트 사용 여부를 확인해주세요.'
