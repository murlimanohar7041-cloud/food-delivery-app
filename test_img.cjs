const fs = require('fs');
const https = require('https');

const content = fs.readFileSync('src/products.ts', 'utf8');
const regex = /image:\s*'([^']+)'/g;
let match;
const urlToProduct = {}

while ((match = regex.exec(content)) !== null) {
  const line = content.substring(0, match.index).split('\n').length;
  // find product name on same line
  const lineStr = content.split('\n')[line-1];
  const nameMatch = lineStr.match(/name:\s*'([^']+)'/);
  const name = nameMatch ? nameMatch[1] : 'Unknown';
  
  if (!urlToProduct[match[1]]) {
    urlToProduct[match[1]] = name;
  }
}

const uniqueUrls = Object.keys(urlToProduct);

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 3000 }, (res) => {
      if (res.statusCode !== 200 && res.statusCode !== 301 && res.statusCode !== 302 && res.statusCode !== 308) {
        resolve({url, status: res.statusCode, name: urlToProduct[url]});
      } else {
        resolve(null);
      }
    });
    
    req.on('error', () => resolve({url, status: 'error', name: urlToProduct[url]}));
    req.on('timeout', () => { req.destroy(); resolve({url, status: 'timeout', name: urlToProduct[url]}); });
    req.end();
  });
}

async function main() {
  console.log("Checking " + uniqueUrls.length + " URLs...");
  const results = [];
  for(let i = 0; i < uniqueUrls.length; i+=20) {
    const chunk = uniqueUrls.slice(i, i+20);
    const chunkResults = await Promise.all(chunk.map(checkUrl));
    results.push(...chunkResults.filter(Boolean));
  }
  console.log("Broken URLs:");
  results.forEach(r => console.log(`${r.name} - ${r.status}: ${r.url}`));
}
main();
