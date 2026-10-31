# Full proper label rebuild: restores pristine source, reconstructs bands cleanly
# with a condensed face (Arial Narrow Bold) instead of patching over old glyphs.
Add-Type -AssemblyName System.Drawing
Copy-Item 'can-green-src-PT.jpg' 'can-green-src.jpg' -Force
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.jpg'))
$g = [System.Drawing.Graphics]::FromImage($src)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$rand = New-Object System.Random
function FillRows($x0, $x1, $y0, $y1, $sx) {
    for ($y = $y0; $y -le $y1; $y++) {
        $c = $src.GetPixel($sx, $y)
        $br = New-Object System.Drawing.SolidBrush($c)
        $g.FillRectangle($br, $x0, $y, ($x1 - $x0 + 1), 1)
        $br.Dispose()
    }
}
function GrainRect($x0, $y0, $x1, $y1, $amp) {
    for ($yy = $y0; $yy -le $y1; $yy++) {
        for ($xx = $x0; $xx -le $x1; $xx++) {
            $c = $src.GetPixel($xx, $yy)
            $n = $rand.Next(-$amp, $amp + 1)
            $rr = $c.R + $n; if ($rr -lt 0) { $rr = 0 }; if ($rr -gt 255) { $rr = 255 }
            $gg = $c.G + $n; if ($gg -lt 0) { $gg = 0 }; if ($gg -gt 255) { $gg = 255 }
            $bb = $c.B + $n; if ($bb -lt 0) { $bb = 0 }; if ($bb -gt 255) { $bb = 255 }
            $src.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb($rr, $gg, $bb))
        }
    }
}
function VTextSpaced($text, $cx, $cy, $span, $size, $color) {
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform(-90)
    $f = New-Object System.Drawing.Font('Arial Narrow', $size, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $br = New-Object System.Drawing.SolidBrush($color)
    $n = $text.Length
    for ($i = 0; $i -lt $n; $i++) {
        $px = -$span / 2 + $span * $i / ($n - 1)
        $g.DrawString($text[$i].ToString(), $f, $br, $px, 0, $sf)
    }
    $g.ResetTransform()
    $f.Dispose(); $br.Dispose(); $sf.Dispose()
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
$black = [System.Drawing.Color]::FromArgb(15, 15, 15)
# Top band: rebuild strip, spaced ORIGINAL
FillRows 40 220 330 1320 25
GrainRect 40 330 220 1320 5
VTextSpaced 'ORIGINAL' 130 825 640 70 $white
# Lower band: rebuild strip, spaced ORIGINAL
FillRows 40 220 1130 1910 25
GrainRect 40 1130 220 1910 5
VTextSpaced 'ORIGINAL' 130 1520 640 70 $white
# Small lines: clear right of 350ml (ends ~1118), redraw
for ($y = 600; $y -le 880; $y++) {
    for ($x = 1122; $x -le 1190; $x++) {
        $c = $src.GetPixel($x, 595)
        $src.SetPixel($x, $y, $c)
    }
}
GrainRect 1122 600 1190 880 5
VText 'GUARANA SODA' 1140 740 34 $white
VText 'CONTAINS FLAVORING' 1168 740 34 $white
# Script accent removal
$c0 = $src.GetPixel(700, 380)
$b0 = New-Object System.Drawing.SolidBrush($c0)
$g.FillRectangle($b0, 718, 416, 47, 49)
$b0.Dispose()
GrainRect 718 416 764 464 5
# Nutrition header inside panel
$best = $src.GetPixel(280, 1350); $bestL = -1
foreach ($p in @(@(280, 1350), @(310, 1400), @(340, 1400), @(310, 1500), @(340, 1500), @(280, 1600), @(260, 1750))) {
    $c = $src.GetPixel($p[0], $p[1])
    $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
    if ($lum -gt $bestL) { $bestL = $lum; $best = $c }
}
$wbr = New-Object System.Drawing.SolidBrush($best)
$g.FillRectangle($wbr, 215, 1280, 85, 510)
$wbr.Dispose()
GrainRect 215 1280 300 1790 3
VText 'NUTRITION FACTS' 257 1535 34 $black
$enc = $null
foreach ($c in [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()) { if ($c.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) { $enc = $c } }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $src.Dispose()
Move-Item 'can-green-src-tmp.png' 'can-green-src.png' -Force
echo 'rebuild done'
