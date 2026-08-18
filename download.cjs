const fs = require('fs');

const urls = {
  phonepe: 'https://play-lh.googleusercontent.com/6iyA2zVz5PyyFATx13m701Ueozi-ZzCA21i-z1i6q6gL41K1R54z_P9O-LzHjK_kHw=w240-h240-rw',
  gpay: 'https://play-lh.googleusercontent.com/HArtbyi53u0jnqhnnxkQnMx9dHOERNcprZyKnInd2nrfM7Wd9ivMNTiz7qXiI-wsTcQ=w240-h240-rw',
  paytm: 'https://play-lh.googleusercontent.com/6_Qan3RBgpJUj0C2cq4t_eSh7pgx8E1EwXw1q2wK4O6fL6n5VqD9-U4dOEDcW4P-1g=w240-h240-rw',
  navi: 'https://play-lh.googleusercontent.com/IowXngWzyC9c-L9E-758lGf_N2zS_U0l333dI5-L4M5eT1Ww542g0I8_b8CDBcK0bDI=w240-h240-rw'
};

async function download() {
  if (!fs.existsSync('./public/icons')) fs.mkdirSync('./public/icons', { recursive: true });
  for (const [name, url] of Object.entries(urls)) {
    console.log(`Downloading ${name}...`);
    try {
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(`./public/icons/${name}.png`, buffer);
      console.log(`Successfully downloaded ${name}.png`);
    } catch(err) { 
      console.error(`Failed to download ${name}:`, err); 
    }
  }
}
download();
