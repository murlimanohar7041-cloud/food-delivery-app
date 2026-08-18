const fs = require('fs');
fs.mkdirSync('./src/assets/icons', { recursive: true });
fs.renameSync('./public/icons/phonepe.png', './src/assets/icons/phonepe.png');
fs.renameSync('./public/icons/gpay.png', './src/assets/icons/gpay.png');
fs.renameSync('./public/icons/paytm.png', './src/assets/icons/paytm.png');
fs.renameSync('./public/icons/navi.png', './src/assets/icons/navi.png');
console.log("Moved files securely to src/assets/icons");
