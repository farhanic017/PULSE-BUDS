# Precise repaint of small-lines + nutrition header (zones restored to pristine first).
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.jpg'))
$g = [System.Drawing.Graphics]::FromImage($src)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$rand = New-Object System.Random
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
# Small lines: clear right of 350ml (ends ~1087), redraw centered in the clear band
for ($y = 620; $y -le 830; $y++) {
    for ($x = 1098; $x -le 1185; $x++) {
        $c = $src.GetPixel($x, 605)
        $src.SetPixel($x, $y, $c)
    }
}
GrainRect 1098 620 1185 830 5
VText 'GUARANA SODA' 1132 725 24 $white
VText 'CONTAINS FLAVORING' 1163 725 24 $white
# Nutrition header: white box strictly inside panel, text inside it
$wc = $src.GetPixel(320, 1400)
$wbr = New-Object System.Drawing.SolidBrush($wc)
$g.FillRectangle($wbr, 235, 1240, 65, 470)
$wbr.Dispose()
GrainRect 235 1240 300 1710 3
VText 'NUTRITION FACTS' 267 1475 30 $black
# Lower band redo (an earlier restore wiped the first pass): full band is y1200-1700
for ($y = 1200; $y -le 1700; $y++) {
    for ($x = 70; $x -le 200; $x++) {
        $c = $src.GetPixel(60, $y)
        $src.SetPixel($x, $y, $c)
    }
}
GrainRect 70 1200 200 1700 5
VText 'ORIGINAL' 135 1450 68 $white
$enc = $null
foreach ($c in [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()) { if ($c.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) { $enc = $c } }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.jpg'), $enc, $ep)
$g.Dispose(); $src.Dispose()
Move-Item 'can-green-src-tmp.jpg' 'can-green-src.jpg' -Force
echo 'repaint done'
