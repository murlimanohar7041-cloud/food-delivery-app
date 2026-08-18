import * as fs from 'fs';
import * as path from 'path';

const toReplace = [
  { id: 109, prompt: 'Hawaiian Bliss Pizza food photography' },
  { id: 206, prompt: 'Double Smash Patty Burger food photography' },
  { id: 405, prompt: 'Iced Caramel Frappe drink photography' },
  { id: 410, prompt: 'Watermelon Cooler drink photography' },
  { id: 504, prompt: 'Tiramisu Layer Cake dessert food photography' },
  { id: 506, prompt: 'Pistachio Baklava dessert food photography' },
  { id: 604, prompt: 'Avocado Veg Sushi Roll food photography' },
  { id: 610, prompt: 'Tofu Inari Sushi food photography' },
  { id: 707, prompt: 'Mocha Frappuccino coffee drink photography' },
  { id: 710, prompt: 'Affogato Coffee cup photography' },
  { id: 1103, prompt: 'Strawberry Swirl ice cream food photography' }
];

const productsPath = path.join(process.cwd(), 'src', 'products.ts');
let content = fs.readFileSync(productsPath, 'utf8');

const regex = /{ id: (\d+),.*image: '([^']+)'/g;

content = content.replace(regex, (match, idStr, existingUrl) => {
  const id = parseInt(idStr, 10);
  const rep = toReplace.find(r => r.id === id);
  if (rep) {
    const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(rep.prompt)}`;
    console.log(`Replacing ID ${id} with ${newUrl}`);
    return match.replace(`image: '${existingUrl}'`, `image: '${newUrl}'`);
  }
  return match;
});

fs.writeFileSync(productsPath, content);
console.log('Replacements completed.');
