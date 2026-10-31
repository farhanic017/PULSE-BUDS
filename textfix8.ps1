# Removes both shoulder bands entirely (no replacement text).
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.png'))
$g = [System.Drawing.Graphics]::FromImage($src)
$rand = New-Object System.Random
function ClearGrain($x0, $y0, $x1, $y1, $sx) {
    for ($y = $y0; $y -le $y1; $y++) {
        $c = $src.GetPixel($sx, $y)
        $br = New-Object System.Drawing.SolidBrush($c)
        $g.FillRectangle($br, $x0, $y, ($x1 - $x0 + 1), 1)
        $br.Dispose()
    }
    for ($yy = $y0; $yy -le $y1; $yy++) {
        for ($xx = $x0; $xx -le $x1; $xx++) {
            $c = $src.GetPixel($xx, $yy)
            $n = $rand.Next(-5, 6)
            $rr = $c.R + $n; if ($rr -lt 0) { $rr = 0 }; if ($rr -gt 255) { $rr = 255 }
            $gg = $c.G + $n; if ($gg -lt 0) { $gg = 0 }; if ($gg -gt 255) { $gg = 255 }
            $bb = $c.B + $n; if ($bb -lt 0) { $bb = 0 }; if ($bb -gt 255) { $bb = 255 }
            $src.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb($rr, $gg, $bb))
        }
    }
}
ClearGrain 40 330 220 1320 25
ClearGrain 40 1130 220 1910 25
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $src.Dispose()
Move-Item 'can-green-src-tmp.png' 'can-green-src.png' -Force
echo 'bands removed'
