const sharp = require('sharp');
const path = require('path');

async function resizeImage() {
  const input = 'src/assets/blog/plan-batch-and-grow-your-social-media.png';
  const output = 'src/assets/blog/plan-batch-and-grow-your-social-media-resized.png';

  try {
    await sharp(input)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(output);

    console.log('✅ Image resized to 1200x630px');
    console.log('   Output:', output);
    console.log('   Now update your blog post frontmatter to use the resized image:');
    console.log('   image: /assets/blog/plan-batch-and-grow-your-social-media-resized.png');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resizeImage();
