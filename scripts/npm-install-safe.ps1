# npm-install-safe.ps1
# Wrapper para npm install que mantiene node_modules fuera de OneDrive (junction a C:\dev-modules\proy-juan)
# USO: .\scripts\npm-install-safe.ps1 [argumentos para npm install]
# Ejemplo: .\scripts\npm-install-safe.ps1 axios

param([Parameter(ValueFromRemainingArguments=$true)] [string[]]$NpmArgs)

$ProjectRoot   = "c:\Users\Usuario\OneDrive\Escritorio\ppp\Proy juan"
$DevParent     = "C:\dev-modules\nm"          # parent folder (outside OneDrive)
$DevModules    = "$DevParent\node_modules"     # the actual target (must be named node_modules)
$NodeModules   = "$ProjectRoot\node_modules"  # junction location inside project

Set-Location $ProjectRoot

# 1. Cerrar OneDrive para evitar bloqueo de archivos durante el move
Write-Host "▶ Cerrando OneDrive..." -ForegroundColor Cyan
Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 2. Si hay junction, removerla antes de que npm lo haga
$item = Get-Item $NodeModules -ErrorAction SilentlyContinue
if ($item -and $item.LinkType -eq "Junction") {
    Write-Host "▶ Removiendo junction..." -ForegroundColor Cyan
    Remove-Item $NodeModules -Force
}
elseif ($item) {
    Write-Host "▶ Removiendo node_modules existente..." -ForegroundColor Cyan
    Remove-Item $NodeModules -Recurse -Force
}

# 3. Correr npm install
Write-Host "▶ Corriendo: npm install $NpmArgs" -ForegroundColor Green
if ($NpmArgs) {
    & npm install @NpmArgs
} else {
    & npm install
}

# 4. Mover node_modules fuera de OneDrive (requiere OneDrive cerrado)
Write-Host "▶ Moviendo node_modules a $DevModules..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $DevParent -Force | Out-Null
if (Test-Path $DevModules) { Remove-Item $DevModules -Recurse -Force -ErrorAction SilentlyContinue }
cmd /c "move `"$NodeModules`" `"$DevModules`""
if ($LASTEXITCODE -ne 0) { Write-Host "⚠ Move falló (exit $LASTEXITCODE). Intentando robocopy..." -ForegroundColor Yellow; robocopy $NodeModules $DevModules /E /MOVE /XJ /NFL /NDL /NJH /NJS /NC /NS | Out-Null }

# 5. Crear junction
Write-Host "▶ Creando junction..." -ForegroundColor Cyan
if (Test-Path $NodeModules) { Remove-Item $NodeModules -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Junction -Path $NodeModules -Target $DevModules | Out-Null

$count = (Get-ChildItem $NodeModules -Directory | Measure-Object).Count
Write-Host "✅ Listo. $count paquetes en junction → $DevModules" -ForegroundColor Green
Write-Host "💡 Reiniciá OneDrive si lo necesitás: Start-Process '$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe'" -ForegroundColor DarkGray
