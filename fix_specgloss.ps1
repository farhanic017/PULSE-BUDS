# Converts KHR_materials_pbrSpecularGlossiness -> metallic-roughness in place.
# Usage: powershell -File fix_specgloss.ps1 persian_lime.glb
param([string]$File)
Add-Type -AssemblyName System.Drawing
$raw = [System.IO.File]::ReadAllBytes($File)
$jlen = [BitConverter]::ToUInt32($raw, 12)
$json = [System.Text.Encoding]::UTF8.GetString($raw[20..(20 + $jlen - 1)])
$o = $json | ConvertFrom-Json
$bufLen = $o.buffers[0].byteLength
$binStart = 20 + $jlen + 8
[byte[]]$bin = $raw[$binStart..($raw.Length - 1)]
# growable binary via MemoryStream (avoids PowerShell array-type pitfalls)
$msBin = New-Object System.IO.MemoryStream
$msBin.Write($bin, 0, $bin.Length)
foreach ($m in $o.materials) {
    $sg = $m.extensions.'KHR_materials_pbrSpecularGlossiness'
    if (-not $sg) { continue }
    $pbr = @{ baseColorFactor = $sg.diffuseFactor; metallicFactor = 0.0; roughnessFactor = 1.0 }
    if ($sg.diffuseTexture) { $pbr.baseColorTexture = @{ index = $sg.diffuseTexture.index } }
    if ($sg.specularGlossinessTexture) {
        $tIdx = $sg.specularGlossinessTexture.index
        $imgIdx = $o.textures[$tIdx].source
        $bvIdx = $o.images[$imgIdx].bufferView
        $bv = $o.bufferViews[$bvIdx]
        $texBytes = [byte[]]$bin[$bv.byteOffset..($bv.byteOffset + $bv.byteLength - 1)]
        $ms = New-Object System.IO.MemoryStream(, $texBytes)
        $bmp = [System.Drawing.Bitmap]::FromStream($ms)
        $w = $bmp.Width; $h = $bmp.Height
        $out = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        for ($y = 0; $y -lt $h; $y++) {
            for ($x = 0; $x -lt $w; $x++) {
                $p = $bmp.GetPixel($x, $y)
                $rough = 255 - [int]($p.A * $sg.glossinessFactor)
                if ($rough -lt 0) { $rough = 0 }; if ($rough -gt 255) { $rough = 255 }
                $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, $rough, 0))
            }
        }
        $oms = New-Object System.IO.MemoryStream
        $out.Save($oms, [System.Drawing.Imaging.ImageFormat]::Png)
        [byte[]]$png = $oms.ToArray()
        $newOff = $bufLen + [int]$msBin.Length - $bin.Length
        # NOTE: msBin currently holds exactly the original BIN (Length == bin.Length),
        # so new data starts at original buffer byteLength.
        # New data must start at the 4-byte-aligned end of the existing buffer
        # (buffer.byteLength itself may sit up to 3 bytes before that padding).
        $alignedLen = [int]([math]::Ceiling($o.buffers[0].byteLength / 4) * 4)
        $newOff = $alignedLen
        while ($msBin.Length -lt $newOff) { $msBin.WriteByte(0) }
        $msBin.Write($png, 0, $png.Length)
        while (($msBin.Length % 4) -ne 0) { $msBin.WriteByte(0) }
        [byte[]]$binAll = $msBin.ToArray()
        $o.bufferViews += @(@{ buffer = 0; byteOffset = $newOff; byteLength = $png.Length })
        $o.images += @(@{ bufferView = ($o.bufferViews.Count - 1); mimeType = 'image/png' })
        $tex = @{ source = ($o.images.Count - 1) }
        $smp = $o.textures[$tIdx].sampler
        if ($null -ne $smp) { $tex.sampler = $smp }
        $o.textures += @($tex)
        $pbr.metallicRoughnessTexture = @{ index = ($o.textures.Count - 1) }
        $o.buffers[0].byteLength = [int]$newOff + $png.Length
        $bmp.Dispose(); $out.Dispose()
    }
    $m | Add-Member -NotePropertyName pbrMetallicRoughness -NotePropertyValue $pbr -Force
    $m.PSObject.Properties.Remove('extensions')
}
$o.PSObject.Properties.Remove('extensionsRequired')
$o.PSObject.Properties.Remove('extensionsUsed')
[byte[]]$jb = [System.Text.Encoding]::UTF8.GetBytes(($o | ConvertTo-Json -Depth 20 -Compress))
$jpad = (4 - ($jb.Length % 4)) % 4
[byte[]]$jbPadded = New-Object byte[] ($jb.Length + $jpad)
[Buffer]::BlockCopy($jb, 0, $jbPadded, 0, $jb.Length)
for ($i = 0; $i -lt $jpad; $i++) { $jbPadded[$jb.Length + $i] = 0x20 }
[byte[]]$binFinal = $msBin.ToArray()
$total = 12 + 8 + $jbPadded.Length + 8 + $binFinal.Length
[byte[]]$out = New-Object byte[] $total
[Buffer]::BlockCopy([System.Text.Encoding]::ASCII.GetBytes('glTF'), 0, $out, 0, 4)
[Buffer]::BlockCopy([BitConverter]::GetBytes([uint32]2), 0, $out, 4, 4)
[Buffer]::BlockCopy([BitConverter]::GetBytes([uint32]$total), 0, $out, 8, 4)
[Buffer]::BlockCopy([BitConverter]::GetBytes([uint32]$jbPadded.Length), 0, $out, 12, 4)
[Buffer]::BlockCopy([System.Text.Encoding]::ASCII.GetBytes('JSON'), 0, $out, 16, 4)
[Buffer]::BlockCopy($jbPadded, 0, $out, 20, $jbPadded.Length)
$off2 = 20 + $jbPadded.Length
[Buffer]::BlockCopy([BitConverter]::GetBytes([uint32]$binFinal.Length), 0, $out, $off2, 4)
[Buffer]::BlockCopy([System.Text.Encoding]::ASCII.GetBytes("BIN`0"), 0, $out, ($off2 + 4), 4)
[Buffer]::BlockCopy($binFinal, 0, $out, ($off2 + 8), $binFinal.Length)
Copy-Item $File ($File + '.orig') -Force
[System.IO.File]::WriteAllBytes($File, $out)
echo "OK: rebuilt $File (json=$($jbPadded.Length) bin=$($binFinal.Length) total=$total)"
