import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Color Palette from the user's uploaded images
const COLORS = {
  pink: '#E6007E',       // Top-left magenta / hot pink
  blue: '#009EE2',       // Top-right cyan / azure blue
  yellow: '#FFB800',     // Bottom-left sunny yellow
  green: '#76BC21',      // Bottom-right vibrant grass green
  ringBlue: '#0077CC',   // Binder loops
  white: '#FFFFFF',
  textBlue: '#0077E6',   // AQUAGENDA text blue
};

/**
 * Generates the SVG string for the Aquagenda Icon / Emblem
 * ViewBox: 0 0 1000 1000
 */
function createAquagendaIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <!-- Filter for subtle crispness -->
    <clipPath id="calClip">
      <rect x="290" y="225" width="470" height="520" rx="42" ry="42" />
    </clipPath>
  </defs>

  <!-- ================= BACKGROUND SPLATTER / PAINT SPLASH ================= -->
  <g id="splatter-layer">
    <!-- Top-Left & Mid-Left Pink Splash Shapes -->
    <path d="M 330 240
             C 260 180, 200 110, 160 145
             C 120 180, 180 250, 220 280
             C 160 300, 60 340, 75 420
             C 90 490, 190 460, 260 480
             C 270 482, 280 470, 290 450
             Z" fill="${COLORS.pink}" />
             
    <!-- Top Pink Droplets -->
    <circle cx="535" cy="118" r="28" fill="${COLORS.pink}" />
    <circle cx="230" cy="295" r="32" fill="${COLORS.yellow}" />

    <!-- Top-Right & Mid-Right Blue Splash Shapes -->
    <path d="M 680 240
             C 730 180, 800 190, 845 245
             C 890 300, 820 350, 800 380
             C 850 390, 935 410, 940 475
             C 945 540, 860 545, 800 525
             C 765 510, 750 480, 740 470
             Z" fill="${COLORS.blue}" />
             
    <!-- Top Blue Droplets -->
    <circle cx="760" cy="142" r="30" fill="${COLORS.blue}" />

    <!-- Bottom-Left Yellow Splash Shapes -->
    <path d="M 285 520
             C 210 540, 110 550, 120 620
             C 130 680, 220 680, 260 690
             C 240 730, 215 805, 275 885
             C 335 945, 375 860, 395 810
             C 410 770, 360 740, 330 710
             Z" fill="${COLORS.yellow}" />

    <!-- Extra Yellow Droplet -->
    <circle cx="110" cy="590" r="32" fill="${COLORS.yellow}" />

    <!-- Bottom-Right Green Splash Shapes -->
    <path d="M 740 520
             C 810 540, 910 560, 915 630
             C 920 690, 830 690, 790 705
             C 810 740, 845 810, 790 885
             C 730 945, 680 870, 660 815
             C 645 770, 690 735, 720 710
             Z" fill="${COLORS.green}" />

    <!-- Extra Green Droplet -->
    <circle cx="915" cy="595" r="32" fill="${COLORS.green}" />
  </g>

  <!-- ================= CALENDAR BASE PUZZLE PIECES ================= -->
  <g id="calendar-puzzle">
    <!-- PIECE 1: Top-Left (Magenta/Pink) -->
    <!-- Bounds ~ x:290..525, y:225..510 -->
    <path d="M 332 225
             L 525 225
             L 525 330
             C 545 330, 560 348, 560 368
             C 560 388, 545 405, 525 405
             L 525 510
             L 435 510
             C 435 530, 418 545, 398 545
             C 378 545, 360 530, 360 510
             L 290 510
             L 290 267
             A 42 42 0 0 1 332 225
             Z" fill="${COLORS.pink}" />

    <!-- PIECE 2: Top-Right (Cyan/Blue) -->
    <!-- Bounds ~ x:525..760, y:225..510 -->
    <path d="M 525 225
             L 718 225
             A 42 42 0 0 1 760 267
             L 760 510
             L 690 510
             C 690 530, 672 545, 652 545
             C 632 545, 615 530, 615 510
             L 525 510
             L 525 405
             C 545 405, 560 388, 560 368
             C 560 348, 545 330, 525 330
             Z" fill="${COLORS.blue}" />

    <!-- PIECE 3: Bottom-Left (Yellow) with puzzle interlocking -->
    <!-- Bounds ~ x:290..525, y:510..745 -->
    <path d="M 290 510
             L 360 510
             C 360 530, 378 545, 398 545
             C 418 545, 435 530, 435 510
             L 525 510
             L 525 615
             C 545 615, 560 632, 560 652
             C 560 672, 545 690, 525 690
             L 525 745
             L 332 745
             A 42 42 0 0 1 290 703
             Z" fill="${COLORS.yellow}" />

    <!-- PIECE 4: Bottom-Right (Green) with puzzle interlocking -->
    <!-- Bounds ~ x:525..760, y:510..745 -->
    <path d="M 525 510
             L 615 510
             C 615 530, 632 545, 652 545
             C 672 545, 690 530, 690 510
             L 760 510
             L 760 703
             A 42 42 0 0 1 718 745
             L 525 745
             L 525 690
             C 545 690, 560 672, 560 652
             C 560 632, 545 615, 525 615
             Z" fill="${COLORS.green}" />
  </g>

  <!-- ================= CENTER 2x2 WINDOW CUTOUT ================= -->
  <!-- 4 rounded squares in pure white, centered on the puzzle axes -->
  <g id="center-window" fill="${COLORS.white}">
    <!-- Top-left window -->
    <rect x="445" y="430" width="65" height="65" rx="14" ry="14" />
    <!-- Top-right window -->
    <rect x="540" y="430" width="65" height="65" rx="14" ry="14" />
    <!-- Bottom-left window -->
    <rect x="445" y="525" width="65" height="65" rx="14" ry="14" />
    <!-- Bottom-right window -->
    <rect x="540" y="525" width="65" height="65" rx="14" ry="14" />
  </g>

  <!-- ================= BOTTOM WATER WAVE CUTOUT ================= -->
  <!-- A dynamic undulating wave carving through the lower section -->
  <path d="M 270 755
           C 310 715, 360 790, 420 750
           C 475 715, 520 790, 580 750
           C 640 715, 690 790, 740 750
           C 760 735, 780 755, 780 755"
        fill="none"
        stroke="${COLORS.white}"
        stroke-width="34"
        stroke-linecap="round"
        stroke-linejoin="round" />

  <!-- Lower splash ripple drips under the wave -->
  <g id="bottom-wave-drips">
    <path d="M 330 770
             C 360 790, 390 850, 430 840
             C 470 830, 480 780, 510 770
             Z" fill="${COLORS.yellow}" />
    <path d="M 540 770
             C 570 790, 600 850, 640 840
             C 680 830, 690 780, 720 770
             Z" fill="${COLORS.green}" />
  </g>

  <!-- ================= TOP BINDER RINGS ================= -->
  <!-- Left Ring -->
  <g id="left-ring">
    <rect x="382" y="160" width="82" height="150" rx="41" ry="41" fill="${COLORS.blue}" />
    <rect x="403" y="195" width="40" height="80" rx="20" ry="20" fill="${COLORS.white}" />
  </g>

  <!-- Right Ring -->
  <g id="right-ring">
    <rect x="586" y="160" width="82" height="150" rx="41" ry="41" fill="${COLORS.blue}" />
    <rect x="607" y="195" width="40" height="80" rx="20" ry="20" fill="${COLORS.white}" />
  </g>
</svg>`;
}

/**
 * Generates the SVG string for the Full Aquagenda Horizontal Logo (Emblem + Text)
 * ViewBox: 0 0 2400 1000
 */
function createAquagendaFullLogoSvg() {
  const icon = createAquagendaIconSvg()
    .replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">', '')
    .replace('</svg>', '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1000" width="2400" height="1000">
  <defs>
    <!-- Wave Gradient: Magenta/Pink to Orange/Yellow -->
    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${COLORS.pink}" />
      <stop offset="35%" stop-color="${COLORS.pink}" />
      <stop offset="70%" stop-color="#FF6B00" />
      <stop offset="100%" stop-color="${COLORS.yellow}" />
    </linearGradient>
  </defs>

  <!-- LEFT EMBLEM (Scale and position within 0..1000) -->
  <g transform="translate(40, 0)">
    ${icon}
  </g>

  <!-- RIGHT TYPOGRAPHY: "AQUAGENDA" -->
  <g id="logo-text" transform="translate(1040, 0)">
    <!-- Letter A with elongated left stem connecting to wave -->
    <!-- The font style is tall condensed bold geometric sans-serif -->
    <text x="0" y="610" 
          font-family="system-ui, -apple-system, 'Inter', 'Montserrat', 'Bebas Neue', 'Impact', sans-serif" 
          font-size="390" 
          font-weight="900" 
          letter-spacing="4" 
          fill="${COLORS.textBlue}">AQUAGENDA</text>

    <!-- First "A" extended left foot connecting downwards to wave -->
    <path d="M 2 540 L 2 710 C 2 725, 12 735, 26 735 L 50 735 L 50 540 Z" fill="${COLORS.textBlue}" />

    <!-- Dynamic Wavy Ribbon under AQUAGENDA -->
    <path d="M 0 655
             C 80 740, 160 630, 240 710
             C 320 790, 400 660, 490 715
             C 580 770, 660 650, 750 710
             C 840 770, 920 650, 1010 710
             C 1100 770, 1180 660, 1270 705
             C 1310 725, 1340 725, 1370 710"
          fill="none"
          stroke="url(#waveGrad)"
          stroke-width="36"
          stroke-linecap="round"
          stroke-linejoin="round" />
  </g>
</svg>`;
}

async function run() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const iconSvg = createAquagendaIconSvg();
  const logoSvg = createAquagendaFullLogoSvg();

  // Save raw SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), iconSvg);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);
  console.log('Saved favicon.svg, icon.svg, logo.svg');

  // Convert to PNGs using sharp
  const iconBuffer = Buffer.from(iconSvg);
  const logoBuffer = Buffer.from(logoSvg);

  // 1. Favicon PNG 32x32
  await sharp(iconBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');

  // 2. Favicon PNG 16x16
  await sharp(iconBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Generated favicon-16x16.png');

  // 3. Apple Touch Icon 180x180
  await sharp(iconBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 4. Android / PWA Icon 192x192
  await sharp(iconBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 5. Android / PWA Icon 512x512
  await sharp(iconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // 6. Full Logo PNG 1200x500
  await sharp(logoBuffer)
    .resize(1200, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Generated logo.png');

  // 7. Standard favicon.ico (using 32x32 png as fallback)
  fs.copyFileSync(
    path.join(publicDir, 'favicon-32x32.png'),
    path.join(publicDir, 'favicon.ico')
  );
  console.log('Generated favicon.ico');

  console.log('All icons and favicons generated successfully!');
}

run().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
