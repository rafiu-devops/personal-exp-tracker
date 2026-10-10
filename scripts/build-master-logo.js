const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const appDir = path.join(__dirname, '..', 'app');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Ensure old mismatched apple-touch-icon inside public/icons/ is removed if present
const oldAppleIconInIcons = path.join(iconsDir, 'apple-touch-icon.png');
if (fs.existsSync(oldAppleIconInIcons)) {
  fs.unlinkSync(oldAppleIconInIcons);
}

const BLADE_PATH =
  "M44.7 239.7 L45.3 243.2 L49.0 250.2 L54.0 258.8 L61.1 269.4 L66.9 276.9 L73.0 284.0 L79.4 290.7 L86.1 296.8 L92.9 302.5 L100.0 307.7 L107.2 312.3 L114.5 316.5 L122.0 320.1 L129.5 323.2 L137.1 325.7 L144.9 327.8 L152.5 329.3 L160.0 330.2 L167.4 330.7 L176.9 330.4 L184.0 329.7 L191.1 328.4 L199.8 325.9 L206.3 323.4 L214.1 319.6 L219.6 316.1 L225.1 312.0 L229.9 307.6 L235.4 301.3 L239.2 295.9 L242.6 289.8 L244.6 284.8 L244.6 281.3 L243.3 278.1 L241.3 275.9 L238.2 274.3 L234.7 274.0 L226.8 275.6 L220.8 276.3 L212.8 276.4 L207.2 276.0 L199.5 274.9 L194.1 273.6 L186.6 271.2 L179.3 268.1 L168.1 261.7 L157.5 253.6 L148.0 244.1 L139.7 233.3 L132.5 221.3 L126.7 208.3 L123.0 197.0 L119.8 182.6 L118.6 173.6 L117.9 164.4 L117.8 155.1 L118.3 145.7 L120.3 129.6 L122.3 120.1 L124.7 111.0 L124.9 108.7 L124.3 105.8 L122.8 103.3 L120.6 101.4 L117.8 100.3 L114.3 100.2 L110.6 101.8 L102.5 109.8 L95.4 117.6 L87.2 127.7 L79.8 138.2 L74.1 147.1 L67.8 158.3 L63.2 167.8 L59.1 177.3 L55.5 187.1 L52.4 197.0 L49.7 207.1 L47.6 217.2 L45.9 227.5 L44.7 239.7 Z";

function getSixBladePaths(fill = "#FFFFFF") {
  const angles = [0, 60, 120, 180, 240, 300];
  return angles
    .map(
      (deg) =>
        `    <path d="${BLADE_PATH}" fill="${fill}" transform="rotate(${deg} 256 256)" />`
    )
    .join("\n");
}

function buildWhiteEmblemSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g>
${getSixBladePaths("#FFFFFF")}
  </g>
</svg>`;
}

function buildGradientEmblemSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="expenzaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8" />
      <stop offset="50%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
  </defs>
  <g>
${getSixBladePaths("url(#expenzaGrad)")}
  </g>
</svg>`;
}

function buildAppIconSvg(size = 512, isMaskable = false) {
  const paddingScale = isMaskable ? 0.65 : 0.76;
  const transform = `translate(${size / 2}, ${size / 2}) scale(${
    (size / 512) * paddingScale
  }) translate(-256, -256)`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <radialGradient id="appIconGrad" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#818CF8" />
      <stop offset="45%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4F46E5" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" ${
    isMaskable ? "" : `rx="${Math.round(size * 0.22)}"`
  } fill="url(#appIconGrad)" />
  <g transform="${transform}">
${getSixBladePaths("#FFFFFF")}
  </g>
</svg>`;
}

async function renderAssets() {
  console.log("Generating Master Pinwheel Assets...");

  const whiteSvg = buildWhiteEmblemSvg();
  const gradSvg = buildGradientEmblemSvg();

  fs.writeFileSync(path.join(publicDir, 'logo-emblem-white.svg'), whiteSvg);
  fs.writeFileSync(path.join(publicDir, 'logo-emblem.svg'), gradSvg);
  fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), buildAppIconSvg(512, false));

  // 1. App Launcher Icons
  await sharp(Buffer.from(buildAppIconSvg(192, false)))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));

  await sharp(Buffer.from(buildAppIconSvg(512, false)))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));

  // 2. Maskable Icons (Android safe zone)
  await sharp(Buffer.from(buildAppIconSvg(192, true)))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'maskable-192.png'));

  await sharp(Buffer.from(buildAppIconSvg(512, true)))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'maskable-512.png'));

  // 3. Apple Touch Icon in public/apple-touch-icon.png (ROOT of public/ as requested!)
  await sharp(Buffer.from(buildAppIconSvg(180, false)))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. Favicons
  await sharp(Buffer.from(buildAppIconSvg(32, false)))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));

  await sharp(Buffer.from(buildAppIconSvg(16, false)))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16.png'));

  await sharp(Buffer.from(buildAppIconSvg(32, false)))
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));

  await sharp(Buffer.from(buildAppIconSvg(32, false)))
    .resize(32, 32)
    .toFile(path.join(appDir, 'favicon.ico'));

  console.log("All brand assets successfully generated and positioned!");
}

renderAssets().catch((err) => {
  console.error("Asset generation error:", err);
  process.exit(1);
});
