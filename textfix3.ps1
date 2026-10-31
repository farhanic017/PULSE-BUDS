# Final precise repaint: restore zones, then paint with measured coordinates.
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.jpg'))
$pt = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src-PT.jpg'))
$g = [System.Drawing.Graphics]::FromImage($src)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$rand = New-Object System.Random
function Restore($x, $y, $w, $h) {
    $g.DrawImage($pt, (New-Object System.Drawing.Rectangle($x, $y, $w, $h)), (New-Object System.Drawing.Rectangle($x, $y, $w, $h)), [System.Drawing.GraphicsUnit]::Pixel)
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
function VText($text, $cx, $cy, $size, $color) {
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform(-90)
    $f = New-Object System.Drawing.Font('Arial', $size, [System.Drawing.FontStyle]::Bold)
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
# Small lines: restore (brings back 350ml + old lines), clear right of ml, redraw
Restore 1000 600 200 350
for ($y = 615; $y -le 835; $y++) {
    for ($x = 1122; $x -le 1190; $x++) {
        $c = $src.GetPixel($x, 605)
        $src.SetPixel($x, $y, $c)
    }
}
GrainRect 1122 615 1190 835 5
VText 'GUARANA SODA' 1140 727 28 $white
VText 'CONTAINS FLAVORING' 1168 727 28 $white
# Nutrition: restore (wipes black box), white box from brightest sample, black text
Restore 200 1200 120 520
$best = $src.GetPixel(280, 1350); $bestL = -1
foreach ($p in @(@(280, 1350), @(310, 1400), @(340, 1400), @(310, 1500), @(340, 1500), @(280, 1600))) {
    $c = $src.GetPixel($p[0], $p[1])
    $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
    if ($lum -gt $bestL) { $bestL = $lum; $best = $c }
}
$wbr = New-Object System.Drawing.SolidBrush($best)
$g.FillRectangle($wbr, 235, 1280, 65, 420)
$wbr.Dispose()
GrainRect 235 1280 300 1700 3
VText 'NUTRITION FACTS' 267 1490 30 $black
$enc = $null
foreach ($c in [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()) { if ($c.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) { $enc = $c } }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.jpg'), $enc, $ep)
$g.Dispose(); $src.Dispose(); $pt.Dispose()
Move-Item 'can-green-src-tmp.jpg' 'can-green-src.jpg' -Force
echo 'repaint done'
