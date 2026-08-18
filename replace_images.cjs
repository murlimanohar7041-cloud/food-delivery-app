const fs = require('fs');

const brokenUrls = {
  "Prosciutto & Arugula": "https://images.unsplash.com/photo-1506280754576-f6fa8a873ce4?w=400&h=400&fit=crop",
  "Hawaiian Bliss": "https://images.unsplash.com/photo-1565299507177-b08beff9ccbd?w=400&h=400&fit=crop",
  "Crispy Fried Chicken": "https://images.unsplash.com/photo-1615887023516-9b6ca5588260?w=400&h=400&fit=crop",
  "Spicy Jalapeno Beef": "https://images.unsplash.com/photo-1594212699903-eca40af73c33?w=400&h=400&fit=crop",
  "BBQ Pulled Pork": "https://images.unsplash.com/photo-1525164286253-04e68b9d9406?w=400&h=400&fit=crop",
  "Iced Caramel Frappe": "https://images.unsplash.com/photo-1572490142747-3d6498a4da05?w=400&h=400&fit=crop",
  "Coconut Water Shake": "https://images.unsplash.com/photo-1523428461295-df5b4eab908e?w=400&h=400&fit=crop",
  "Watermelon Cooler": "https://images.unsplash.com/photo-1587883012610-e3df17d41266?w=400&h=400&fit=crop",
  "Tiramisu Layer Cake": "https://images.unsplash.com/photo-1571115177098-24c42de1bd0f?w=400&h=400&fit=crop",
  "Pistachio Baklava": "https://images.unsplash.com/photo-1510629618588-16cb991e60dc?w=400&h=400&fit=crop",
  "Avocado Veg Roll": "https://images.unsplash.com/photo-1507310464245-e4d6d6ce3e6a?w=400&h=400&fit=crop",
  "Rainbow Sushi Platter": "https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=400&h=400&fit=crop",
  "Tofu Inari Sushi": "https://images.unsplash.com/photo-1607532941433-304659e819b0?w=400&h=400&fit=crop",
  "Classic Cappuccino": "https://images.unsplash.com/photo-1509042239860-ae55217dd95b?w=400&h=400&fit=crop",
  "Mocha Frappuccino": "https://images.unsplash.com/photo-1534685160866-eebbbec8ee6f?w=400&h=400&fit=crop",
  "Hazelnut Cortado": "https://images.unsplash.com/photo-1507133750073-5ca733bb652b?w=400&h=400&fit=crop",
  "Classic Carbonara": "https://images.unsplash.com/photo-1588013273468-315fdc8abc07?w=400&h=400&fit=crop",
  "Penne Arrabbiata": "https://images.unsplash.com/photo-1608897013039-887f214b985c?w=400&h=400&fit=crop",
  "Truffle Mushroom Fettuccine": "https://images.unsplash.com/photo-1645084803975-01e4a2cd3ef3?w=400&h=400&fit=crop",
  "Baja Fish Tacos": "https://images.unsplash.com/photo-1623156346149-d5cac8f29ce2?w=400&h=400&fit=crop",
  "Spicy Mushroom Tacos": "https://images.unsplash.com/photo-1541571216-56be87e6fa18?w=400&h=400&fit=crop",
  "Vanilla Bean Gelato": "https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?w=400&h=400&fit=crop",
  "Dark Chocolate Fudge": "https://images.unsplash.com/photo-1558500645-1af5e7df2ce4?w=400&h=400&fit=crop",
  "Mint Chocolate Chip": "https://images.unsplash.com/photo-1558223612-9c3fdf008c2a?w=400&h=400&fit=crop"
};

let content = fs.readFileSync('src/products.ts', 'utf8');

for (const [name, url] of Object.entries(brokenUrls)) {
  // Generate a search keyword
  const keyword = encodeURIComponent(name.split(' ').pop().toLowerCase()); 
  const newUrl = `https://loremflickr.com/400/400/${keyword},food/all`;
  
  // Actually, to make them consistent so they don't change every load, add a lock
  // wait loremflickr randomizes. We can use a deterministic URL? Yes, `lock=id`.
  const lockId = Math.floor(Math.random() * 90000) + 10000;
  const newUrlWithLock = `https://loremflickr.com/400/400/${keyword},food?lock=${lockId}`;
  
  content = content.replace(url, newUrlWithLock);
}

fs.writeFileSync('src/products.ts', content);
console.log('Replaced broken URLs.');
