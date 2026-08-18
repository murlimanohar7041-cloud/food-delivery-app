import { products } from './src/products.js';

let images = new Map();
let repeats = [];
for (const p of products) {
  if (images.has(p.image)) {
    repeats.push({ name: p.name, image: p.image, dupOf: images.get(p.image).name });
  } else {
    images.set(p.image, p);
  }
}

console.log('Repeated Images:');
console.dir(repeats, { depth: null });
