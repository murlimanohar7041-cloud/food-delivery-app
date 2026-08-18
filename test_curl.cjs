const https = require('https');

https.get('https://script.google.com/macros/s/AKfycbygsQScwr8KPt5HHUhETZnqXxKv58Qizjvgj_pWT5ku6HQCbcg8M32HE_A-MrQc9wPv/exec', (res) => {
  let data = '';
  
  if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
     https.get(res.headers.location, (res2) => {
        res2.on('data', chunk => data += chunk);
        res2.on('end', () => console.log(data.substring(0, 500)));
     });
     return;
  }

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(data.substring(0, 500));
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
