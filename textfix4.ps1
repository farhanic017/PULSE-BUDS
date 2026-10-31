# Extends the nutrition white box over leftover header fragments.
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.jpg'))
$g = [System.Drawing.Graphics]::FromImage($src)
$rand = New-Object System.Random
$best = $src.GetPixel(280, 1350); $bestL = -1
foreach ($p in @(@(280, 1350), @(310, 1400), @(340, 1400), @(310, 1500), @(340, 1500), @(280, 1600), @(260, 1750))) {
    $c = $src.GetPixel($p[0], $p[1])
    $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
    if ($lum -gt $bestL) { $bestL = $lum; $best = $c }
}
$wbr = New-Object System.Drawing.SolidBrush($best)
$g.FillRectangle($wbr, 215, 1280, 20, 420)
$g.FillRectangle($wbr, 235, 1700, 65, 90)
$wbr.Dispose()
foreach ($r in @(@(215, 1280, 235, 1700), @(235, 1700, 300, 1790))) {
    for ($yy = $r[1]; $yy -le $r[3]; $yy++) {
        for ($xx = $r[0]; $xx -le $r[2]; $xx++) {
            $c = $src.GetPixel($xx, $yy)
            $n = $rand.Next(-3, 4)
            $rr = $c.R + $n; if ($rr -lt 0) { $rr = 0 }; if ($rr -gt 255) { $rr = 255 }
            $gg = $c.G + $n; if ($gg -lt 0) { $gg = 0 }; if ($gg -gt 255) { $gg = 255 }
            $bb = $c.B + $n; if ($bb -lt 0) { $bb = 0 }; if ($bb -gt 255) { $bb = 255 }
            $src.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb($rr, $gg, $bb))
        }
    }
}
$enc = $null
foreach ($c in [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()) { if ($c.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) { $enc = $c } }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.jpg'), $enc, $ep)
$g.Dispose(); $src.Dispose()
Move-Item 'can-green-src-tmp.jpg' 'can-green-src.jpg' -Force
echo 'nutrition extended'
