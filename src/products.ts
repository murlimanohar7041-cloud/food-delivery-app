export interface Product {
  id: number;
  name: string;
  price: number;
  disc?: number;
  rating: number;
  category: string;
  isVeg: boolean;
  image: string;
}

export const products: Product[] = [
  // PIZZA
  { id: 101, name: 'Truffle Burrata Pizza', price: 499, disc: 15, rating: 4.9, category: 'Pizza', isVeg: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 102, name: 'Classic Pepperoni', price: 349, disc: 10, rating: 4.7, category: 'Pizza', isVeg: false, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 103, name: 'Margherita Fresca', price: 299, disc: 20, rating: 4.5, category: 'Pizza', isVeg: true, image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 104, name: 'BBQ Chicken Pizza', price: 399, disc: 15, rating: 4.6, category: 'Pizza', isVeg: false, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 105, name: 'Spicy Veggie Supreme', price: 349, disc: 12, rating: 4.4, category: 'Pizza', isVeg: true, image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 106, name: 'Four Cheese Delight', price: 450, disc: 20, rating: 4.8, category: 'Pizza', isVeg: true, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 107, name: 'Mushroom & Olive', price: 379, disc: 10, rating: 4.3, category: 'Pizza', isVeg: true, image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 108, name: 'Prosciutto & Arugula', price: 500, disc: 25, rating: 4.9, category: 'Pizza', isVeg: false, image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 109, name: 'Hawaiian Bliss Pizza', price: 320, disc: 15, rating: 4.1, category: 'Pizza', isVeg: false, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 110, name: 'Pesto Chicken Crust', price: 420, disc: 12, rating: 4.6, category: 'Pizza', isVeg: false, image: 'https://images.unsplash.com/photo-1576458088443-04a19bb13da6?auto=format&fit=crop&w=340&h=340&q=75' },

  // BURGERS
  { id: 201, name: 'A5 Wagyu Signature', price: 499, disc: 25, rating: 4.9, category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 202, name: 'Classic Cheeseburger', price: 199, disc: 5, rating: 4.5, category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 203, name: 'Crispy Fried Chicken', price: 249, disc: 18, rating: 4.7, category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 204, name: 'Black Bean Vegan', price: 219, disc: 12, rating: 4.4, category: 'Burgers', isVeg: true, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 205, name: 'Spicy Jalapeno Beef', price: 299, disc: 20, rating: 4.6, category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 206, name: 'Double Smash Patty', price: 349, disc: 15, rating: 4.8, category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 207, name: 'Truffle Mushroom Burger', price: 399, disc: 22, rating: 4.7, category: 'Burgers', isVeg: true, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 208, name: 'BBQ Pulled Pork', price: 379, disc: 10, rating: 4.5, category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 209, name: 'Grilled Paneer Tikka', price: 249, disc: 8, rating: 4.3, category: 'Burgers', isVeg: true, image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 210, name: 'Blue Cheese Bacon', price: 429, disc: 15, rating: 4.6, category: 'Burgers', isVeg: false, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=340&h=340&q=75' },

  // HEALTHY
  { id: 301, name: 'Avocado Quinoa Salad', price: 349, disc: 12, rating: 4.8, category: 'Healthy', isVeg: true, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 302, name: 'Acai Superfruit Bowl', price: 299, disc: 15, rating: 4.7, category: 'Healthy', isVeg: true, image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 303, name: 'Grilled Salmon Platter', price: 499, disc: 20, rating: 4.9, category: 'Healthy', isVeg: false, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 304, name: 'Roasted Veggie Wrap', price: 199, disc: 8, rating: 4.4, category: 'Healthy', isVeg: true, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 305, name: 'Green Detox Smoothie', price: 149, disc: 10, rating: 4.6, category: 'Healthy', isVeg: true, image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 306, name: 'Kale & Peanut Salad', price: 249, disc: 5, rating: 4.3, category: 'Healthy', isVeg: true, image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 307, name: 'Protein Egg Bowl', price: 229, disc: 10, rating: 4.7, category: 'Healthy', isVeg: false, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 308, name: 'Tofu Poke Bowl', price: 379, disc: 15, rating: 4.5, category: 'Healthy', isVeg: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 309, name: 'Greek Chicken Salad', price: 349, disc: 12, rating: 4.8, category: 'Healthy', isVeg: false, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 310, name: 'Chia Seed Pudding', price: 179, disc: 8, rating: 4.4, category: 'Healthy', isVeg: true, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=340&h=340&q=75' },

  // DRINKS
  { id: 401, name: 'Matcha Boba Float', price: 249, disc: 10, rating: 4.8, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 402, name: 'Mango Passion Spritz', price: 199, disc: 15, rating: 4.5, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 403, name: 'Classic Mojito', price: 149, disc: 20, rating: 4.3, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 404, name: 'Berry Lemonade', price: 129, disc: 12, rating: 4.6, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 405, name: 'Iced Caramel Frappe', price: 219, disc: 15, rating: 4.7, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 406, name: 'Fresh Orange Juice', price: 110, disc: 10, rating: 4.2, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 407, name: 'Kombucha Ginger', price: 169, disc: 18, rating: 4.4, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 408, name: 'Coconut Water Shake', price: 159, disc: 12, rating: 4.5, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1524156868115-e696b44983db?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 409, name: 'Pineapple Margarita', price: 299, disc: 25, rating: 4.9, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 410, name: 'Watermelon Cooler', price: 139, disc: 15, rating: 4.7, category: 'Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=340&h=340&q=75' },

  // DESSERTS
  { id: 501, name: 'Dark Choco Lava Cake', price: 249, disc: 20, rating: 4.9, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 502, name: 'New York Cheesecake', price: 349, disc: 15, rating: 4.8, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 503, name: 'Vanilla Bean Gelato', price: 149, disc: 10, rating: 4.5, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 504, name: 'Tiramisu Layer Cake', price: 399, disc: 18, rating: 4.7, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 505, name: 'Macarons Box (6 pcs)', price: 499, disc: 25, rating: 4.6, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 506, name: 'Pistachio Baklava', price: 299, disc: 12, rating: 4.4, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 507, name: 'Strawberry Tart', price: 229, disc: 15, rating: 4.8, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 508, name: 'Hazelnut Brownie', price: 169, disc: 10, rating: 4.6, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 509, name: 'Red Velvet Cupcake', price: 129, disc: 8, rating: 4.3, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 510, name: 'Cream Crème Brûlée', price: 289, disc: 12, rating: 4.7, category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1473256599800-b48c7c88cd7e?auto=format&fit=crop&w=340&h=340&q=75' },

  // SUSHI
  { id: 601, name: 'Dragon Sushi Roll', price: 450, disc: 15, rating: 4.8, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 602, name: 'Spicy Tuna Maki', price: 350, disc: 10, rating: 4.6, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 603, name: 'Salmon Nigiri (4 pcs)', price: 400, disc: 20, rating: 4.9, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 604, name: 'Avocado Veg Roll', price: 250, disc: 12, rating: 4.3, category: 'Sushi', isVeg: true, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 605, name: 'Tempura Prawn Roll', price: 420, disc: 18, rating: 4.7, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 606, name: 'Eel Unagi Roll', price: 480, disc: 15, rating: 4.8, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1558985250-27a406d64cb3?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 607, name: 'California Maki', price: 320, disc: 10, rating: 4.5, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 608, name: 'Rainbow Sushi Platter', price: 500, disc: 25, rating: 4.9, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1628191010210-a59de33e5941?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 609, name: 'Crispy Spider Roll', price: 390, disc: 12, rating: 4.6, category: 'Sushi', isVeg: false, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 610, name: 'Tofu Inari Sushi', price: 220, disc: 8, rating: 4.4, category: 'Sushi', isVeg: true, image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=340&h=340&q=75' },

  // COFFEE
  { id: 701, name: 'Artisanal Cold Brew', price: 229, rating: 4.8, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 702, name: 'Caramel Macchiato', price: 249, rating: 4.7, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 703, name: 'Classic Cappuccino', price: 189, rating: 4.6, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 704, name: 'Nitro Cold Brew', price: 299, rating: 4.9, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 705, name: 'Espresso Double Shot', price: 149, rating: 4.5, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 706, name: 'Iced Vanilla Latte', price: 239, rating: 4.8, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 707, name: 'Mocha Frappuccino', price: 269, rating: 4.7, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 708, name: 'Hazelnut Cortado', price: 199, rating: 4.6, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 709, name: 'Pour Over V60', price: 279, rating: 4.9, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 710, name: 'Affogato Coffee', price: 349, rating: 4.8, category: 'Coffee', isVeg: true, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=340&h=340&q=75' },
  
  // PASTA
  { id: 801, name: 'Classic Carbonara', price: 350, rating: 4.8, category: 'Pasta', isVeg: false, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 802, name: 'Penne Arrabbiata', price: 290, rating: 4.5, category: 'Pasta', isVeg: true, image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 803, name: 'Truffle Mushroom Fettuccine', price: 450, rating: 4.9, category: 'Pasta', isVeg: true, image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 804, name: 'Spaghetti Bolognese', price: 380, rating: 4.7, category: 'Pasta', isVeg: false, image: 'https://images.unsplash.com/photo-1626844131082-256783844137?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 805, name: 'Seafood Linguine', price: 490, rating: 4.8, category: 'Pasta', isVeg: false, image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=340&h=340&q=75' },

  // TACOS
  { id: 901, name: 'Carne Asada Tacos', price: 250, rating: 4.7, category: 'Tacos', isVeg: false, image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 902, name: 'Baja Fish Tacos', price: 300, rating: 4.8, category: 'Tacos', isVeg: false, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 903, name: 'Spicy Mushroom Tacos', price: 220, rating: 4.5, category: 'Tacos', isVeg: true, image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 904, name: 'Al Pastor Tacos', price: 270, rating: 4.9, category: 'Tacos', isVeg: false, image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 905, name: 'Black Bean & Corn Tacos', price: 200, rating: 4.4, category: 'Tacos', isVeg: true, image: 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=340&h=340&q=75' },

  // SALADS
  { id: 1001, name: 'Classic Caesar Salad', price: 250, rating: 4.6, category: 'Salads', isVeg: true, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1002, name: 'Greek Feta Salad', price: 280, rating: 4.7, category: 'Salads', isVeg: true, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1003, name: 'Quinoa & Avocado Bowl', price: 320, rating: 4.9, category: 'Salads', isVeg: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1004, name: 'Grilled Chicken Salad', price: 350, rating: 4.8, category: 'Salads', isVeg: false, image: 'https://images.unsplash.com/photo-1529312266912-b33cfce2eefd?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1005, name: 'Caprese Salad', price: 290, rating: 4.5, category: 'Salads', isVeg: true, image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=340&h=340&q=75' },

  // ICE CREAM
  { id: 1101, name: 'Vanilla Bean Gelato', price: 180, disc: 10, rating: 4.7, category: 'Ice Cream', isVeg: true, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1102, name: 'Dark Chocolate Fudge', price: 220, disc: 15, rating: 4.9, category: 'Ice Cream', isVeg: true, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1103, name: 'Strawberry Swirl', price: 190, disc: 12, rating: 4.6, category: 'Ice Cream', isVeg: true, image: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1104, name: 'Mint Chocolate Chip', price: 210, disc: 8, rating: 4.5, category: 'Ice Cream', isVeg: true, image: 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?auto=format&fit=crop&w=340&h=340&q=75' },
  { id: 1105, name: 'Salted Caramel Crunch', price: 250, disc: 15, rating: 4.8, category: 'Ice Cream', isVeg: true, image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=340&h=340&q=75' }
];

// Reusable function to return products
export const getMixedProducts = (): Product[] => {
  return products;
};
