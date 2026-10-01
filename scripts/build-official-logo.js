import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const distDir = path.resolve('dist');

// High precision vector representation of the official clinic emblem
const officialLogoSvg = `
<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients -->
    <radialGradient id="greenCenterGrad" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#05b85a" />
      <stop offset="70%" stop-color="#028d43" />
      <stop offset="100%" stop-color="#016630" />
    </radialGradient>

    <linearGradient id="yellowBandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff033" />
      <stop offset="50%" stop-color="#ffd500" />
      <stop offset="100%" stop-color="#ffbf00" />
    </linearGradient>

    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f02424" />
      <stop offset="40%" stop-color="#cc0a12" />
      <stop offset="100%" stop-color="#8f0006" />
    </linearGradient>

    <linearGradient id="ribbonTailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#990008" />
      <stop offset="50%" stop-color="#c40b15" />
      <stop offset="100%" stop-color="#e81e28" />
    </linearGradient>

    <linearGradient id="goldEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe600" />
      <stop offset="50%" stop-color="#fff8b3" />
      <stop offset="100%" stop-color="#ffcc00" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadowFilter" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.45"/>
    </filter>

    <filter id="bannerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.55"/>
    </filter>

    <!-- Arched Text Path for Top Banner Hindi: बिंदसुख एक्यूप्रेशर & एक्यूपंक्चर -->
    <!-- Center (300, 260), Radius ~180 -->
    <path id="topTextArc" d="M 100 270 A 200 200 0 0 1 500 270" fill="none" />
  </defs>

  <!-- Scaled & Centered Emblem Group ensuring full visibility in both circular and square frames -->
  <g transform="translate(300, 300) scale(0.92) translate(-300, -304)">
  <!-- 1. Outer Frame Circles -->
  <!-- Outer black/dark rim -->
  <circle cx="300" cy="270" r="260" fill="#000000" />
  <!-- Outer neon green ring -->
  <circle cx="300" cy="270" r="252" fill="none" stroke="#00e659" stroke-width="6" />
  <!-- Outer red ring -->
  <circle cx="300" cy="270" r="246" fill="none" stroke="#e60000" stroke-width="7" />
  <!-- Outer deep green ring -->
  <circle cx="300" cy="270" r="239" fill="none" stroke="#00802b" stroke-width="4" />

  <!-- 2. Main Yellow Ring Band -->
  <circle cx="300" cy="270" r="236" fill="url(#yellowBandGrad)" stroke="#c40000" stroke-width="3" />

  <!-- Inner border of Yellow Band -->
  <circle cx="300" cy="270" r="160" fill="none" stroke="#e60000" stroke-width="5" />
  <circle cx="300" cy="270" r="155" fill="none" stroke="#009933" stroke-width="3" />

  <!-- 3. Arched Blue Hindi Text: बिंदसुख एक्यूप्रेशर & एक्यूपंक्चर -->
  <text font-family="'Noto Sans Devanagari', 'Mangal', 'Plus Jakarta Sans', system-ui, sans-serif"
        font-weight="900" font-size="37" fill="#002b80" letter-spacing="0.5px">
    <textPath href="#topTextArc" startOffset="50%" text-anchor="middle">
      बिंदसुख एक्यूप्रेशर &amp; एक्यूपंक्चर
    </textPath>
  </text>

  <!-- Side Red Stars on the Yellow Band -->
  <!-- Left Star -->
  <polygon points="122,260 128,276 145,276 131,286 136,302 122,292 108,302 113,286 99,276 116,276" fill="#e60000" stroke="#990000" stroke-width="1.5" />
  <!-- Right Star -->
  <polygon points="478,260 484,276 501,276 487,286 492,302 478,292 464,302 469,286 455,276 472,276" fill="#e60000" stroke="#990000" stroke-width="1.5" />

  <!-- 4. Inner Emerald Green Disc -->
  <circle cx="300" cy="270" r="153" fill="url(#greenCenterGrad)" />

  <!-- 5. Central Hands & Anatomical Heart Artwork -->
  <g transform="translate(300, 255) scale(0.92)" filter="url(#shadowFilter)">
    <!-- Heart Great Vessels (Aorta & Pulmonary Artery) -->
    <!-- Blue Pulmonary trunk & Vena Cava -->
    <path d="M -22 -65 C -25 -95, 0 -115, 8 -118 C 15 -110, 15 -85, 2 -65 Z" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="2" />
    <path d="M -35 -40 C -45 -70, -25 -90, -18 -88 C -12 -75, -15 -55, -25 -40 Z" fill="#2563eb" stroke="#1e40af" stroke-width="2" />
    <circle cx="8" cy="-115" r="9" fill="#1e40af" />
    <circle cx="-20" cy="-85" r="7" fill="#1d4ed8" />

    <!-- Red Aortic Arch with 3 branches -->
    <path d="M -8 -60 C -10 -110, 35 -125, 45 -85 C 50 -70, 35 -45, 20 -40 Z" fill="#dc2626" stroke="#991b1b" stroke-width="2.5" />
    <!-- 3 branch arteries -->
    <rect x="5" y="-126" width="7" height="18" rx="3.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.5" />
    <rect x="18" y="-130" width="7" height="20" rx="3.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.5" />
    <rect x="32" y="-123" width="7" height="16" rx="3.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.5" />

    <!-- Heart Muscular Body / Ventricles -->
    <!-- Base Red Muscle Mass -->
    <path d="M 0 -45 
             C 45 -55, 75 -25, 60 20 
             C 50 55, 20 85, 0 102 
             C -20 85, -50 55, -60 20 
             C -75 -25, -45 -55, 0 -45 Z" 
          fill="#b91c1c" stroke="#7f1d1d" stroke-width="3" />

    <!-- Left & Right Atrium fat pads (Yellowish/pink tissue) -->
    <path d="M -48 -25 C -55 -15, -45 10, -35 15 C -25 20, -30 -15, -48 -25 Z" fill="#fb7185" opacity="0.85" />
    <path d="M 48 -25 C 55 -15, 45 10, 35 15 C 25 20, 30 -15, 48 -25 Z" fill="#fb7185" opacity="0.85" />

    <!-- Coronary blood vessels (Branching red & blue arteries) -->
    <!-- Anterior interventricular sulcus -->
    <path d="M 5 -35 Q 0 15, -8 45 T -5 90" fill="none" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
    <path d="M 2 -35 Q -3 15, -11 45 T -8 90" fill="none" stroke="#3b82f6" stroke-width="3.5" stroke-linecap="round" />
    <!-- Branching capillaries -->
    <path d="M -3 10 Q -25 0, -42 15" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" />
    <path d="M -7 35 Q -28 30, -38 48" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" />
    <path d="M 0 5 Q 25 -5, 45 12" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" />
    <path d="M -2 28 Q 22 25, 38 42" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" />
    <path d="M -5 55 Q 15 58, 25 72" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" />

    <!-- Cupped Healing Hands embracing the Heart -->
    <!-- Left Hand -->
    <g transform="translate(-5, 0)">
      <!-- Left Wrist & Palm Base -->
      <path d="M -90 120 C -75 90, -70 50, -65 20 C -60 -5, -45 -40, -68 -60 C -78 -68, -88 -60, -92 -45 C -96 -30, -95 10, -100 45 C -105 75, -115 110, -90 120 Z" 
            fill="#e59866" stroke="#ba6a38" stroke-width="3" />
      <!-- Left Fingers curling inward -->
      <!-- Index -->
      <path d="M -70 -50 C -65 -80, -50 -105, -35 -100 C -22 -95, -30 -65, -48 -45 Z" fill="#f0ad7e" stroke="#ba6a38" stroke-width="2.5" />
      <!-- Middle -->
      <path d="M -82 -35 C -80 -75, -60 -115, -45 -110 C -35 -105, -45 -70, -60 -30 Z" fill="#ebb189" stroke="#ba6a38" stroke-width="2.5" />
      <!-- Ring -->
      <path d="M -92 -15 C -95 -55, -80 -95, -68 -90 C -58 -85, -68 -50, -78 -10 Z" fill="#f0ad7e" stroke="#ba6a38" stroke-width="2.5" />
      <!-- Little finger -->
      <path d="M -98 5 C -105 -30, -95 -65, -85 -60 C -78 -55, -85 -25, -88 10 Z" fill="#e59866" stroke="#ba6a38" stroke-width="2.5" />
      <!-- Thumb cradling side of heart -->
      <path d="M -40 20 C -20 15, -15 -15, -28 -22 C -38 -28, -50 -10, -40 20 Z" fill="#f5b88f" stroke="#ba6a38" stroke-width="2" />
    </g>

    <!-- Right Hand -->
    <g transform="translate(5, 0) scale(-1, 1)">
      <!-- Right Wrist & Palm Base -->
      <path d="M -90 120 C -75 90, -70 50, -65 20 C -60 -5, -45 -40, -68 -60 C -78 -68, -88 -60, -92 -45 C -96 -30, -95 10, -100 45 C -105 75, -115 110, -90 120 Z" 
            fill="#e59866" stroke="#ba6a38" stroke-width="3" />
      <!-- Right Fingers -->
      <path d="M -70 -50 C -65 -80, -50 -105, -35 -100 C -22 -95, -30 -65, -48 -45 Z" fill="#f0ad7e" stroke="#ba6a38" stroke-width="2.5" />
      <path d="M -82 -35 C -80 -75, -60 -115, -45 -110 C -35 -105, -45 -70, -60 -30 Z" fill="#ebb189" stroke="#ba6a38" stroke-width="2.5" />
      <path d="M -92 -15 C -95 -55, -80 -95, -68 -90 C -58 -85, -68 -50, -78 -10 Z" fill="#f0ad7e" stroke="#ba6a38" stroke-width="2.5" />
      <path d="M -98 5 C -105 -30, -95 -65, -85 -60 C -78 -55, -85 -25, -88 10 Z" fill="#e59866" stroke="#ba6a38" stroke-width="2.5" />
      <path d="M -40 20 C -20 15, -15 -15, -28 -22 C -38 -28, -50 -10, -40 20 Z" fill="#f5b88f" stroke="#ba6a38" stroke-width="2" />
    </g>
  </g>

  <!-- 6. Ribbon Banner at the Bottom -->
  <g transform="translate(0, 10)" filter="url(#bannerShadow)">
    <!-- Left Ribbon Tail / Fold -->
    <path d="M 28 470 L 105 408 L 138 450 L 72 498 L 28 470 Z" fill="#7a0005" stroke="#ffe600" stroke-width="2" />
    <path d="M 8 478 L 90 405 L 108 425 L 45 505 L 8 478 Z" fill="url(#ribbonTailGrad)" stroke="#ffe600" stroke-width="2.5" />
    <polygon points="8,478 48,460 45,505" fill="#4d0003" />

    <!-- Right Ribbon Tail / Fold -->
    <path d="M 572 470 L 495 408 L 462 450 L 528 498 L 572 470 Z" fill="#7a0005" stroke="#ffe600" stroke-width="2" />
    <path d="M 592 478 L 510 405 L 492 425 L 555 505 L 592 478 Z" fill="url(#ribbonTailGrad)" stroke="#ffe600" stroke-width="2.5" />
    <polygon points="592,478 552,460 555,505" fill="#4d0003" />

    <!-- Left & Right 3D Ribbon Rolls -->
    <ellipse cx="120" cy="450" rx="42" ry="24" fill="#fff5cc" stroke="#d90000" stroke-width="4" />
    <ellipse cx="120" cy="450" rx="36" ry="18" fill="#ffeaa7" />
    <ellipse cx="480" cy="450" rx="42" ry="24" fill="#fff5cc" stroke="#d90000" stroke-width="4" />
    <ellipse cx="480" cy="450" rx="36" ry="18" fill="#ffeaa7" />

    <!-- Upper Central Banner: "क्लीनिक" Tab -->
    <path d="M 220 448 C 240 435, 360 435, 380 448 L 372 485 C 350 475, 250 475, 228 485 Z" 
          fill="#ffea00" stroke="#cc0000" stroke-width="3" />
    <text x="300" y="470" 
          text-anchor="middle" 
          font-family="'Noto Sans Devanagari', 'Mangal', system-ui, sans-serif" 
          font-weight="900" 
          font-size="30" 
          fill="#002b80" 
          letter-spacing="1px">
      क्लीनिक
    </text>

    <!-- Main Front Arched Ribbon -->
    <path d="M 68 498 
             C 180 540, 420 540, 532 498 
             L 522 558 
             C 410 598, 190 598, 78 558 
             Z" 
          fill="url(#ribbonGrad)" 
          stroke="url(#goldEdgeGrad)" 
          stroke-width="4" />

    <!-- Ribbon Trim Highlights -->
    <path d="M 80 508 C 190 546, 410 546, 520 508" fill="none" stroke="#ffeb3b" stroke-width="2" opacity="0.8" />
    <path d="M 90 550 C 200 586, 400 586, 510 550" fill="none" stroke="#ffeb3b" stroke-width="2" opacity="0.8" />

    <!-- Left Yellow Star on Ribbon -->
    <polygon points="120,530 126,543 140,543 129,551 133,564 120,556 107,564 111,551 100,543 114,543" fill="#ffe600" stroke="#990000" stroke-width="1.5" />

    <!-- Main Banner Text: बिंदसुख क्लीनिक -->
    <text x="300" y="555" 
          text-anchor="middle" 
          font-family="'Noto Sans Devanagari', 'Mangal', 'Plus Jakarta Sans', system-ui, sans-serif" 
          font-weight="900" 
          font-size="42" 
          fill="#ffffff" 
          letter-spacing="1.5px"
          stroke="#5e0004"
          stroke-width="1.5"
          paint-order="stroke fill">
      बिंदसुख क्लीनिक
    </text>

    <!-- Right Yellow Star on Ribbon -->
    <polygon points="480,530 486,543 500,543 489,551 493,564 480,556 467,564 471,551 460,543 474,543" fill="#ffe600" stroke="#990000" stroke-width="1.5" />
  </g>
  </g>
</svg>
`;

async function run() {
  console.log('Rendering official clinic logo...');
  const svgBuffer = Buffer.from(officialLogoSvg);

  // Write SVG source
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgBuffer);
  fs.writeFileSync(path.join(publicDir, 'clinic-logo.svg'), svgBuffer);

  // 1. High-Res PNG (600x600)
  await sharp(svgBuffer).resize(600, 600).png().toFile(path.join(publicDir, 'clinic-logo.png'));
  console.log('✓ Created public/clinic-logo.png (600x600)');

  // 2. PWA 512x512
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created public/pwa-512x512.png');

  // 3. PWA Maskable 512x512 with safe margin
  await sharp(svgBuffer)
    .resize(440, 440)
    .extend({
      top: 36,
      bottom: 36,
      left: 36,
      right: 36,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created public/pwa-maskable-512x512.png');

  // 4. PWA 192x192
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created public/pwa-192x192.png');

  // 5. Apple Touch Icon 180x180
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png');

  // 6. Favicon 48x48
  await sharp(svgBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created public/favicon.png');

  // Also copy to dist if dist exists
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(path.join(publicDir, 'clinic-logo.png'), path.join(distDir, 'clinic-logo.png'));
    fs.copyFileSync(path.join(publicDir, 'pwa-512x512.png'), path.join(distDir, 'pwa-512x512.png'));
    fs.copyFileSync(path.join(publicDir, 'pwa-192x192.png'), path.join(distDir, 'pwa-192x192.png'));
    fs.copyFileSync(path.join(publicDir, 'apple-touch-icon.png'), path.join(distDir, 'apple-touch-icon.png'));
    fs.copyFileSync(path.join(publicDir, 'favicon.png'), path.join(distDir, 'favicon.png'));
    fs.copyFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), path.join(distDir, 'pwa-maskable-512x512.png'));
    fs.copyFileSync(path.join(publicDir, 'icon.svg'), path.join(distDir, 'icon.svg'));
    console.log('✓ Copied new logo assets to dist/');
  }

  console.log('All official clinic logo assets generated successfully!');
}

run().catch((err) => {
  console.error('Error generating logo:', err);
  process.exit(1);
});
