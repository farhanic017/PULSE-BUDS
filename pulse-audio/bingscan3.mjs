const queries = [
  'HOCO EW75 true wireless earbuds png transparent',
  'Baseus Bowie MA10 png transparent render',
  'Sennheiser Momentum 4 Wireless png transparent official'
];
const decode = s => s.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
for (const q of queries) {
  const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(q) + '&form=HDRSC2&first=1';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' }});
  const html = await res.text();
  const items = [];
  for (const m of html.matchAll(/<a[^>]*class="iusc"[^>]*m="([^"]+)"/g)) {
    try { const o = JSON.parse(decode(m[1])); if (o.murl) items.push(o); } catch {}
  }
  console.log('\n### ' + q);
  for (const it of items.slice(0, 12)) console.log(it.murl);
}
