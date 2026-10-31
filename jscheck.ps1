# Extract the last <script> block from index.html and syntax-check it with node.
$h = Get-Content (Join-Path $PSScriptRoot 'index.html') -Raw
$m = [regex]::Matches($h, '<script>([\s\S]*?)</script>')
$last = $m[$m.Count - 1].Groups[1].Value
$tmp = Join-Path $env:TEMP 'lastscript_check.js'
Set-Content -Path $tmp -Value $last -NoNewline
node --check $tmp
if ($LASTEXITCODE -eq 0) { Write-Output 'JS-OK' } else { Write-Output 'JS-FAIL' }
