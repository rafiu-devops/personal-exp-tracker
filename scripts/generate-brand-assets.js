const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const appDir = path.join(__dirname, '..', 'app');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Expencir Swirl Emblem SVG Generator
 * 180-degree rotational symmetry matching reference image (image_2.png):
 * - Main S-swoosh upper: loops from top-right down into center S-curve
 * - Crescent 1: top outer swoosh
 * - Crescent 2: top mid swoosh
 * - Lower half: 180° exact rotation of upper half
 */

const upperMainS = `M 780 260
  C 860 380 830 520 730 620
  C 640 710 520 730 430 660
  C 380 620 370 550 420 520
  C 480 480 570 510 630 460
  C 700 400 710 310 650 240
  C 690 220 740 230 780 260 Z`;

// High-precision smooth vector paths for 1000x1000 viewport
function getEmblemPaths() {
  // 6 swooshes forming the Expencir swirl emblem with uniform gaps and smooth curves
  return `
    <!-- Top-Right Main Swoosh curving down into center -->
    <path d="M 520 120 
             C 680 120 820 220 860 380 
             C 880 460 850 560 780 630 
             C 710 700 600 730 510 680 
             C 450 645 420 575 460 520 
             C 500 465 570 470 630 430 
             C 710 380 730 280 650 200 
             C 610 160 560 135 520 120 Z" />

    <!-- Top Outer Swoosh (Crescent 1) -->
    <path d="M 240 240 
             C 330 150 450 90 580 90 
             C 500 135 420 190 360 260 
             C 300 330 270 410 280 500 
             C 240 440 225 340 240 240 Z" />

    <!-- Top Mid Swoosh (Crescent 2) -->
    <path d="M 380 340 
             C 440 280 520 240 610 230 
             C 550 270 500 320 460 380 
             C 420 440 400 500 410 570 
             C 380 515 370 420 380 340 Z" />

    <!-- 180-degree Rotated Lower Half -->
    <g transform="rotate(180 500 500)">
      <path d="M 520 120 
               C 680 120 820 220 860 380 
               C 880 460 850 560 780 630 
               C 710 700 600 730 510 680 
               C 450 645 420 575 460 520 
               C 500 465 570 470 630 430 
               C 710 380 730 280 650 200 
               C 610 160 560 135 520 120 Z" />

      <path d="M 240 240 
               C 330 150 450 90 580 90 
               C 500 135 420 190 360 260 
               C 300 330 270 410 280 500 
               C 240 440 225 340 240 240 Z" />

      <path d="M 380 340 
               C 440 280 520 240 610 230 
               C 550 270 500 320 460 380 
               C 420 440 400 500 410 570 
               C 380 515 370 420 380 340 Z" />
    </g>
  `;
}

// Standard SVG definitions with proper gradients matching Expencir indigo palette (#6366F1, #4F46E5)
function createEmblemSvg(fillColor = "url(#expencirGrad)", size = 1000) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="${size}" height="${size}">
  <defs>
    <linearGradient id="expencirGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
    <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EEF2FF" />
    </linearGradient>
  </defs>
  <g fill="${fillColor}">
    ${getEmblemPaths()}
  </g>
</svg>`;
}

// Full logo with Emblem + EXPENCIR Wordmark + Tagline
function createFullLogoSvg(mode = "dark") {
  const isDark = mode === "dark";
  const taglineColor = isDark ? "#A5B4FC" : "#6366F1";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 500" width="1600" height="500">
  <defs>
    <linearGradient id="expencirGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
    <linearGradient id="wordmarkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
  </defs>

  <!-- Left: Emblem -->
  <g transform="translate(60, 50)">
    <g transform="translate(200, 200) scale(0.42)">
      <g fill="url(#expencirGrad)">
        ${getEmblemPaths()}
      </g>
    </g>
  </g>

  <!-- Right: Wordmark "EXPENCIR" in bold futuristic typography -->
  <g transform="translate(480, 265)">
    <text x="0" y="0" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="140" 
          font-weight="900" 
          letter-spacing="14" 
          fill="url(#wordmarkGrad)">EXPENCIR</text>
    
    <!-- Tagline: Track · Manage · Grow -->
    <text x="10" y="85" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="40" 
          font-weight="600" 
          letter-spacing="16" 
          fill="${taglineColor}" 
          opacity="0.9">Track  ·  Manage  ·  Grow</text>
  </g>
</svg>`;
}

// App Icon SVG (Squircle icon for PWA/Android/iOS home screen)
function createAppIconSvg(size = 1024) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0B1020" />
    </linearGradient>
    <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EEF2FF" />
    </linearGradient>
  </defs>

  <!-- Dark navy squircle background -->
  <rect width="1024" height="1024" rx="224" ry="224" fill="url(#bgGrad)" />
  <rect width="1024" height="1024" rx="224" ry="224" fill="none" stroke="#6366F1" stroke-width="6" stroke-opacity="0.25" />

  <!-- Soft indigo glow circle -->
  <circle cx="512" cy="512" r="320" fill="none" stroke="#6366F1" stroke-width="12" stroke-opacity="0.2" />

  <!-- Center white swirl emblem -->
  <g transform="translate(512,512) scale(0.82) translate(-500,-500)">
    <g fill="url(#whiteGrad)">
      ${getEmblemPaths()}
    </g>
  </g>
</svg>`;
}

async function generateAll() {
  console.log("Generating SVG assets...");
  
  const emblemSvgStr = createEmblemSvg("url(#expencirGrad)", 1000);
  const emblemWhiteSvgStr = createEmblemSvg("url(#whiteGrad)", 1000);
  const fullLogoSvgStr = createFullLogoSvg("dark");
  const appIconSvgStr = createAppIconSvg(1024);

  // Write SVGs
  fs.writeFileSync(path.join(publicDir, 'logo-emblem.svg'), emblemSvgStr);
  fs.writeFileSync(path.join(publicDir, 'logo-emblem-white.svg'), emblemWhiteSvgStr);
  fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), appIconSvgStr);

  console.log("Rendering PNG assets with sharp...");

  // 1. Transparent PNG containing only swirl emblem (1024x1024)
  await sharp(Buffer.from(emblemSvgStr))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(publicDir, 'logo-emblem.png'));

  // 2. App icons (Android launcher, Apple touch, Favicons)
  const iconSizes = [
    { name: 'icons/icon-192.png', size: 192 },
    { name: 'icons/icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icons/maskable-192.png', size: 192 },
    { name: 'icons/maskable-512.png', size: 512 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon-16.png', size: 16 },
  ];

  for (const item of iconSizes) {
    await sharp(Buffer.from(appIconSvgStr))
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(publicDir, item.name));
  }

  // Favicon.ico
  await sharp(Buffer.from(appIconSvgStr))
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));

  await sharp(Buffer.from(appIconSvgStr))
    .resize(32, 32)
    .toFile(path.join(appDir, 'favicon.ico'));

  console.log("All brand assets regenerated successfully!");
}

generateAll().catch(err => {
  console.error("Asset generation error:", err);
  process.exit(1);
});
