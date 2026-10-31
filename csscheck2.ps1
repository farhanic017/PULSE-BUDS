$h = Get-Content index.html -Raw
$css = [regex]::Match($h, '(?s)<style>(.*)</style>').Groups[1].Value
# Strip comments, then check for leftover comment markers and backticks/${} (JS template leftovers).
$noComments = [regex]::Replace($css, '(?s)/\*.*?\*/', '')
echo "unclosed-comment-test: $(if ($noComments.Contains('/*') -or $noComments.Contains('*/')) { 'SUSPICIOUS MARKERS REMAIN' } else { 'clean' })"
$opens = ([regex]::Matches($noComments, '/\*')).Count
$closes = ([regex]::Matches($noComments, '\*/')).Count
echo "comment opens=$opens closes=$closes"
echo "backticks=$([regex]::Matches($css, '`').Count)"
echo "dollar-brace=$([regex]::Matches($css, '\$\{').Count)"
# semicolons sanity: declarations missing semicolons before } are legal; skip.
# check for double semicolons or empty rules (harmless) and for '@media (' count
echo "media-blocks=$([regex]::Matches($css, '@media').Count)"
