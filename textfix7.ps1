# Small-zone full rebuild: clear everything (350ml + old lines), redraw all three fresh.
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.png'))
$g = [System.Drawing.Graphics]::FromImage($src)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$rand = New-Object System.Random
for ($y = 570; $y -le 890; $y++) {
    $c = $src.GetPixel(60, $y)
    $br = New-Object System.Drawing.SolidBrush($c)
    $g.FillRectangle($br, 1040, $y, 161, 1)
    $br.Dispose()
}
for ($yy = 570; $yy -le 890; $yy++) {
    for ($xx = 1040; $xx -le 1200; $xx++) {
        $c = $src.GetPixel($xx, $yy)
        $n = $rand.Next(-5, 6)
        $rr = $c.R + $n; if ($rr -lt 0) { $rr = 0 }; if ($rr -gt 255) { $rr = 255 }
        $gg = $c.G + $n; if ($gg -lt 0) { $gg = 0 }; if ($gg -gt 255) { $gg = 255 }
        $bb = $c.B + $n; if ($bb -lt 0) { $bb = 0 }; if ($bb -gt 255) { $bb = 255 }
        $src.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb($rr, $gg, $bb))
    }
}
function VText($text, $cx, $cy, $size, $color) {
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform(-90)
    $f = New-Object System.Drawing.Font('Arial Narrow', $size, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $br = New-Object System.Drawing.SolidBrush($color)
    $g.DrawString($text, $f, $br, 0, 0, $sf)
    $g.ResetTransform()
    $f.Dispose(); $br.Dispose(); $sf.Dispose()
}
$white = [System.Drawing.Color]::White
VText '350ml' 1080 690 44 $white
VText 'GUARANA SODA' 1145 730 28 $white
VText 'CONTAINS FLAVORING' 1172 730 28 $white
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $src.Dispose()
Move-Item 'can-green-src-tmp.png' 'can-green-src.png' -Force
echo 'small rebuilt'
