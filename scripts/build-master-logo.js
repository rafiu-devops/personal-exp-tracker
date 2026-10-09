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

/**
 * MASTER DISC PINWHEEL EMBLEM
 * 512x512 Canvas, Center (256, 256)
 * Outer radius R = 232 (perfect circular boundary)
 * 6-fold rotational symmetry (0°, 60°, 120°, 180°, 240°, 300°)
 * Thin constant-width curved swirl slits from center hub to perimeter.
 */
function getSlitDiskPaths() {
  const angles = [0, 60, 120, 180, 240, 300];
  return angles
    .map(
      (deg) =>
        `    <path d="M 0 -232 A 232 232 0 0 1 140 -184 C 95 -135 55 -92 20 -48 C -12 -8 -22 14 -12 28 C -32 6 -24 -26 10 -68 C 45 -110 88 -150 0 -232 Z" transform="rotate(${deg})" />`
    )
    .join('\n');
}

function buildWhiteEmblemSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g fill="#FFFFFF" transform="translate(256, 256)">
${getSlitDiskPaths()}
  </g>
</svg>`;
}

function buildGradientEmblemSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="expencirIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4338CA" />
    </linearGradient>
  </defs>
  <g fill="url(#expencirIndigoGrad)" transform="translate(256, 256)">
${getSlitDiskPaths()}
  </g>
</svg>`;
}

function buildAppIconSvg(size = 512, isMaskable = false) {
  const paddingScale = isMaskable ? 0.60 : 0.72;
  const transform = `translate(${size / 2}, ${size / 2}) scale(${(size / 512) * paddingScale})`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" ${isMaskable ? '' : `rx="${Math.round(size * 0.22)}"`} fill="#14146E" />
  <g fill="#FFFFFF" transform="${transform}">
${getSlitDiskPaths()}
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
