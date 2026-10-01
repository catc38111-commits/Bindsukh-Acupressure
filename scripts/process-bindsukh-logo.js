import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processOfficialLogo() {
  const inputLogo = path.resolve('public/bindsukh-logo.png');
  if (!fs.existsSync(inputLogo)) {
    console.error('Source logo does not exist:', inputLogo);
    process.exit(1);
  }

  console.log('Processing official circular logo emblem from:', inputLogo);

  // 1. High resolution 512x512 main logo PNG
  await sharp(inputLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 6, g: 78, b: 59, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.resolve('public/bindsukh-logo-clean.png'));

  // Replace original with crisp PNG
  fs.copyFileSync(path.resolve('public/bindsukh-logo-clean.png'), path.resolve('public/bindsukh-logo.png'));
  fs.copyFileSync(path.resolve('public/bindsukh-logo-clean.png'), path.resolve('public/clinic-logo.png'));
  fs.unlinkSync(path.resolve('public/bindsukh-logo-clean.png'));

  // 2. PWA 512x512
  await sharp(path.resolve('public/bindsukh-logo.png'))
    .resize(512, 512, { fit: 'contain', background: { r: 6, g: 78, b: 59, alpha: 1 } })
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));

  // 3. PWA 192x192
  await sharp(path.resolve('public/bindsukh-logo.png'))
    .resize(192, 192, { fit: 'contain', background: { r: 6, g: 78, b: 59, alpha: 1 } })
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));

  // 4. PWA Maskable 512x512 with safe margin
  await sharp(path.resolve('public/bindsukh-logo.png'))
    .resize(410, 410, { fit: 'contain' })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 6, g: 78, b: 59, alpha: 1 }
    })
    .png()
    .toFile(path.resolve('public/pwa-maskable-512x512.png'));

  // 5. Apple touch icon 180x180
  await sharp(path.resolve('public/bindsukh-logo.png'))
    .resize(180, 180, { fit: 'contain', background: { r: 6, g: 78, b: 59, alpha: 1 } })
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));

  // 6. Favicon 64x64
  await sharp(path.resolve('public/bindsukh-logo.png'))
    .resize(64, 64, { fit: 'contain', background: { r: 6, g: 78, b: 59, alpha: 0 } })
    .png()
    .toFile(path.resolve('public/favicon.png'));

  console.log('Successfully generated official Bindsukh emblem icons!');
}

processOfficialLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
