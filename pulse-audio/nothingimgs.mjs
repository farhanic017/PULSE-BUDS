const u='https://nothing.tech/products/ear-a';
const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'}});
const html=await r.text();
const matches=[...html.matchAll(/https:\/\/cdn\.shopify\.com\/s\/files\/1\/0376\/5420\/0459\/files\/[^"'<> ]+?\.(?:png|jpg|webp)[^"'<> ]*/g)].map(m=>m[0]);
const unique=[...new Set(matches)];
console.log(unique.filter(x=>/Ear|ear/.test(x)).slice(0,50).join('\n'));
