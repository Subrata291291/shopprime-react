const url = 'https://zyraluxe.in/wp-json/wc/v3/products?consumer_key=ck_1ac0d8e632ce5c97f23ed1fc22c0788dc49dc5b0&consumer_secret=cs_574d67194f3be8e1081d7d726a0f8b5c3d3d1493';

(async () => {
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (Array.isArray(json)) {
      console.log('COUNT:' + json.length);
      console.log(JSON.stringify(json.slice(0,3), null, 2));
    } else {
      console.log('RESPONSE:', JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
  }
})();
