import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp Vector SVG for Bindsukh Center
const standardSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />

  <!-- Subtle gold border -->
  <rect x="16" y="16" width="480" height="480" rx="88" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.4" />

  <!-- Acupressure / Lotus Meridian Aura -->
  <g transform="translate(256, 230)" filter="url(#glow)">
    <!-- Meridian Ring -->
    <circle r="120" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="8 6" opacity="0.6" />
    <circle r="95" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.2" />

    <!-- Acupressure Energy Points (Meridians) -->
    <circle cx="0" cy="-120" r="8" fill="#fef08a" />
    <circle cx="120" cy="0" r="8" fill="#fef08a" />
    <circle cx="0" cy="120" r="8" fill="#fef08a" />
    <circle cx="-120" cy="0" r="8" fill="#fef08a" />
    <circle cx="85" cy="-85" r="6" fill="#f59e0b" />
    <circle cx="-85" cy="-85" r="6" fill="#f59e0b" />
    <circle cx="85" cy="85" r="6" fill="#f59e0b" />
    <circle cx="-85" cy="85" r="6" fill="#f59e0b" />

    <!-- Center Healing Cross / Energy Touch -->
    <!-- Lotus Petals -->
    <path d="M 0 -80 C 35 -40, 50 -10, 0 35 C -50 -10, -35 -40, 0 -80 Z" fill="url(#goldGrad)" />
    <path d="M -70 -20 C -40 -35, 0 -15, -10 35 C -50 35, -65 10, -70 -20 Z" fill="url(#goldGrad)" opacity="0.9" />
    <path d="M 70 -20 C 40 -35, 0 -15, 10 35 C 50 35, 65 10, 70 -20 Z" fill="url(#goldGrad)" opacity="0.9" />
    <path d="M -50 30 C -25 15, 0 35, -5 65 C -35 60, -45 45, -50 30 Z" fill="url(#goldGrad)" opacity="0.8" />
    <path d="M 50 30 C 25 15, 0 35, 5 65 C 35 60, 45 45, 50 30 Z" fill="url(#goldGrad)" opacity="0.8" />

    <!-- Center Pearl -->
    <circle cx="0" cy="15" r="14" fill="#ffffff" />
    <circle cx="0" cy="15" r="8" fill="#d97706" />
  </g>

  <!-- Title Text: BINDSUKH -->
  <text x="256" y="415" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="34" letter-spacing="4">
    BINDSUKH
  </text>
  <text x="256" y="450" text-anchor="middle" fill="#fef08a" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="18" letter-spacing="2">
    ACUPRESSURE &amp; ACUPUNCTURE
  </text>
</svg>
`;

// Maskable version with 15% safe padding
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>

  <!-- Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Scaled content within 70% safe zone (center 358px) -->
  <g transform="translate(77, 77) scale(0.7)">
    <circle cx="256" cy="230" r="120" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-dasharray="8 6" opacity="0.7" />
    <!-- Meridian Points -->
    <circle cx="256" cy="110" r="10" fill="#fef08a" />
    <circle cx="376" cy="230" r="10" fill="#fef08a" />
    <circle cx="256" cy="350" r="10" fill="#fef08a" />
    <circle cx="136" cy="230" r="10" fill="#fef08a" />

    <!-- Lotus Petals -->
    <g transform="translate(256, 230)">
      <path d="M 0 -80 C 35 -40, 50 -10, 0 35 C -50 -10, -35 -40, 0 -80 Z" fill="url(#goldGrad)" />
      <path d="M -70 -20 C -40 -35, 0 -15, -10 35 C -50 35, -65 10, -70 -20 Z" fill="url(#goldGrad)" opacity="0.9" />
      <path d="M 70 -20 C 40 -35, 0 -15, 10 35 C 50 35, 65 10, 70 -20 Z" fill="url(#goldGrad)" opacity="0.9" />
      <circle cx="0" cy="15" r="16" fill="#ffffff" />
      <circle cx="0" cy="15" r="9" fill="#d97706" />
    </g>

    <text x="256" y="420" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="40" letter-spacing="4">
      BINDSUKH
    </text>
    <text x="256" y="460" text-anchor="middle" fill="#fef08a" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="20" letter-spacing="2">
      ACUPRESSURE CLINIC
    </text>
  </g>
</svg>
`;

async function generate() {
  const stdBuffer = Buffer.from(standardSvg);
  const maskBuffer = Buffer.from(maskableSvg);

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), stdBuffer);

  // 1. 512x512
  await sharp(stdBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 2. 192x192
  await sharp(stdBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 3. Maskable 512x512
  await sharp(maskBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 4. Apple Touch Icon 180x180
  await sharp(stdBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 5. Favicon 48x48
  await sharp(stdBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('All PWA assets created successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
