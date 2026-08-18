import { products } from './src/products.js';

async function check() {
  let bad = [];
  for (const p of products) {
    try {
      const res = await fetch(p.image, { method: 'GET' });
      if (res.status !== 200 && res.status !== 302) {
        bad.push({id: p.id, name: p.name, status: res.status});
      }
    } catch(e) {
      bad.push({id: p.id, name: p.name, error: e.message});
    }
  }
  console.log('Bad URLs:', bad);
}
check();
