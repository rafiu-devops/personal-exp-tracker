const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const appDir = path.join(__dirname, '..', 'app');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const BLADE_PATH =
  "M44.7 239.7 L45.3 243.2 L49.0 250.2 L54.0 258.8 L61.1 269.4 L66.9 276.9 L73.0 284.0 L79.4 290.7 L86.1 296.8 L92.9 302.5 L100.0 307.7 L107.2 312.3 L114.5 316.5 L122.0 320.1 L129.5 323.2 L137.1 325.7 L144.9 327.8 L152.5 329.3 L160.0 330.2 L167.4 330.7 L176.9 330.4 L184.0 329.7 L191.1 328.4 L199.8 325.9 L206.3 323.4 L214.1 319.6 L219.6 316.1 L225.1 312.0 L229.9 307.6 L235.4 301.3 L239.2 295.9 L242.6 289.8 L244.6 284.8 L244.6 281.3 L243.3 278.1 L241.3 275.9 L238.2 274.3 L234.7 274.0 L226.8 275.6 L220.8 276.3 L212.8 276.4 L207.2 276.0 L199.5 274.9 L194.1 273.6 L186.6 271.2 L179.3 268.1 L168.1 261.7 L157.5 253.6 L148.0 244.1 L139.7 233.3 L132.5 221.3 L126.7 208.3 L123.0 197.0 L119.8 182.6 L118.6 173.6 L117.9 164.4 L117.8 155.1 L118.3 145.7 L120.3 129.6 L122.3 120.1 L124.7 111.0 L124.9 108.7 L124.3 105.8 L122.8 103.3 L120.6 101.4 L117.8 100.3 L114.3 100.2 L110.6 101.8 L102.5 109.8 L95.4 117.6 L87.2 127.7 L79.8 138.2 L74.1 147.1 L67.8 158.3 L63.2 167.8 L59.1 177.3 L55.5 187.1 L52.4 197.0 L49.7 207.1 L47.6 217.2 L45.9 227.5 L44.7 239.7 Z";

function getEmblemPaths(fill = "currentColor") {
  const angles = [0, 60, 120, 180, 240, 300];
  return angles
    .map(
      (deg) =>
        `    <path d="${BLADE_PATH}" fill="${fill}" transform="rotate(${deg} 256 256)" />`
    )
    .join("\n");
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

  <!-- Right: Wordmark "EXPENZA" in bold futuristic typography -->
  <g transform="translate(480, 265)">
    <text x="0" y="0" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="140" 
          font-weight="900" 
          letter-spacing="14" 
          fill="url(#wordmarkGrad)">EXPENZA</text>
    
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
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#585BF0" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
    <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EEF2FF" />
    </linearGradient>
  </defs>

  <!-- Light purple brand squircle background -->
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
