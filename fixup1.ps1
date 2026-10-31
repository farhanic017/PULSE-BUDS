# Restores two zones from the pristine Portuguese backup for precise repainting.
Add-Type -AssemblyName System.Drawing
$pt = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src-PT.jpg'))
$src = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'can-green-src.jpg'))
$g = [System.Drawing.Graphics]::FromImage($src)
function Restore($x, $y, $w, $h) {
    $g.DrawImage($pt, (New-Object System.Drawing.Rectangle($x, $y, $w, $h)), (New-Object System.Drawing.Rectangle($x, $y, $w, $h)), [System.Drawing.GraphicsUnit]::Pixel)
}
Restore 1000 600 200 350
Restore 100 1190 180 320
$g.Dispose()
$enc = $null
foreach ($c in [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()) { if ($c.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) { $enc = $c } }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$src.Save((Join-Path (Get-Location) 'can-green-src-tmp.jpg'), $enc, $ep)
$src.Dispose(); $pt.Dispose()
Move-Item 'can-green-src-tmp.jpg' 'can-green-src.jpg' -Force
echo 'zones restored'
