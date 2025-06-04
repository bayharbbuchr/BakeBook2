// This script requires Node.js and Canvas to be installed
// Run: node generate-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Define icon sizes
const sizes = [192, 512];

// Generate icons
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Draw a simple logo (you can replace this with your actual logo)
  ctx.fillStyle = '#000000';
  const padding = size * 0.2;
  const logoSize = size - (padding * 2);
  
  // Draw a simple shape (replace with your logo)
  ctx.beginPath();
  ctx.moveTo(size / 2, padding);
  ctx.lineTo(size - padding, size / 2);
  ctx.lineTo(size / 2, size - padding);
  ctx.lineTo(padding, size / 2);
  ctx.closePath();
  ctx.fill();
  
  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, `pwa-${size}x${size}.png`), buffer);
  console.log(`Generated pwa-${size}x${size}.png`);
});

console.log('Icons generated successfully!');
