# Paints English label text onto can-green-src.jpg (backup saved as can-green-src-PT.jpg).
Add-Type -AssemblyName System.Drawing
Copy-Item 'can-green-src.jpg' 'can-green-src-PT.jpg' -Force
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.jpg'))
$g = [System.Drawing.Graphics]::FromImage($src)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
function FillRows($x0, $x1, $y0, $y1, $sx) {
    for ($y = $y0; $y -le $y1; $y++) {
        $c = $src.GetPixel($sx, $y)
        $br = New-Object System.Drawing.SolidBrush($c)
        $g.FillRectangle($br, $x0, $y, ($x1 - $x0 + 1), 1)
        $br.Dispose()
    }
}
function FillCols($x0, $x1, $y0, $y1, $sy) {
    for ($x = $x0; $x -le $x1; $x++) {
        $c = $src.GetPixel($x, $sy)
        $br = New-Object System.Drawing.SolidBrush($c)
        $g.FillRectangle($br, $x, $y0, 1, ($y1 - $y0 + 1))
        $br.Dispose()
    }
}
function FillFlat($x0, $y0, $x1, $y1, $sx, $sy) {
    $c = $src.GetPixel($sx, $sy)
    $br = New-Object System.Drawing.SolidBrush($c)
    $g.FillRectangle($br, $x0, $y0, ($x1 - $x0 + 1), ($y1 - $y0 + 1))
    $br.Dispose()
}
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
# 1. Top band: ORIGINAL DO BRASIL -> ORIGINAL
FillRows 70 200 485 1175 55
GrainRect 70 485 200 1175 5
VText 'ORIGINAL' 135 830 68 $white
# 2. Lower band: same swap
FillRows 70 200 1230 1900 55
GrainRect 70 1230 200 1900 5
VText 'ORIGINAL' 135 1565 68 $white
# 3. Small lines: keep 350ml, translate the two small lines
FillCols 1100 1180 620 815 605
GrainRect 1100 620 1180 815 5
VText 'GUARANA SODA' 1125 717 28 $white
VText 'CONTAINS FLAVORING' 1156 717 28 $white
# 4. Accent-ectomy: Guarana script keeps its style, loses the mark
FillFlat 718 416 764 464 700 380
GrainRect 718 416 764 464 5
# 5. Nutrition header -> NUTRITION FACTS (body left as-is: subpixel on the can)
FillFlat 150 1200 265 1490 300 1350
GrainRect 150 1200 265 1490 4
VText 'NUTRITION FACTS' 207 1345 28 $black
$enc = $null
foreach ($c in [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()) { if ($c.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) { $enc = $c } }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$src.Save((Join-Path (Get-Location) 'can-green-src-new.jpg'), $enc, $ep)
$g.Dispose(); $src.Dispose()
Move-Item 'can-green-src-new.jpg' 'can-green-src.jpg' -Force
echo 'textfix done'
