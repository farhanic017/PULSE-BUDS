const q = process.argv[2];
const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(q) + '&form=HDRSC2&first=1';
const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' }});
const html = await res.text();
const decode = s => s.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const items = [];
for (const m of html.matchAll(/<a[^>]*class="iusc"[^>]*m="([^"]+)"/g)) {
  try { const o = JSON.parse(decode(m[1])); items.push({t:o.t, murl:o.murl, purl:o.purl, w:o.mw, h:o.mh}); } catch {}
}
for (const it of items.slice(0, 20)) console.log([it.w+'x'+it.h, it.murl, it.t].join(' | '));
