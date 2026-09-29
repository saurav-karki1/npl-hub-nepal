const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  "https://i.redd.it/tvbpyca6tasd1.jpg",
  "https://i.redd.it/h9nlkea6tasd1.jpg",
  "https://i.redd.it/s5fqpda6tasd1.jpg",
  "https://i.redd.it/oiwzj7d6tasd1.jpg",
  "https://i.redd.it/hg7spca6tasd1.jpg",
  "https://i.redd.it/1qrgoda6tasd1.jpg",
  "https://i.redd.it/b8m8mea6tasd1.jpg",
  "https://i.redd.it/xrvw67d6tasd1.jpg",
  "https://i.redd.it/8g7s3m6uygsd1.png"
];

const destDir = path.join(__dirname, 'scratch_logos');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);

images.forEach((url, i) => {
  const filename = path.join(destDir, `image_${i}_${path.basename(url)}`);
  const file = fs.createWriteStream(filename);
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${url} -> ${filename}, size: ${fs.statSync(filename).size} bytes`);
    });
  }).on('error', (err) => console.error(err));
});
