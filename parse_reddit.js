const fs = require('fs');
const html = fs.readFileSync('C:/Users/TCS/.gemini/antigravity/brain/b6d7825c-191e-4612-bbf9-9c95dd446778/.system_generated/steps/994/content.md', 'utf8');
const urls = html.match(/https:\/\/[^"'<>\s]+(?:\.jpg|\.png|\.webp)[^"'<>\s]*/gi) || [];
const unique = [...new Set(urls.map(u => u.replace(/&amp;/g, '&')))];
console.log(JSON.stringify(unique, null, 2));
