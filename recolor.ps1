Add-Type -ReferencedAssemblies System.Drawing -Language CSharp -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
public static class CanTint {
  static void RgbToHsl(byte r, byte g, byte b, out double h, out double s, out double l) {
    double R=r/255.0, G=g/255.0, B=b/255.0;
    double max=Math.Max(R,Math.Max(G,B)), min=Math.Min(R,Math.Min(G,B));
    l=(max+min)/2.0;
    if (max==min) { h=0; s=0; return; }
    double d=max-min;
    s = l>0.5 ? d/(2.0-max-min) : d/(max+min);
    if (max==R) h=(G-B)/d + (G<B?6:0);
    else if (max==G) h=(B-R)/d + 2;
    else h=(R-G)/d + 4;
    h*=60.0;
  }
  static void HslToRgb(double h, double s, double l, out byte r, out byte g, out byte b) {
    h = ((h % 360)+360)%360;
    double c=(1-Math.Abs(2*l-1))*s;
    double x=c*(1-Math.Abs((h/60.0)%2-1));
    double m=l-c/2, R=0,G=0,B=0;
    if (h<60){R=c;G=x;} else if(h<120){R=x;G=c;} else if(h<180){G=c;B=x;}
    else if(h<240){G=x;B=c;} else if(h<300){R=x;B=c;} else {R=c;B=x;}
    r=(byte)Math.Round((R+m)*255); g=(byte)Math.Round((G+m)*255); b=(byte)Math.Round((B+m)*255);
  }
  public static void Recolor(string inPath, string outPath, double targetH, double satMul, double lightMul, double graySat, long quality) {
    using (var bmp = new Bitmap(inPath)) {
      var rect = new Rectangle(0,0,bmp.Width,bmp.Height);
      var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
      int stride = data.Stride, w=bmp.Width, hgt=bmp.Height;
      byte[] px = new byte[stride*hgt];
      System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
      for (int y=0;y<hgt;y++) {
        int row=y*stride;
        for (int x=0;x<w;x++) {
          int i=row+x*3;
          double h,s,l; RgbToHsl(px[i+2],px[i+1],px[i],out h,out s,out l);
          bool changed=false;
          if (h>=75 && h<=175 && s>0.12) {
            double wgt=1.0;
            if (h<90) wgt=(h-75)/15.0; else if (h>160) wgt=(175-h)/15.0;
            double nh=targetH+(h-125.0)*0.25, ns=s*satMul, nl=l*lightMul;
            h=h+(nh-h)*wgt; s=s+(ns-s)*wgt; l=l+(nl-l)*wgt; changed=true;
          } else if (s<0.14 && l>0.2 && l<0.9) {
            h=targetH; s=graySat; l=l*lightMul; changed=true;
          }
          if (changed) { byte r2,g2,b2; HslToRgb(h,s,l,out r2,out g2,out b2); px[i]=b2; px[i+1]=g2; px[i+2]=r2; }
        }
      }
      System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      ImageCodecInfo enc=null;
      foreach(var c in ImageCodecInfo.GetImageEncoders()) if(c.FormatID==ImageFormat.Jpeg.Guid) enc=c;
      var ep = new EncoderParameters(1);
      ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
      bmp.Save(outPath, enc, ep);
    }
  }
  public static void Desaturate(string inPath, string outPath, double satMul, double lightMul, double whiteKeep, long quality) {
    using (var bmp = new Bitmap(inPath)) {
      var rect = new Rectangle(0,0,bmp.Width,bmp.Height);
      var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
      int stride = data.Stride, w=bmp.Width, hgt=bmp.Height;
      byte[] px = new byte[stride*hgt];
      System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
      for (int y=0;y<hgt;y++) {
        int row=y*stride;
        for (int x=0;x<w;x++) {
          int i=row+x*3;
          double h,s,l; RgbToHsl(px[i+2],px[i+1],px[i],out h,out s,out l);
          if (s > 0.05) {
            double nl = l > 0.9 ? l * whiteKeep : l * lightMul;
            byte r2,g2,b2; HslToRgb(h, s * satMul, nl, out r2, out g2, out b2);
            px[i]=b2; px[i+1]=g2; px[i+2]=r2;
          }
        }
      }
      System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      ImageCodecInfo enc=null;
      foreach(var c in ImageCodecInfo.GetImageEncoders()) if(c.FormatID==ImageFormat.Jpeg.Guid) enc=c;
      var ep = new EncoderParameters(1);
      ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
      bmp.Save(outPath, enc, ep);
    }
  }
  // Grey/black body for Classic, but the red logo artwork and white text stay untouched.
  public static void DesatGreens(string inPath, string outPath, double lightMul, long quality) {
    using (var bmp = new Bitmap(inPath)) {
      var rect = new Rectangle(0,0,bmp.Width,bmp.Height);
      var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
      int stride = data.Stride, w=bmp.Width, hgt=bmp.Height;
      byte[] px = new byte[stride*hgt];
      System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
      for (int y=0;y<hgt;y++) {
        int row=y*stride;
        for (int x=0;x<w;x++) {
          int i=row+x*3;
          double h,s,l; RgbToHsl(px[i+2],px[i+1],px[i],out h,out s,out l);
          if (h>=75 && h<=175 && s>0.12) {
            byte r2,g2,b2; HslToRgb(h, s*0.06, l*lightMul, out r2, out g2, out b2);
            px[i]=b2; px[i+1]=g2; px[i+2]=r2;
          } else if (s<0.14 && l>0.15 && l<0.9) {
            byte r2,g2,b2; HslToRgb(h, s, l*0.75, out r2, out g2, out b2);
            px[i]=b2; px[i+1]=g2; px[i+2]=r2;
          }
        }
      }
      System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      ImageCodecInfo enc=null;
      foreach(var c in ImageCodecInfo.GetImageEncoders()) if(c.FormatID==ImageFormat.Jpeg.Guid) enc=c;
      var ep = new EncoderParameters(1);
      ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
      bmp.Save(outPath, enc, ep);
    }
  }
  public static void RecolorA(string inPath, string outPath, double targetH, double satMul, double lightMul, double graySat) {
    using (var bmp = new Bitmap(inPath)) {
      var rect = new Rectangle(0,0,bmp.Width,bmp.Height);
      var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int stride = data.Stride, w=bmp.Width, hgt=bmp.Height;
      byte[] px = new byte[stride*hgt];
      System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
      for (int y=0;y<hgt;y++) {
        int row=y*stride;
        for (int x=0;x<w;x++) {
          int i=row+x*4;
          if (px[i+3] < 10) continue;
          double h,s,l; RgbToHsl(px[i+2],px[i+1],px[i],out h,out s,out l);
          bool changed=false;
          if (h>=75 && h<=175 && s>0.12) {
            double wgt=1.0;
            if (h<90) wgt=(h-75)/15.0; else if (h>160) wgt=(175-h)/15.0;
            double nh=targetH+(h-125.0)*0.25, ns=s*satMul, nl=l*lightMul;
            h=h+(nh-h)*wgt; s=s+(ns-s)*wgt; l=l+(nl-l)*wgt; changed=true;
          } else if (s<0.14 && l>0.2 && l<0.9) {
            h=targetH; s=graySat; l=l*lightMul; changed=true;
          }
          if (changed) { byte r2,g2,b2; HslToRgb(h,s,l,out r2,out g2,out b2); px[i]=b2; px[i+1]=g2; px[i+2]=r2; }
        }
      }
      System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      bmp.Save(outPath, ImageFormat.Png);
    }
  }
  public static void DesatGreensA(string inPath, string outPath, double lightMul) {
    using (var bmp = new Bitmap(inPath)) {
      var rect = new Rectangle(0,0,bmp.Width,bmp.Height);
      var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int stride = data.Stride, w=bmp.Width, hgt=bmp.Height;
      byte[] px = new byte[stride*hgt];
      System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
      for (int y=0;y<hgt;y++) {
        int row=y*stride;
        for (int x=0;x<w;x++) {
          int i=row+x*4;
          if (px[i+3] < 10) continue;
          double h,s,l; RgbToHsl(px[i+2],px[i+1],px[i],out h,out s,out l);
          if (h>=75 && h<=175 && s>0.12) {
            byte r2,g2,b2; HslToRgb(h, s*0.06, l*lightMul, out r2, out g2, out b2);
            px[i]=b2; px[i+1]=g2; px[i+2]=r2;
          } else if (s<0.14 && l>0.15 && l<0.9) {
            byte r2,g2,b2; HslToRgb(h, s, l*0.75, out r2, out g2, out b2);
            px[i]=b2; px[i+1]=g2; px[i+2]=r2;
          }
        }
      }
      System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      bmp.Save(outPath, ImageFormat.Png);
    }
  }
  public static string Probe(string path) {
    using (var bmp = new Bitmap(path)) {
      var rect = new Rectangle(0,0,bmp.Width,bmp.Height);
      var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
      int stride=data.Stride, w=bmp.Width, hgt=bmp.Height;
      byte[] px = new byte[stride*hgt];
      System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
      bmp.UnlockBits(data);
      long green=0, total=0; double hsum=0; long hcount=0;
      for (int y=0;y<hgt;y+=8) { int row=y*stride;
        for (int x=0;x<w;x+=8) { int i=row+x*3;
          double h,s,l; RgbToHsl(px[i+2],px[i+1],px[i],out h,out s,out l);
          if (s>0.15 && l>0.1 && l<0.95) { total++; hsum+=h; if (h>=75&&h<=175) green++; }
        }
      }
      return string.Format("n={0} meanHue={1:F0} greenLeft={2:P1}", total, hcount==0?0:(hsum/total), (double)green/total);
    }
  }
}
'@
[CanTint]::Recolor('can-green-src.png', 'can-strawberry.jpg', 340, 1.0, 1.0, 0.30, 90)
echo 'can-strawberry.jpg done'
[CanTint]::Recolor('can-green-src.png', 'can-mango.jpg', 32, 1.05, 1.0, 0.30, 90)
echo 'can-mango.jpg done'
[CanTint]::Recolor('can-green-src.png', 'can-blueberry.jpg', 230, 0.9, 0.9, 0.30, 90)
echo 'can-blueberry.jpg done'
[CanTint]::Recolor('can-green-src.png', 'can-chocolate.jpg', 22, 0.9, 0.55, 0.35, 90)
echo 'can-chocolate.jpg done'
[CanTint]::Recolor('can-green-src.png', 'can-lime.jpg', 100, 1.15, 1.0, 0.30, 90)
echo 'can-lime.jpg done'
[CanTint]::DesatGreens('can-green-src.png', 'can-classic.jpg', 0.55, 90)
echo "can-classic.jpg done"
[CanTint]::DesatGreensA('can-green-card-src.png', 'card-classic.png', 0.55)
echo "card-classic.png done"
[CanTint]::RecolorA('can-green-card-src.png', 'card-lime.png', 100, 1.15, 1.0, 0.30)
[CanTint]::RecolorA('can-green-card-src.png', 'card-strawberry.png', 340, 1.0, 1.0, 0.30)
[CanTint]::RecolorA('can-green-card-src.png', 'card-mango.png', 32, 1.05, 1.0, 0.30)
[CanTint]::RecolorA('can-green-card-src.png', 'card-blueberry.png', 230, 0.9, 0.9, 0.30)
[CanTint]::RecolorA('can-green-card-src.png', 'card-chocolate.png', 22, 0.9, 0.55, 0.35)
echo "cards done"
