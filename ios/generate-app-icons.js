const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/*
  iOS App Icon Generator

  Usage:
  1. Place a 1024x1024 PNG image named 'app-icon.png' in the ios/ directory
  2. Run: node generate-app-icons.js
  3. All required iOS icon sizes will be generated in AppIcon.appiconset/

  To generate new app icons:
  - Use AI image generation or create a 1024x1024 PNG
  - Save as ios/app-icon.png
  - Run this script
*/

const iconSizes = [
  { name: 'Icon-60@2x.png', size: 120 },
  { name: 'Icon-60@3x.png', size: 180 },
  { name: 'Icon-76.png', size: 76 },
  { name: 'Icon-76@2x.png', size: 152 },
  { name: 'Icon-83.5@2x.png', size: 167 },
  { name: 'Icon-1024.png', size: 1024 }
];

const sourceImage = path.join(__dirname, 'app-icon.png');
const outputDir = path.join(__dirname, 'ColoringBook/ColoringBook/Assets.xcassets/AppIcon.appiconset');

async function generateIcons() {
  console.log('🎨 Generating iOS app icons...');
  
  for (const icon of iconSizes) {
    try {
      await sharp(sourceImage)
        .resize(icon.size, icon.size)
        .png()
        .toFile(path.join(outputDir, icon.name));
      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.name}:`, error);
    }
  }
  
  console.log('🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);