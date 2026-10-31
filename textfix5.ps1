# Small-zone redo: restore, clear with clean-shading samples, redraw.
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.jpg'))
$pt = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src-PT.jpg'))
$g = [System.Drawing.Graphics]::FromImage($src)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$rand = New-Object System.Random
# 1. restore zone to pristine
$g.DrawImage($pt, (New-Object System.Drawing.Rectangle(1100, 550, 100, 370)), (New-Object System.Drawing.Rectangle(1100, 550, 100, 370)), [System.Drawing.GraphicsUnit]::Pixel)
# 2. clear with per-row shading sampled from clean far-left column
for ($y = 580; $y -le 900; $y++) {
    $c = $src.GetPixel(60, $y)
    $br = New-Object System.Drawing.SolidBrush($c)
    $g.FillRectangle($br, 1122, $y, 69, 1)
    $br.Dispose()
}
# 3. grain
for ($yy = 580; $yy -le 900; $yy++) {
    for ($xx = 1122; $xx -le 1190; $xx++) {
        $c = $src.GetPixel($xx, $yy)
        $n = $rand.Next(-5, 6)
        $rr = $c.R + $n; if ($rr -lt 0) { $rr = 0 }; if ($rr -gt 255) { $rr = 255 }
        $gg = $c.G + $n; if ($gg -lt 0) { $gg = 0 }; if ($gg -gt 255) { $gg = 255 }
        $bb = $c.B + $n; if ($bb -lt 0) { $bb = 0 }; if ($bb -gt 255) { $bb = 255 }
        $src.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb($rr, $gg, $bb))
    }
}
# 4. redraw
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
VText 'GUARANA SODA' 1145 740 34 $white
VText 'CONTAINS FLAVORING' 1172 740 34 $white
$enc = $null
foreach ($c in [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()) { if ($c.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) { $enc = $c } }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.jpg'), $enc, $ep)
$g.Dispose(); $src.Dispose(); $pt.Dispose()
Move-Item 'can-green-src-tmp.jpg' 'can-green-src.jpg' -Force
echo 'small redo done'
