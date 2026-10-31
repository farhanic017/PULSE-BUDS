# Cuts white backgrounds + autocrops card art.
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -Language CSharp -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging;
public static class CardCut {
  public static Bitmap Load(string path) {
    var src = new Bitmap(path);
    var bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
    using (var g = Graphics.FromImage(bmp)) g.DrawImage(src, 0, 0, src.Width, src.Height);
    src.Dispose();
    return bmp;
  }
  public static void FloodClear(Bitmap bmp, int tol) {
    var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
    var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int stride = data.Stride, w = bmp.Width, hgt = bmp.Height;
    byte[] px = new byte[stride * hgt];
    System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
    int rR = px[5 * stride + 5 * 4 + 2], rG = px[5 * stride + 5 * 4 + 1], rB = px[5 * stride + 5 * 4];
    bool[] seen = new bool[w * hgt];
    var q = new System.Collections.Generic.Queue<int>();
    int[][] seeds = { new int[] { 5, 5 }, new int[] { w - 6, 5 }, new int[] { 5, hgt - 6 }, new int[] { w - 6, hgt - 6 } };
    foreach (var s in seeds) { int si = s[1] * w + s[0]; if (!seen[si]) { seen[si] = true; q.Enqueue(si); } }
    int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
    while (q.Count > 0) {
      int i = q.Dequeue(); int x = i % w, y = i / w;
      px[i * 4 + 3] = 0;
      for (int d = 0; d < 4; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx < 0 || ny < 0 || nx >= w || ny >= hgt) continue;
        int ni = ny * w + nx;
        if (seen[ni]) continue;
        int dr = Math.Abs(px[ni * 4 + 2] - rR), dg = Math.Abs(px[ni * 4 + 1] - rG), db = Math.Abs(px[ni * 4] - rB);
        if (dr + dg + db <= tol) { seen[ni] = true; q.Enqueue(ni); }
      }
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
    bmp.UnlockBits(data);
  }
  public static Bitmap AutoCrop(Bitmap bmp, int margin) {
    var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
    var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int stride = data.Stride, w = bmp.Width, hgt = bmp.Height;
    byte[] px = new byte[stride * hgt];
    System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
    bmp.UnlockBits(data);
    int[] rowN = new int[hgt], colN = new int[w];
    for (int y = 0; y < hgt; y++) for (int x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > 10) { rowN[y]++; colN[x]++; }
    int x0 = w, y0 = hgt, x1 = 0, y1 = 0;
    for (int x = 0; x < w; x++) if (colN[x] >= 8) { x0 = x; break; }
    for (int x = w - 1; x >= 0; x--) if (colN[x] >= 8) { x1 = x; break; }
    for (int y = 0; y < hgt; y++) if (rowN[y] >= 8) { y0 = y; break; }
    for (int y = hgt - 1; y >= 0; y--) if (rowN[y] >= 8) { y1 = y; break; }
    x0 = Math.Max(0, x0 - margin); y0 = Math.Max(0, y0 - margin);
    x1 = Math.Min(w - 1, x1 + margin); y1 = Math.Min(hgt - 1, y1 + margin);
    var crop = new Bitmap(x1 - x0 + 1, y1 - y0 + 1, PixelFormat.Format32bppArgb);
    using (var g = Graphics.FromImage(crop)) g.DrawImage(bmp, new Rectangle(0, 0, crop.Width, crop.Height), new Rectangle(x0, y0, crop.Width, crop.Height), GraphicsUnit.Pixel);
    return crop;
  }
}
'@
$b = [CardCut]::Load('visa-front.png')
[CardCut]::FloodClear($b, 60)
$c = [CardCut]::AutoCrop($b, 10)
$c.Save((Join-Path (Get-Location) 'visa-front.png'), [System.Drawing.Imaging.ImageFormat]::Png)
echo "front $($c.Width)x$($c.Height)"
$b.Dispose(); $c.Dispose()
$b2 = [CardCut]::Load('visa-back.jpg')
[CardCut]::FloodClear($b2, 60)
$c2 = [CardCut]::AutoCrop($b2, 10)
$c2.Save((Join-Path (Get-Location) 'visa-back.png'), [System.Drawing.Imaging.ImageFormat]::Png)
echo "back $($c2.Width)x$($c2.Height)"
$b2.Dispose(); $c2.Dispose()
