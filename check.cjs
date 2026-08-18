const fs = require('fs');
console.log("CWD:", process.cwd());
console.log("Assets:", fs.existsSync('./public') ? fs.readdirSync('./public') : 'No public dir');
if (fs.existsSync('./public/icons')) {
  console.log("Icons:", fs.readdirSync('./public/icons'));
}
