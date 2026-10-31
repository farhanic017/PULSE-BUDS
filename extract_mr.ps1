# Extracts the metal-roughness WebP from deit_soda2.glb via WIC and saves working PNG.
Add-Type -AssemblyName PresentationCore
$b = [System.IO.File]::ReadAllBytes('deit_soda2.glb')
$jlen = [BitConverter]::ToUInt32($b, 12)
$o = [System.Text.Encoding]::UTF8.GetString($b[20..(20 + $jlen - 1)]) | ConvertFrom-Json
$bs = 20 + $jlen + 8
# find metalnessRoughness image: material's metallicRoughnessTexture -> texture -> source(image)
$mt = $o.materials[0].pbrMetallicRoughness.metallicRoughnessTexture.index
$imgIdx = $o.textures[$mt].source
echo "metalRough texture=$mt image=$imgIdx"
$bv = $o.bufferViews[$o.images[$imgIdx].bufferView]
$bytes = [byte[]]$b[($bs + $bv.byteOffset)..($bs + $bv.byteOffset + $bv.byteLength - 1)]
$ms = New-Object System.IO.MemoryStream(, $bytes)
$dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($ms, 'PreservePixelFormat', 'OnLoad')
$frame = $dec.Frames[0]
echo "decoded $($frame.PixelWidth)x$($frame.PixelHeight) fmt=$($frame.Format)"
$stride = $frame.PixelWidth * 4
$pixels = New-Object byte[] ($stride * $frame.PixelHeight)
$frame.CopyPixels($pixels, $stride, 0)
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap($frame.PixelWidth, $frame.PixelHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bd = $bmp.LockBits((New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)), 'WriteOnly', $bmp.PixelFormat)
[System.Runtime.InteropServices.Marshal]::Copy($pixels, 0, $bd.Scan0, $pixels.Length)
$bmp.UnlockBits($bd)
$bmp.Save((Join-Path (Get-Location) 'metalrough.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
echo 'saved metalrough.png'
