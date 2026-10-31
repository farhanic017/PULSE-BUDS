$h = Get-Content index.html -Raw
$css = [regex]::Match($h, '(?s)<style>(.*)</style>').Groups[1].Value
$line = 1
$stack = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $css.Length; $i++) {
    $c = $css[$i]
    if ($c -eq "`n") { $line++ }
    if ($c -eq '{') {
        $s = [Math]::Max(0, $i - 70)
        $sel = $css.Substring($s, $i - $s).Trim() -replace "`n", ' ' -replace '\s+', ' '
        $stack.Add("$line :: $sel")
    }
    if ($c -eq '}') {
        if ($stack.Count -eq 0) { echo "EXTRA-CLOSE at line $line" }
        else { $stack.RemoveAt($stack.Count - 1) }
    }
}
echo "unclosed=$($stack.Count)"
foreach ($s in $stack) { echo "OPEN: $s" }
