# Adds a wraparound label band mesh to soda_can.glb -> soda_can_labeled.glb
Add-Type -ReferencedAssemblies System.Drawing -Language CSharp -TypeDefinition @'
using System;
using System.Collections;
using System.Collections.Generic;
public static class BandBuilder {
  public static Hashtable Build(double r, double x0, double x1, int segs) {
    var pos = new List<double>(); var nrm = new List<double>();
    var uv = new List<double>(); var idx = new List<int>();
    for (int iy = 0; iy <= 1; iy++) {
      double x = x0 + iy * (x1 - x0);
      for (int s = 0; s <= segs; s++) {
        double th = 2.0 * Math.PI * s / segs;
        double cy = Math.Cos(th), sz = Math.Sin(th);
        pos.Add(x); pos.Add(r * cy); pos.Add(r * sz);
        nrm.Add(0); nrm.Add(cy); nrm.Add(sz);
        uv.Add((double)s / segs); uv.Add(iy);
      }
    }
    int cols = segs + 1;
    for (int s = 0; s < segs; s++) {
      int a = s, b = s + 1, c = cols + s, d = cols + s + 1;
      idx.Add(a); idx.Add(b); idx.Add(c);
      idx.Add(b); idx.Add(d); idx.Add(c);
    }
    return new Hashtable {
      { "pos", pos.ToArray() }, { "nrm", nrm.ToArray() },
      { "uv", uv.ToArray() }, { "idx", idx.ToArray() },
      { "min", new double[] { x0, -r, -r } }, { "max", new double[] { x1, r, r } }
    };
  }
  public static byte[] FloatBytes(double[] v) {
    byte[] b = new byte[v.Length * 4];
    Buffer.BlockCopy(Array.ConvertAll(v, x => (float)x), 0, b, 0, b.Length);
    return b;
  }
  public static byte[] UShortBytes(int[] v) {
    ushort[] u = Array.ConvertAll(v, x => (ushort)x);
    byte[] b = new byte[u.Length * 2];
    Buffer.BlockCopy(u, 0, b, 0, b.Length);
    return b;
  }
  public static byte[] WhitePng() {
    string hex = "89504E470D0A1A0A0000000D4948445200000001000000010802000000907753DE0000000C4944415408D763F8FFFF3F0005FE02FEDCCC59E70000000049454E44AE426082";
    byte[] b = new byte[hex.Length / 2];
    for (int i = 0; i < b.Length; i++) b[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
    return b;
  }
}
'@
$raw = [System.IO.File]::ReadAllBytes('soda_can.glb')
$jlen = [BitConverter]::ToUInt32($raw, 12)
$json = [System.Text.Encoding]::UTF8.GetString($raw[20..(20 + $jlen - 1)])
$o = $json | ConvertFrom-Json
$binStart = 20 + $jlen + 8
[byte[]]$origBin = $raw[$binStart..($raw.Length - 1)]
$ms = New-Object System.IO.MemoryStream
$ms.Write($origBin, 0, $origBin.Length)
function Add-Part([byte[]]$arr) {
    while (($ms.Length % 4) -ne 0) { $ms.WriteByte(0) }
    $off = [int]$ms.Length
    $ms.Write($arr, 0, $arr.Length)
    while (($ms.Length % 4) -ne 0) { $ms.WriteByte(0) }
    return $off
}
$band = [BandBuilder]::Build(0.925, -0.8, 1.95, 96)
$offPos = Add-Part ([BandBuilder]::FloatBytes($band['pos']))
$offNrm = Add-Part ([BandBuilder]::FloatBytes($band['nrm']))
$offUv = Add-Part ([BandBuilder]::FloatBytes($band['uv']))
$offIdx = Add-Part ([BandBuilder]::UShortBytes($band['idx']))
$offPng = Add-Part ([BandBuilder]::WhitePng())
$nVerts = ($band['pos']).Length / 3
$nIdx = ($band['idx']).Length
function BV($off, $len) { return New-Object PSObject -Property @{ buffer = 0; byteOffset = $off; byteLength = $len } }
$o.bufferViews = @($o.bufferViews) + @((BV $offPos ($nVerts * 12)), (BV $offNrm ($nVerts * 12)), (BV $offUv ($nVerts * 8)), (BV $offIdx ($nIdx * 2)), (BV $offPng 67))
$bi = $o.bufferViews.Count - 5
function ACC($bv, $ct, $count, $type, $mn, $mx) {
    $a = New-Object PSObject -Property @{ bufferView = $bv; componentType = $ct; count = $count; type = $type }
    if ($mn) { $a | Add-Member -NotePropertyName min -NotePropertyValue $mn; $a | Add-Member -NotePropertyName max -NotePropertyValue $mx }
    return $a
}
$o.accessors = @($o.accessors) + @(
    (ACC $bi 5126 $nVerts 'VEC3' $band['min'] $band['max']),
    (ACC ($bi + 1) 5126 $nVerts 'VEC3' @(-1, -1, -1) @(1, 1, 1)),
    (ACC ($bi + 2) 5126 $nVerts 'VEC2' @(0, 0) @(1, 1)),
    (ACC ($bi + 3) 5123 $nIdx 'SCALAR' $null $null)
)
$ai = $o.accessors.Count - 4
$o.images = @($o.images) + @((New-Object PSObject -Property @{ bufferView = ($bi + 4); mimeType = 'image/png' }))
$o.textures = @($o.textures) + @((New-Object PSObject -Property @{ source = ($o.images.Count - 1) }))
$o.materials = @($o.materials) + @((New-Object PSObject -Property @{
    name = 'label'
    doubleSided = $true
    pbrMetallicRoughness = New-Object PSObject -Property @{
        baseColorTexture = New-Object PSObject -Property @{ index = ($o.textures.Count - 1) }
        metallicFactor = 0.55
        roughnessFactor = 0.35
    }
}))
$prim = New-Object PSObject -Property @{
    attributes = New-Object PSObject -Property @{ POSITION = $ai; NORMAL = ($ai + 1); TEXCOORD_0 = ($ai + 2) }
    indices = ($ai + 3)
    material = ($o.materials.Count - 1)
}
$o.meshes = @($o.meshes) + @((New-Object PSObject -Property @{ name = 'LabelBand'; primitives = @($prim) }))
$o.nodes = @($o.nodes) + @((New-Object PSObject -Property @{ name = 'LabelBand'; mesh = ($o.meshes.Count - 1) }))
$o.nodes = @($o.nodes) + @((New-Object PSObject -Property @{
    name = 'Upright'
    rotation = @(0, 0, 0.70710678, 0.70710678)
    children = @(3, ($o.nodes.Count - 1))
}))
$o.scenes[0].nodes = @(($o.nodes.Count - 1))
[byte[]]$binFinal = $ms.ToArray()
$o.buffers[0].byteLength = $binFinal.Length
$newJson = $o | ConvertTo-Json -Depth 20 -Compress
[byte[]]$jb = [System.Text.Encoding]::UTF8.GetBytes($newJson)
[byte[]]$jbPadded = New-Object byte[] ($jb.Length + ((4 - ($jb.Length % 4)) % 4))
[Buffer]::BlockCopy($jb, 0, $jbPadded, 0, $jb.Length)
for ($i = $jb.Length; $i -lt $jbPadded.Length; $i++) { $jbPadded[$i] = 0x20 }
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
$binTag = [System.Text.Encoding]::ASCII.GetBytes('BIN')
[Buffer]::BlockCopy($binTag, 0, $out, ($off2 + 4), 3)
$out[$off2 + 7] = 0
[Buffer]::BlockCopy($binFinal, 0, $out, ($off2 + 8), $binFinal.Length)
[System.IO.File]::WriteAllBytes('soda_can_labeled.glb', $out)
echo "OK: soda_can_labeled.glb total=$total (label verts=$nVerts)"
