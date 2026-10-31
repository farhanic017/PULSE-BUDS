$port = 8000
$root = "C:\Users\Farhan\Documents\Default Project"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
} catch {
    Write-Host "Failed to start on port $port : $_"
    exit 1
}
Write-Host "Serving $root at http://localhost:$port/ (Ctrl+C to stop)"
$mimes = @{
    ".html" = "text/html";
    ".htm"  = "text/html";
    ".js"   = "application/javascript";
    ".css"  = "text/css";
    ".json" = "application/json";
    ".png"  = "image/png";
    ".webp" = "image/webp";
    ".jpg"  = "image/jpeg";
    ".jpeg" = "image/jpeg";
    ".gif"  = "image/gif";
    ".svg"  = "image/svg+xml";
    ".glb"  = "model/gltf-binary";
    ".gltf" = "model/gltf+json";
    ".ico"  = "image/x-icon";
    ".woff" = "font/woff";
    ".woff2"= "font/woff2"
}
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    try {
        $path = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
        $full = Join-Path $root $path
        if ((Test-Path $full -PathType Container)) { $full = Join-Path $full "index.html" }
        if (Test-Path $full -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($full).ToLower()
            $ct = $mimes[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($full)
            $res.ContentType = $ct
            if ($ext -eq '.html' -or $ext -eq '.htm') {
                $res.Headers.Add('Cache-Control', 'no-store')
                $res.Headers.Add('Pragma', 'no-cache')
            } else {
                $res.Headers.Add('Cache-Control', 'public, max-age=86400')
            }
            $res.ContentLength64 = $bytes.Length
            $res.StatusCode = 200
            if ($req.HttpMethod -ne 'HEAD') {
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $msg = "404 Not Found: $path"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $res.StatusCode = 404
            $res.ContentType = "text/plain"
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        }
    } catch {
        try { $res.StatusCode = 500 } catch {}
    } finally {
        $res.OutputStream.Close()
    }
    Write-Host "$($req.HttpMethod) $($req.Url.LocalPath) -> $($res.StatusCode)"
}
