const fs = require('fs');
const path = require('path');

// Simple PNG dimension reader
function getPNGDimensions(filepath) {
  const buffer = fs.readFileSync(filepath);

  // PNG signature check
  if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    return null;
  }

  // Read IHDR chunk (bytes 16-24 contain width and height)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  return { width, height };
}

// Check your image
const imagePath = 'src/assets/blog/plan-batch-and-grow-your-social-media.png';

if (fs.existsSync(imagePath)) {
  const dims = getPNGDimensions(imagePath);

  if (dims) {
    console.log('\n📐 Image Dimensions Check\n');
    console.log('File:', imagePath);
    console.log('Width:', dims.width, 'px');
    console.log('Height:', dims.height, 'px');
    console.log('Ratio:', (dims.width / dims.height).toFixed(2), ':1');
    console.log('');

    if (dims.width === 1200 && dims.height === 630) {
      console.log('✅ Perfect! Image is exactly 1200x630px (1.91:1 ratio)');
    } else if (dims.width / dims.height === 1.91) {
      console.log('✅ Ratio is correct (1.91:1)');
      console.log('⚠️  But Twitter prefers exactly 1200x630px');
    } else {
      console.log('❌ WRONG DIMENSIONS');
      console.log('   Twitter requires 1.91:1 ratio (1200x630px)');
      console.log('   Current ratio:', (dims.width / dims.height).toFixed(2), ':1');
      console.log('\n📝 To fix:');
      console.log('   1. Resize image to exactly 1200x630px');
      console.log('   2. Or use an image editor to crop to 1.91:1 ratio');
    }
  } else {
    console.log('❌ Could not read PNG dimensions');
  }
} else {
  console.log('❌ Image not found:', imagePath);
  console.log('   Make sure the image exists in src/assets/blog/');
}
