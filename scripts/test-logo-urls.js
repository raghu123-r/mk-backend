const brands = ['home-essentials', 'premium-cookware', 'modern-chef', 'kitchen-classics', 'bake-master', 'storage-solutions', 'kitchen-tools-co'];

console.log('Testing all brand logo URLs...\n');

Promise.all(
  brands.map(async brand => {
    const url = `https://sbotgymquktdnblvmgon.supabase.co/storage/v1/object/public/product-images/brands/${brand}/logo.png`;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return { brand, status: response.status, ok: response.ok };
    } catch (err) {
      return { brand, status: 'ERROR', ok: false, error: err.message };
    }
  })
).then(results => {
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.brand.padEnd(20)} - HTTP ${r.status}`);
  });
  const successCount = results.filter(r => r.ok).length;
  console.log(`\n📊 Result: ${successCount}/${results.length} logos accessible`);
});
