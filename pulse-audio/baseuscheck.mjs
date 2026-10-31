const urls = [
 'https://www.baseus.com/products/baseus-bowie-ma10-tws-wireless-earbuds.js',
 'https://www.baseus.com/products/baseus-bowie-ma10.js',
 'https://www.baseus.com/products/bowie-ma10.js'
];
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    console.log(u, r.status, (await r.text()).slice(0,200));
  } catch (e) { console.log(u, 'ERR', e.message); }
}
