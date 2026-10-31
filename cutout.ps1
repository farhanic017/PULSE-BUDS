# Cuts out the user-translated can (near-white bg -> transparent), then recolors
# per flavor with the same engine as the 3D textures.
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -Language CSharp -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging;
public static class Cut {
  public static void Flood(Bitmap bmp, int tol) {
    var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
    var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int stride = data.Stride, w = bmp.Width, hgt = bmp.Height;
    byte[] px = new byte[stride * hgt];
    System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
    Func<int, int[]> col = i => new int[] { px[i + 2], px[i + 1], px[i] };
    var seeds = new int[][] {
      new int[] { 5, 5 }, new int[] { w - 6, 5 }, new int[] { 5, hgt - 6 }, new int[] { w - 6, hgt - 6 }
    };
    bool[] seen = new bool[w * hgt];
    int rR = px[(5 * w + 5) * 4 + 2], rG = px[(5 * w + 5) * 4 + 1], rB = px[(5 * w + 5) * 4];
    var q = new System.Collections.Generic.Queue<int>();
    foreach (var s in seeds) {
      int si = s[1] * w + s[0];
      if (!seen[si]) { seen[si] = true; q.Enqueue(si); }
    }
    int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
    while (q.Count > 0) {
      int i = q.Dequeue();
      int x = i % w, y = i / w;
      px[i * 4 + 3] = 0;
      for (int d = 0; d < 4; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (nx < 0 || ny < 0 || nx >= w || ny >= hgt) continue;
        int ni = ny * w + nx;
        if (seen[ni]) continue;
        int dr = Math.Abs(px[ni * 4 + 2] - rR);
        int dg = Math.Abs(px[ni * 4 + 1] - rG);
        int db = Math.Abs(px[ni * 4] - rB);
        if (dr + dg + db <= tol) { seen[ni] = true; q.Enqueue(ni); }
      }
    }
    System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
    bmp.UnlockBits(data);
  }
}
'@
$src = New-Object System.Drawing.Bitmap('D:\DOWNLOADS\can-green-card-src.jpg')
$bmp = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gg = [System.Drawing.Graphics]::FromImage($bmp)
$gg.DrawImage($src, 0, 0, 1024, 1024)
$gg.Dispose(); $src.Dispose()
[Cut]::Flood($bmp, 54)
$bmp.Save((Join-Path (Get-Location) 'card-photo-src.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
echo 'cutout done'
