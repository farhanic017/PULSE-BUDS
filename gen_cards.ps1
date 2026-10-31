# Flat-illustration carousel cards matching the 3D label palettes (300x420, transparent).
Add-Type -AssemblyName System.Drawing
$fams = (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }
function Pick-Font($names, $size, $style) {
    foreach ($n in $names) {
        if ($fams -contains $n) { return New-Object System.Drawing.Font($n, $size, $style) }
    }
    return New-Object System.Drawing.Font('Arial', $size, $style)
}
function RoundRect($g, $x, $y, $w, $h, $r, $brush) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc($x, $y, 2 * $r, 2 * $r, 180, 90)
    $p.AddArc($x + $w - 2 * $r, $y, 2 * $r, 2 * $r, 270, 90)
    $p.AddArc($x + $w - 2 * $r, $y + $h - 2 * $r, 2 * $r, 2 * $r, 0, 90)
    $p.AddArc($x, $y + $h - 2 * $r, 2 * $r, 2 * $r, 90, 90)
    $p.CloseFigure()
    $g.FillPath($brush, $p)
    $p.Dispose()
}
function Card($dark, $main, $light, $lines, $out) {
    $W = 300; $H = 420
    $bmp = New-Object System.Drawing.Bitmap($W, $H)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $cD = [System.Drawing.ColorTranslator]::FromHtml($dark)
    $cM = [System.Drawing.ColorTranslator]::FromHtml($main)
    $cL = [System.Drawing.ColorTranslator]::FromHtml($light)
    $white = [System.Drawing.Color]::White
    # drop shadow
    $shbr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 0, 0, 0))
    $g.FillEllipse($shbr, 62, 366, 176, 28)
    $shbr.Dispose()
    # body: vertical gradient light(top)->main->dark(bottom)
    $rect = New-Object System.Drawing.Rectangle(70, 92, 160, 272)
    $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cL, $cD, 90.0)
    $cb = New-Object System.Drawing.Drawing2D.ColorBlend
    $cb.Colors = @($cL, $cM, $cM, $cD)
    $cb.Positions = @(0.0, 0.35, 0.62, 1.0)
    $lg.InterpolationColors = $cb
    RoundRect $g 70 92 160 272 20 $lg
    $lg.Dispose()
    # metallic sheen stripe
    $sh2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(46, 255, 255, 255))
    $g.FillRectangle($sh2, 102, 96, 26, 264)
    $sh2.Dispose()
    # lid: silver ellipse + inner + tab
    $lid = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Rectangle(70, 66, 160, 44)), [System.Drawing.Color]::FromArgb(238, 238, 240), [System.Drawing.Color]::FromArgb(168, 170, 178), 90.0)
    $g.FillEllipse($lid, 70, 66, 160, 44)
    $lid.Dispose()
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 122, 130), 2)
    $g.DrawEllipse($pen, 92, 74, 116, 28)
    $pen.Dispose()
    $tab = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 152, 160))
    RoundRect $g 132 78 36 20 9 $tab
    $tab.Dispose()
    $riv = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(110, 112, 120))
    $g.FillEllipse($riv, 144, 83, 12, 12)
    $riv.Dispose()
    # bottom rim
    $rim = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(70, 0, 0, 0))
    $g.FillEllipse($rim, 78, 348, 144, 24)
    $rim.Dispose()
    # texts
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $fb = Pick-Font @('Georgia', 'Times New Roman') 30 ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic)
    $wb = New-Object System.Drawing.SolidBrush($white)
    $g.DrawString('Diet Soda', $fb, $wb, 150, 200, $sf)
    $wb.Dispose(); $fb.Dispose()
    $ff = Pick-Font @('Arial Narrow', 'Arial') 23 ([System.Drawing.FontStyle]::Bold)
    $yy = 248
    foreach ($ln in $lines) {
        $wb2 = New-Object System.Drawing.SolidBrush($white)
        $g.DrawString($ln, $ff, $wb2, 150, $yy, $sf)
        $wb2.Dispose()
        $yy += 30
    }
    $ff.Dispose()
    $fs = Pick-Font @('Arial Narrow', 'Arial') 15 ([System.Drawing.FontStyle]::Bold)
    $wb3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
    $g.DrawString('ZERO SUGAR', $fs, $wb3, 150, ($yy + 12), $sf)
    $wb3.Dispose(); $fs.Dispose()
    $sf.Dispose()
    $bmp.Save((Join-Path (Get-Location) $out), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    echo "wrote $out"
}
Card '#1c1e22' '#43484f' '#7d838d' @('DIET', 'CLASSIC') 'card-classic.png'
Card '#2f4d0a' '#65a30d' '#a4d65e' @('ZERO', 'LIME') 'card-lime.png'
Card '#6d1425' '#e0415c' '#f4899b' @('STRAWBERRY', 'BLISS') 'card-strawberry.png'
Card '#7c3a06' '#f59e0b' '#fbbf47' @('MANGO', 'TANGO') 'card-mango.png'
Card '#241058' '#6d28d9' '#a179f0' @('BLUEBERRY', 'BURST') 'card-blueberry.png'
Card '#241206' '#7c4a21' '#c08a54' @('CHOCOLATE', 'FUDGE') 'card-chocolate.png'
