const fallbackFoodImages = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586816001966-79b736744398?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1484723091792-c6436d146afb?w=400&h=400&fit=crop'
];

export const getFallbackImage = (id?: number | string) => {
  let numId = 0;
  if (typeof id === 'number' && !isNaN(id)) {
    // Better hash for 101, 201, etc.
    numId = id * 137; // prime number multiplier to distribute values
  } else if (typeof id === 'string') {
    numId = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  } else {
    numId = Math.floor(Math.random() * fallbackFoodImages.length);
  }
  return fallbackFoodImages[numId % fallbackFoodImages.length];
};
