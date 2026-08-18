import fetch from 'node-fetch';

async function unsplash(q) {
  const r = await fetch('https://unsplash.com/napi/search/photos?query=' + encodeURIComponent(q));
  const j = await r.json() as any;
  const res = j.results[0];
  if(res) return `https://images.unsplash.com/photo-${res.id}?w=400&h=400&fit=crop`;
  return null;
}

const reqs = [
  {id: 109, q: 'pizza'},
  {id: 206, q: 'smash burger'},
  {id: 405, q: 'iced caramel frappe'},
  {id: 410, q: 'watermelon drink'},
  {id: 504, q: 'tiramisu'},
  {id: 506, q: 'baklava'},
  {id: 604, q: 'avocado sushi'},
  {id: 610, q: 'inari sushi'},
  {id: 707, q: 'mocha frappuccino'},
  {id: 710, q: 'affogato'},
  {id: 1103, q: 'strawberry ice cream'}
];

async function run() {
  console.log("const newUrls = {");
  for(const i of reqs) {
      console.log(`  ${i.id}: '${await unsplash(i.q)}',`);
  }
  console.log("};");
}
run();
