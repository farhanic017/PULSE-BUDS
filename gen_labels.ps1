# Generates wraparound English label art (2048x1024) for the plain soda can.
Add-Type -AssemblyName System.Drawing
$fams = (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }
function Pick-Font($names, $size, $style) {
    foreach ($n in $names) {
        if ($fams -contains $n) { return New-Object System.Drawing.Font($n, $size, $style) }
    }
    return New-Object System.Drawing.Font('Arial', $size, $style)
}
function Label($dark, $main, $flavor, $out) {
    $W = 2048; $H = 1024
    $bmp = New-Object System.Drawing.Bitmap($W, $H)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $cD = [System.Drawing.ColorTranslator]::FromHtml($dark)
    $cM = [System.Drawing.ColorTranslator]::FromHtml($main)
    for ($y = 0; $y -lt $H; $y++) {
        $t = $y / ($H - 1)
        $k = [Math]::Abs($t - 0.45) / 0.55
        if ($k -gt 1) { $k = 1 }
        $r = [int]($cM.R + ($cD.R - $cM.R) * $k)
        $gg = [int]($cM.G + ($cD.G - $cM.G) * $k)
        $bb = [int]($cM.B + ($cD.B - $cM.B) * $k)
        $br = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($r, $gg, $bb))
        $g.FillRectangle($br, 0, $y, $W, 1)
        $br.Dispose()
    }
    $white = [System.Drawing.Color]::White
    $wbr = New-Object System.Drawing.SolidBrush($white)
    $g.FillRectangle($wbr, 0, 54, $W, 30)
    $g.FillRectangle($wbr, 0, ($H - 84), $W, 30)
    $wbr.Dispose()
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    foreach ($cx in @(512, 1536)) {
        $fb = Pick-Font @('Georgia', 'Times New Roman') 112 ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic)
        $sh = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 0, 0, 0))
        $g.DrawString('Diet Soda', $fb, $sh, ($cx + 5), 435, $sf)
        $sh.Dispose()
        $wb = New-Object System.Drawing.SolidBrush($white)
        $g.DrawString('Diet Soda', $fb, $wb, $cx, 430, $sf)
        $wb.Dispose(); $fb.Dispose()
        $ff = Pick-Font @('Arial Narrow', 'Arial') 76 ([System.Drawing.FontStyle]::Bold)
        $wb2 = New-Object System.Drawing.SolidBrush($white)
        $g.DrawString($flavor, $ff, $wb2, $cx, 600, $sf)
        $wb2.Dispose(); $ff.Dispose()
        $fs = Pick-Font @('Arial Narrow', 'Arial') 44 ([System.Drawing.FontStyle]::Bold)
        $wb3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
        $g.DrawString('ZERO SUGAR  -  350 ML', $fs, $wb3, $cx, 700, $sf)
        $wb3.Dispose(); $fs.Dispose()
    }
    $bmp.Save((Join-Path (Get-Location) $out), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    echo "wrote $out"
}
Label '#1c1e22' '#43484f' 'DIET CLASSIC' 'label-classic.png'
Label '#2f4d0a' '#65a30d' 'ZERO LIME' 'label-lime.png'
Label '#6d1425' '#e0415c' 'STRAWBERRY BLISS' 'label-strawberry.png'
Label '#7c3a06' '#f59e0b' 'MANGO TANGO' 'label-mango.png'
Label '#241058' '#6d28d9' 'BLUEBERRY BURST' 'label-blueberry.png'
Label '#241206' '#7c4a21' 'CHOCOLATE FUDGE' 'label-chocolate.png'
