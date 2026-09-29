import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function safeStr(s: string): string {
  if (!s) return '';
  return s
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n]/g, ' ')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/[–—]/g, '-')
    .replace(/•/g, '*')
    .replace(/×/g, 'x')
    .replace(/…/g, '...')
    .replace(/’|‘/g, "'")
    .replace(/“|”/g, '"')
    .replace(/²/g, '2')
    .replace(/°/g, ' deg ')
    .replace(/✓/g, '[v]');
}

async function generateCarbonCatalogPDF() {
  const pdfDoc = await PDFDocument.create();

  // Embed standard fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Palette matching the user's PDF
  const deepForestGreen = rgb(0.06, 0.16, 0.13); // #0f2921 (Cover & Back cover bg)
  const forestGreenCard = rgb(0.09, 0.22, 0.18);
  const copperOrange = rgb(0.88, 0.45, 0.18); // #e0732e
  const goldAmber = rgb(0.92, 0.68, 0.20); // #ebb226
  const pureWhite = rgb(1, 1, 1);
  const darkText = rgb(0.12, 0.15, 0.18);
  const grayText = rgb(0.35, 0.40, 0.45);
  const lightGrayBg = rgb(0.97, 0.97, 0.98);
  const borderLight = rgb(0.88, 0.90, 0.92);
  const headerUnderline = rgb(0.88, 0.45, 0.18);

  // Load Carbon image if available
  let carbonImg = null;
  const imgPath = path.join(__dirname, 'public', 'coconut-shell-activated-carbon.jpg');
  if (fs.existsSync(imgPath)) {
    try {
      const imgBytes = fs.readFileSync(imgPath);
      carbonImg = await pdfDoc.embedJpg(imgBytes);
    } catch (e) {
      console.warn('Could not embed carbon image:', e);
    }
  }

  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points

  const drawTextSafe = (page: any, text: string, options: any) => {
    page.drawText(safeStr(text), options);
  };

  const drawHeader = (page: any, rightSubtitle: string) => {
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: 50,
      y: pageHeight - 50,
      size: 11,
      font: helveticaBold,
      color: darkText
    });
    const subWidth = helveticaBold.widthOfTextAtSize(safeStr(rightSubtitle), 8.5);
    drawTextSafe(page, rightSubtitle, {
      x: pageWidth - 50 - subWidth,
      y: pageHeight - 50,
      size: 8.5,
      font: helveticaBold,
      color: copperOrange
    });
    page.drawLine({
      start: { x: 50, y: pageHeight - 60 },
      end: { x: pageWidth - 50, y: pageHeight - 60 },
      thickness: 1.5,
      color: darkText
    });
  };

  const drawFooter = (page: any, pageNumStr: string) => {
    page.drawLine({
      start: { x: 50, y: 45 },
      end: { x: pageWidth - 50, y: 45 },
      thickness: 0.5,
      color: borderLight
    });
    drawTextSafe(page, 'Coconut Shell Activated Carbon', {
      x: 50,
      y: 32,
      size: 8,
      font: helvetica,
      color: grayText
    });
    const pWidth = helvetica.widthOfTextAtSize(safeStr(pageNumStr), 8);
    drawTextSafe(page, pageNumStr, {
      x: pageWidth - 50 - pWidth,
      y: 32,
      size: 8,
      font: helvetica,
      color: grayText
    });
  };

  // ==========================================
  // PAGE 1: COVER (Deep Forest Green)
  // ==========================================
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  page1.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: deepForestGreen
  });

  drawTextSafe(page1, 'PR', { x: 70, y: pageHeight - 110, size: 28, font: helveticaBold, color: copperOrange });
  drawTextSafe(page1, 'ORIGIN', { x: 70, y: pageHeight - 145, size: 28, font: helveticaBold, color: copperOrange });
  drawTextSafe(page1, 'GLOBAL', { x: 70, y: pageHeight - 180, size: 28, font: helveticaBold, color: copperOrange });

  page1.drawLine({ start: { x: 70, y: pageHeight - 195 }, end: { x: 190, y: pageHeight - 195 }, thickness: 2, color: copperOrange });

  drawTextSafe(page1, 'GLOBAL EXPORT DIVISION', { x: 70, y: pageHeight - 215, size: 10, font: helveticaBold, color: rgb(0.7, 0.85, 0.8) });

  drawTextSafe(page1, 'HIGH-PERFORMANCE', { x: 70, y: pageHeight - 270, size: 15, font: helveticaBold, color: pureWhite });
  drawTextSafe(page1, 'FILTRATION MEDIA', { x: 70, y: pageHeight - 290, size: 15, font: helveticaBold, color: pureWhite });

  drawTextSafe(page1, 'COCONUT', { x: 70, y: pageHeight - 350, size: 36, font: helveticaBold, color: pureWhite });
  drawTextSafe(page1, 'SHELL', { x: 70, y: pageHeight - 390, size: 36, font: helveticaBold, color: pureWhite });
  drawTextSafe(page1, 'ACTIVATED', { x: 70, y: pageHeight - 435, size: 36, font: helveticaBold, color: copperOrange });
  drawTextSafe(page1, 'CARBON', { x: 70, y: pageHeight - 480, size: 36, font: helveticaBold, color: copperOrange });

  drawTextSafe(page1, '"Engineered from Nature.', { x: 70, y: pageHeight - 530, size: 13, font: helveticaOblique, color: rgb(0.85, 0.9, 0.88) });
  drawTextSafe(page1, 'Perfected by Steam."', { x: 70, y: pageHeight - 548, size: 13, font: helveticaOblique, color: rgb(0.85, 0.9, 0.88) });

  // Badges: Water Purification & Air Filtration
  page1.drawRectangle({ x: 70, y: pageHeight - 610, width: 130, height: 32, borderColor: copperOrange, borderWidth: 1, color: forestGreenCard });
  drawTextSafe(page1, 'WATER PURIFICATION', { x: 80, y: pageHeight - 598, size: 8.5, font: helveticaBold, color: pureWhite });

  page1.drawRectangle({ x: 70, y: pageHeight - 655, width: 115, height: 32, borderColor: copperOrange, borderWidth: 1, color: forestGreenCard });
  drawTextSafe(page1, 'AIR FILTRATION', { x: 80, y: pageHeight - 643, size: 8.5, font: helveticaBold, color: pureWhite });

  // Optional preview image on right
  if (carbonImg) {
    page1.drawImage(carbonImg, {
      x: pageWidth - 260,
      y: pageHeight - 660,
      width: 200,
      height: 200
    });
    page1.drawRectangle({
      x: pageWidth - 260,
      y: pageHeight - 660,
      width: 200,
      height: 200,
      borderColor: copperOrange,
      borderWidth: 1.5
    });
  }

  // Cover footer contact strip
  drawTextSafe(page1, 'www.proriginglobal.com    |    contact@proriginglobal.com    |    +91 97378 86587', {
    x: 70,
    y: 50,
    size: 9,
    font: helvetica,
    color: rgb(0.75, 0.85, 0.8)
  });

  // ==========================================
  // PAGE 2: PRODUCT OVERVIEW & ADVANTAGE
  // ==========================================
  const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page2, 'PRODUCT OVERVIEW');

  drawTextSafe(page2, 'WHAT IS COCONUT SHELL ACTIVATED', { x: 50, y: pageHeight - 95, size: 18, font: helveticaBold, color: darkText });
  drawTextSafe(page2, 'CARBON?', { x: 50, y: pageHeight - 118, size: 18, font: helveticaBold, color: darkText });

  const p2Text1 = 'Coconut shell activated carbon (CSAC) is a high-purity carbon adsorbent produced from coconut shells - a renewable biomass resource. Through rigorous carbonization and advanced steam activation, the raw shell is converted into a highly porous material capable of adsorbing contaminants at the molecular level with unmatched efficiency.';
  const p2Text2 = 'Unlike coal or wood-based alternatives, coconut shell carbon offers a unique microporous structure that makes it the premier choice for critical purification applications across heavy industries, municipal plants, and mining sectors.';

  drawTextSafe(page2, p2Text1.substring(0, 115), { x: 50, y: pageHeight - 150, size: 9.5, font: helvetica, color: grayText });
  drawTextSafe(page2, p2Text1.substring(115, 230), { x: 50, y: pageHeight - 165, size: 9.5, font: helvetica, color: grayText });
  drawTextSafe(page2, p2Text1.substring(230), { x: 50, y: pageHeight - 180, size: 9.5, font: helvetica, color: grayText });

  drawTextSafe(page2, p2Text2.substring(0, 115), { x: 50, y: pageHeight - 205, size: 9.5, font: helvetica, color: grayText });
  drawTextSafe(page2, p2Text2.substring(115), { x: 50, y: pageHeight - 220, size: 9.5, font: helvetica, color: grayText });

  // 2 Cards: Left: Why Coconut Shell? | Right: The PR Origin Advantage
  // Left Box (Cream/Orange Accent)
  const boxY = pageHeight - 480;
  page2.drawRectangle({
    x: 50,
    y: boxY,
    width: 235,
    height: 235,
    color: rgb(0.99, 0.97, 0.95),
    borderColor: rgb(0.95, 0.75, 0.6),
    borderWidth: 1
  });
  page2.drawRectangle({
    x: 50,
    y: boxY,
    width: 5,
    height: 235,
    color: copperOrange
  });

  drawTextSafe(page2, 'Why Coconut Shell?', { x: 65, y: boxY + 210, size: 12, font: helveticaBold, color: copperOrange });

  const whyPoints = [
    { title: 'High Carbon Content:', desc: 'Naturally dense raw material yields superior fixed carbon.' },
    { title: 'Exceptional Hardness:', desc: 'High resistance to abrasion & friction during backwash.' },
    { title: 'Natural Microporosity:', desc: 'Tightly packed pore structure traps small molecules (VOCs).' },
    { title: 'Low Ash Formation:', desc: 'Significantly cleaner than coal carbons, protecting systems.' },
    { title: '100% Renewable:', desc: 'Ethically sourced from mature tropical coconut plantations.' }
  ];

  let wy = boxY + 185;
  whyPoints.forEach(p => {
    drawTextSafe(page2, '[x] ' + p.title, { x: 65, y: wy, size: 8, font: helveticaBold, color: darkText });
    drawTextSafe(page2, p.desc, { x: 75, y: wy - 11, size: 7.5, font: helvetica, color: grayText });
    wy -= 33;
  });

  // Right Box (Dark Green Container)
  page2.drawRectangle({
    x: 305,
    y: boxY,
    width: 240,
    height: 235,
    color: forestGreenCard
  });

  drawTextSafe(page2, 'The PR Origin Advantage', { x: 320, y: boxY + 210, size: 12, font: helveticaBold, color: goldAmber });
  drawTextSafe(page2, 'By controlling the supply chain from raw shell', { x: 320, y: boxY + 190, size: 8, font: helvetica, color: rgb(0.85, 0.9, 0.88) });
  drawTextSafe(page2, 'procurement to high-temp steam activation, we', { x: 320, y: boxY + 178, size: 8, font: helvetica, color: rgb(0.85, 0.9, 0.88) });
  drawTextSafe(page2, 'ensure consistency across every batch.', { x: 320, y: boxY + 166, size: 8, font: helvetica, color: rgb(0.85, 0.9, 0.88) });

  const advPoints = [
    { title: 'Strict Quality Control:', desc: 'Laboratory tested to international ASTM standards.' },
    { title: 'Custom Sizing:', desc: 'Precise mesh screening minimizes pressure drop in filters.' },
    { title: 'Global Logistics:', desc: 'ISPM-15 compliant palletization & moisture-proof export.' }
  ];

  let ay = boxY + 135;
  advPoints.forEach(p => {
    drawTextSafe(page2, '[v] ' + p.title, { x: 320, y: ay, size: 8, font: helveticaBold, color: pureWhite });
    drawTextSafe(page2, p.desc, { x: 330, y: ay - 11, size: 7.5, font: helvetica, color: rgb(0.75, 0.85, 0.8) });
    ay -= 35;
  });

  drawFooter(page2, 'Page 02');

  // ==========================================
  // PAGE 3: MANUFACTURING PROCESS & SURFACE AREA
  // ==========================================
  const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page3, 'MANUFACTURING');

  drawTextSafe(page3, 'MANUFACTURING PROCESS', { x: 50, y: pageHeight - 95, size: 18, font: helveticaBold, color: darkText });
  drawTextSafe(page3, 'Our coconut shell activated carbon is produced through a meticulously controlled two-stage', { x: 50, y: pageHeight - 120, size: 9.5, font: helvetica, color: grayText });
  drawTextSafe(page3, 'thermal process, ensuring absolute purity and structural maximization.', { x: 50, y: pageHeight - 134, size: 9.5, font: helvetica, color: grayText });

  // 2 Step Boxes
  const stepBoxY = pageHeight - 290;
  // Step 1
  page3.drawRectangle({
    x: 50,
    y: stepBoxY,
    width: 230,
    height: 130,
    color: rgb(0.99, 0.97, 0.95),
    borderColor: rgb(0.95, 0.75, 0.6),
    borderWidth: 1
  });
  page3.drawLine({ start: { x: 50, y: stepBoxY + 130 }, end: { x: 280, y: stepBoxY + 130 }, thickness: 3, color: copperOrange });
  drawTextSafe(page3, '1. Carbonization', { x: 65, y: stepBoxY + 105, size: 12, font: helveticaBold, color: copperOrange });
  drawTextSafe(page3, 'Mature coconut shells are heated in a', { x: 65, y: stepBoxY + 85, size: 8.5, font: helvetica, color: grayText });
  drawTextSafe(page3, 'controlled, oxygen-limited rotary kiln to', { x: 65, y: stepBoxY + 72, size: 8.5, font: helvetica, color: grayText });
  drawTextSafe(page3, 'remove volatile matter and moisture, converting', { x: 65, y: stepBoxY + 59, size: 8.5, font: helvetica, color: grayText });
  drawTextSafe(page3, 'raw biomass into dense, high-carbon char.', { x: 65, y: stepBoxY + 46, size: 8.5, font: helvetica, color: grayText });

  // Arrow
  drawTextSafe(page3, '->', { x: 290, y: stepBoxY + 65, size: 16, font: helveticaBold, color: copperOrange });

  // Step 2
  page3.drawRectangle({
    x: 315,
    y: stepBoxY,
    width: 230,
    height: 130,
    color: rgb(0.99, 0.97, 0.95),
    borderColor: rgb(0.95, 0.75, 0.6),
    borderWidth: 1
  });
  page3.drawLine({ start: { x: 315, y: stepBoxY + 130 }, end: { x: 545, y: stepBoxY + 130 }, thickness: 3, color: copperOrange });
  drawTextSafe(page3, '2. Steam Activation', { x: 330, y: stepBoxY + 105, size: 12, font: helveticaBold, color: copperOrange });
  drawTextSafe(page3, 'The char is subjected to high-temperature', { x: 330, y: stepBoxY + 85, size: 8.5, font: helvetica, color: grayText });
  drawTextSafe(page3, 'steam (physical activation) at 900 deg C - 1100 deg C.', { x: 330, y: stepBoxY + 72, size: 8.5, font: helvetica, color: grayText });
  drawTextSafe(page3, 'This selective oxidation develops an intricate', { x: 330, y: stepBoxY + 59, size: 8.5, font: helvetica, color: grayText });
  drawTextSafe(page3, 'network of micropores, maximizing surface area.', { x: 330, y: stepBoxY + 46, size: 8.5, font: helvetica, color: grayText });

  // Giant "THE RESULT" Surface Area Banner
  const bannerY = pageHeight - 560;
  page3.drawRectangle({
    x: 50,
    y: bannerY,
    width: 495,
    height: 230,
    color: deepForestGreen
  });

  drawTextSafe(page3, 'T H E   R E S U L T', { x: 230, y: bannerY + 185, size: 10, font: helveticaBold, color: rgb(0.7, 0.85, 0.8) });

  drawTextSafe(page3, 'Surface Area: 900 - 1300 m2/g', { x: 120, y: bannerY + 135, size: 22, font: helveticaBold, color: goldAmber });

  const tennisText1 = 'A single gram of our activated carbon has the internal surface area';
  const tennisText2 = 'equivalent to several tennis courts, creating a massive matrix for';
  const tennisText3 = 'molecular adsorption and high-capacity purification.';

  drawTextSafe(page3, tennisText1, { x: 130, y: bannerY + 95, size: 10, font: helvetica, color: pureWhite });
  drawTextSafe(page3, tennisText2, { x: 135, y: bannerY + 80, size: 10, font: helvetica, color: pureWhite });
  drawTextSafe(page3, tennisText3, { x: 145, y: bannerY + 65, size: 10, font: helvetica, color: pureWhite });

  drawFooter(page3, 'Page 03');

  // ==========================================
  // PAGE 4: TECHNICAL SPECIFICATIONS & ASTM DATA
  // ==========================================
  const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page4, 'TECHNICAL DATA');

  drawTextSafe(page4, 'TECHNICAL SPECIFICATIONS', { x: 50, y: pageHeight - 95, size: 18, font: helveticaBold, color: darkText });
  drawTextSafe(page4, 'Manufactured to strict export tolerances, our CSAC meets the performance standards required by', { x: 50, y: pageHeight - 118, size: 9, font: helvetica, color: grayText });
  drawTextSafe(page4, 'global municipal and industrial operators.', { x: 50, y: pageHeight - 130, size: 9, font: helvetica, color: grayText });

  // ASTM Spec Table
  const tableY = pageHeight - 160;
  const colX = [50, 200, 420, 545];
  const rowH = 26;

  // Header Row
  page4.drawRectangle({ x: 50, y: tableY - rowH, width: 495, height: rowH, color: deepForestGreen });
  drawTextSafe(page4, 'PARAMETER', { x: 60, y: tableY - 18, size: 8.5, font: helveticaBold, color: pureWhite });
  drawTextSafe(page4, 'TYPICAL RANGE / GUARANTEED', { x: 210, y: tableY - 18, size: 8.5, font: helveticaBold, color: goldAmber });
  drawTextSafe(page4, 'TESTING METHOD', { x: 430, y: tableY - 18, size: 8.5, font: helveticaBold, color: pureWhite });

  const specs = [
    { param: 'Iodine Value', val: '900 - 1200 mg/g', method: 'ASTM D4607' },
    { param: 'Surface Area (BET)', val: '900 - 1300 m2/g', method: 'Nitrogen Adsorption' },
    { param: 'Moisture Content', val: '<= 5%', method: 'ASTM D2867' },
    { param: 'Ash Content', val: '<= 5% (<= 3% for premium grades)', method: 'ASTM D2866' },
    { param: 'Bulk Density', val: '450 - 550 kg/m3', method: 'ASTM D2854' },
    { param: 'Hardness', val: '> 95% (>= 97% for gold-recovery)', method: 'ASTM D3802' },
    { param: 'Porosity Structure', val: 'Predominantly Microporous', method: 'Pore Volume Analysis' },
    { param: 'pH', val: '7 - 11', method: 'ASTM D3838' }
  ];

  let curY = tableY - rowH;
  specs.forEach((s, idx) => {
    curY -= rowH;
    const isEven = idx % 2 === 0;
    page4.drawRectangle({
      x: 50,
      y: curY,
      width: 495,
      height: rowH,
      color: isEven ? pureWhite : lightGrayBg,
      borderColor: borderLight,
      borderWidth: 0.5
    });
    drawTextSafe(page4, s.param, { x: 60, y: curY + 8, size: 8.5, font: helveticaBold, color: darkText });
    drawTextSafe(page4, s.val, { x: 210, y: curY + 8, size: 8.5, font: helvetica, color: copperOrange });
    drawTextSafe(page4, s.method, { x: 430, y: curY + 8, size: 8, font: helvetica, color: grayText });
  });

  // Quality Assurance Box
  const qaY = curY - 110;
  page4.drawRectangle({
    x: 50,
    y: qaY,
    width: 495,
    height: 85,
    color: rgb(0.98, 0.97, 0.95),
    borderColor: rgb(0.9, 0.85, 0.8),
    borderWidth: 1
  });
  page4.drawRectangle({ x: 50, y: qaY, width: 5, height: 85, color: deepForestGreen });

  drawTextSafe(page4, 'Quality Assurance', { x: 70, y: qaY + 62, size: 12, font: helveticaBold, color: deepForestGreen });
  drawTextSafe(page4, 'Every batch is rigorously tested in our laboratory prior to dispatch. Certificate of Analysis', { x: 70, y: qaY + 44, size: 8.5, font: helvetica, color: darkText });
  drawTextSafe(page4, '(COA) is provided with every commercial export shipment to guarantee compliance with', { x: 70, y: qaY + 31, size: 8.5, font: helvetica, color: darkText });
  drawTextSafe(page4, 'your technical requirements.', { x: 70, y: qaY + 18, size: 8.5, font: helvetica, color: darkText });

  drawFooter(page4, 'Page 04');

  // ==========================================
  // PAGE 5: AVAILABLE GRADES & FORMATS
  // ==========================================
  const page5 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page5, 'PRODUCT FORMATS');

  drawTextSafe(page5, 'AVAILABLE GRADES & FORMATS', { x: 50, y: pageHeight - 95, size: 18, font: helveticaBold, color: darkText });
  drawTextSafe(page5, 'We supply activated carbon engineered to the specific hydrodynamic and aerodynamic', { x: 50, y: pageHeight - 118, size: 9, font: helvetica, color: grayText });
  drawTextSafe(page5, 'requirements of your filtration systems.', { x: 50, y: pageHeight - 130, size: 9, font: helvetica, color: grayText });

  const cardW = 155;
  const cardH = 340;
  const cardsY = pageHeight - 500;

  // Format 1: Granular GAC
  page5.drawRectangle({ x: 50, y: cardsY, width: cardW, height: cardH, color: rgb(0.98, 0.98, 0.99), borderColor: borderLight, borderWidth: 1 });
  page5.drawLine({ start: { x: 50, y: cardsY + cardH }, end: { x: 50 + cardW, y: cardsY + cardH }, thickness: 4, color: deepForestGreen });
  drawTextSafe(page5, 'Granular (GAC)', { x: 65, y: cardsY + cardH - 30, size: 12, font: helveticaBold, color: darkText });
  drawTextSafe(page5, 'Irregularly shaped', { x: 65, y: cardsY + cardH - 55, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'granules perfect for', { x: 65, y: cardsY + cardH - 67, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'liquid phase filtration,', { x: 65, y: cardsY + cardH - 79, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'offering high flow rates.', { x: 65, y: cardsY + cardH - 91, size: 8, font: helvetica, color: grayText });

  const gacMeshes = ['4 x 8 mesh', '6 x 12 mesh', '8 x 30 mesh', '12 x 40 mesh'];
  gacMeshes.forEach((m, idx) => {
    drawTextSafe(page5, '[x] ' + m, { x: 65, y: cardsY + cardH - 130 - (idx * 24), size: 9, font: helveticaBold, color: copperOrange });
  });

  // Format 2: Powdered PAC
  page5.drawRectangle({ x: 220, y: cardsY, width: cardW, height: cardH, color: rgb(0.98, 0.98, 0.99), borderColor: borderLight, borderWidth: 1 });
  page5.drawLine({ start: { x: 220, y: cardsY + cardH }, end: { x: 220 + cardW, y: cardsY + cardH }, thickness: 4, color: deepForestGreen });
  drawTextSafe(page5, 'Powdered (PAC)', { x: 235, y: cardsY + cardH - 30, size: 12, font: helveticaBold, color: darkText });
  drawTextSafe(page5, 'Pulverized carbon', { x: 235, y: cardsY + cardH - 55, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'providing rapid', { x: 235, y: cardsY + cardH - 67, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'adsorption kinetics for', { x: 235, y: cardsY + cardH - 79, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'batch process units.', { x: 235, y: cardsY + cardH - 91, size: 8, font: helvetica, color: grayText });

  const pacMeshes = ['80 mesh', '200 mesh', '325 mesh'];
  pacMeshes.forEach((m, idx) => {
    drawTextSafe(page5, '[x] ' + m, { x: 235, y: cardsY + cardH - 130 - (idx * 24), size: 9, font: helveticaBold, color: copperOrange });
  });

  // Format 3: Pelletized
  page5.drawRectangle({ x: 390, y: cardsY, width: cardW, height: cardH, color: rgb(0.98, 0.98, 0.99), borderColor: borderLight, borderWidth: 1 });
  page5.drawLine({ start: { x: 390, y: cardsY + cardH }, end: { x: 390 + cardW, y: cardsY + cardH }, thickness: 4, color: deepForestGreen });
  drawTextSafe(page5, 'Pelletized', { x: 405, y: cardsY + cardH - 30, size: 12, font: helveticaBold, color: darkText });
  drawTextSafe(page5, 'Extruded cylindrical', { x: 405, y: cardsY + cardH - 55, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'pellets designed for', { x: 405, y: cardsY + cardH - 67, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'low pressure drop in', { x: 405, y: cardsY + cardH - 79, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page5, 'vapor phase systems.', { x: 405, y: cardsY + cardH - 91, size: 8, font: helvetica, color: grayText });

  const pelletMeshes = ['1.5 mm diameter', '3.0 mm diameter', '4.0 mm diameter'];
  pelletMeshes.forEach((m, idx) => {
    drawTextSafe(page5, '[x] ' + m, { x: 405, y: cardsY + cardH - 130 - (idx * 24), size: 9, font: helveticaBold, color: copperOrange });
  });

  drawFooter(page5, 'Page 05');

  // ==========================================
  // PAGE 6: GLOBAL INDUSTRY APPLICATIONS (PART 1)
  // ==========================================
  const page6 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page6, 'APPLICATIONS');

  drawTextSafe(page6, 'GLOBAL INDUSTRY APPLICATIONS', { x: 50, y: pageHeight - 95, size: 18, font: helveticaBold, color: darkText });
  page6.drawLine({ start: { x: 50, y: pageHeight - 110 }, end: { x: 545, y: pageHeight - 110 }, thickness: 2, color: copperOrange });

  // App 1: Water Purification & Treatment
  drawTextSafe(page6, '1. Water Purification & Treatment', { x: 50, y: pageHeight - 140, size: 13, font: helveticaBold, color: darkText });
  drawTextSafe(page6, 'Crucial for drinking water treatment, industrial water filtration, RO pre-treatment,', { x: 50, y: pageHeight - 160, size: 9, font: helvetica, color: grayText });
  drawTextSafe(page6, 'groundwater purification, and municipal water plants.', { x: 50, y: pageHeight - 173, size: 9, font: helvetica, color: grayText });

  const waterBullets = [
    { left: 'Removes chlorine & chloramines', right: 'Removes taste & odor compounds' },
    { left: 'Eliminates organic contaminants', right: 'Filters trace pesticides & VOCs' }
  ];
  let wby = pageHeight - 200;
  waterBullets.forEach(b => {
    drawTextSafe(page6, '[x] ' + b.left, { x: 65, y: wby, size: 8.5, font: helveticaBold, color: copperOrange });
    drawTextSafe(page6, '[x] ' + b.right, { x: 300, y: wby, size: 8.5, font: helveticaBold, color: copperOrange });
    wby -= 20;
  });

  // App 2: Air & Gas Treatment
  drawTextSafe(page6, '2. Air & Gas Filtration', { x: 50, y: pageHeight - 265, size: 13, font: helveticaBold, color: darkText });
  drawTextSafe(page6, 'Widely implemented in commercial HVAC, industrial exhaust scrubbing, and vapor recovery units.', { x: 50, y: pageHeight - 285, size: 9, font: helvetica, color: grayText });

  const airBullets = [
    { left: 'VOC (Volatile Organic Compounds) capture', right: 'Industrial solvent vapor recovery' },
    { left: 'Toxic gas abatement and flue scrubber beds', right: 'Odor control in wastewater facilities' }
  ];
  let aby = pageHeight - 310;
  airBullets.forEach(b => {
    drawTextSafe(page6, '[x] ' + b.left, { x: 65, y: aby, size: 8.5, font: helveticaBold, color: copperOrange });
    drawTextSafe(page6, '[x] ' + b.right, { x: 300, y: aby, size: 8.5, font: helveticaBold, color: copperOrange });
    aby -= 20;
  });

  // App 3: Precious Metal & Gold Recovery
  drawTextSafe(page6, '3. Gold Recovery & Metallurgy', { x: 50, y: pageHeight - 375, size: 13, font: helveticaBold, color: darkText });
  drawTextSafe(page6, 'High-hardness CSAC is the premier medium for Carbon-in-Leach (CIL) and Carbon-in-Pulp (CIP) circuits.', { x: 50, y: pageHeight - 395, size: 9, font: helvetica, color: grayText });

  const goldBullets = [
    { left: 'Abrasion resistance > 97% minimizes gold loss', right: 'High gold adsorption capacity (K-value)' },
    { left: 'Plateau loading kinetics for optimum elution', right: 'Low plate-shaped particle formation' }
  ];
  let gby = pageHeight - 420;
  goldBullets.forEach(b => {
    drawTextSafe(page6, '[x] ' + b.left, { x: 65, y: gby, size: 8.5, font: helveticaBold, color: copperOrange });
    drawTextSafe(page6, '[x] ' + b.right, { x: 300, y: gby, size: 8.5, font: helveticaBold, color: copperOrange });
    gby -= 20;
  });

  drawFooter(page6, 'Page 06');

  // ==========================================
  // PAGE 7: COMPARISON (COCONUT SHELL VS COAL) & SPECIAL SECTORS
  // ==========================================
  const page7 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page7, 'COMPARISON');

  // Top: Food & Beverage + Pharma
  page7.drawRectangle({ x: 50, y: pageHeight - 210, width: 235, height: 130, color: rgb(0.99, 0.98, 0.96), borderColor: borderLight, borderWidth: 1 });
  page7.drawLine({ start: { x: 50, y: pageHeight - 80 }, end: { x: 285, y: pageHeight - 80 }, thickness: 3, color: copperOrange });
  drawTextSafe(page7, '4. Food & Beverage', { x: 65, y: pageHeight - 105, size: 11, font: helveticaBold, color: darkText });
  drawTextSafe(page7, 'Ensures absolute purity and clarity through', { x: 65, y: pageHeight - 125, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page7, 'beverage filtration, sugar decolorization, edible', { x: 65, y: pageHeight - 137, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page7, 'oil purification, and alcohol/spirit processing.', { x: 65, y: pageHeight - 149, size: 8, font: helvetica, color: grayText });

  page7.drawRectangle({ x: 310, y: pageHeight - 210, width: 235, height: 130, color: rgb(0.99, 0.98, 0.96), borderColor: borderLight, borderWidth: 1 });
  page7.drawLine({ start: { x: 310, y: pageHeight - 80 }, end: { x: 545, y: pageHeight - 80 }, thickness: 3, color: copperOrange });
  drawTextSafe(page7, '5. Pharma & Chemical', { x: 325, y: pageHeight - 105, size: 11, font: helveticaBold, color: darkText });
  drawTextSafe(page7, 'Highly pure grades used for critical solvent recovery,', { x: 325, y: pageHeight - 125, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page7, 'chemical catalysis, and Active Pharmaceutical', { x: 325, y: pageHeight - 137, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page7, 'Ingredient (API) purification processes.', { x: 325, y: pageHeight - 149, size: 8, font: helvetica, color: grayText });

  // Main Comparison Table
  drawTextSafe(page7, 'COCONUT SHELL VS. COAL-BASED', { x: 50, y: pageHeight - 250, size: 16, font: helveticaBold, color: darkText });
  drawTextSafe(page7, "When compared to traditional coal-based carbon, PR Origin Global's Coconut Shell Activated", { x: 50, y: pageHeight - 275, size: 8.5, font: helvetica, color: grayText });
  drawTextSafe(page7, 'Carbon delivers superior mechanical and adsorptive properties, directly impacting your operational ROI.', { x: 50, y: pageHeight - 288, size: 8.5, font: helvetica, color: grayText });

  const cmpTableY = pageHeight - 320;
  const cmpRowH = 30;

  // Header
  page7.drawRectangle({ x: 50, y: cmpTableY - cmpRowH, width: 495, height: cmpRowH, color: deepForestGreen });
  drawTextSafe(page7, 'PERFORMANCE METRIC', { x: 60, y: cmpTableY - 20, size: 8, font: helveticaBold, color: pureWhite });
  drawTextSafe(page7, 'OUR COCONUT SHELL', { x: 220, y: cmpTableY - 20, size: 8, font: helveticaBold, color: goldAmber });
  drawTextSafe(page7, 'STANDARD COAL-BASED', { x: 390, y: cmpTableY - 20, size: 8, font: helveticaBold, color: pureWhite });

  const cmpData = [
    { metric: 'Material Hardness', ours: '> 95% (Ultra-durable)', coal: '~ 70% - 80% (Prone to dust)' },
    { metric: 'Ash Content', ours: '<= 5% (High purity)', coal: '8% - 15% (Higher residue)' },
    { metric: 'Surface Area (BET)', ours: 'Up to 1300 m2/g', coal: '800 - 1000 m2/g' },
    { metric: 'Pore Structure', ours: 'Predominantly Microporous', coal: 'Meso/Macroporous' },
    { metric: 'Eco-Footprint', ours: '100% Renewable Biomass', coal: 'Mined Fossil Fuel' }
  ];

  let cy = cmpTableY - cmpRowH;
  cmpData.forEach((r, idx) => {
    cy -= cmpRowH;
    const isEven = idx % 2 === 0;
    page7.drawRectangle({
      x: 50,
      y: cy,
      width: 495,
      height: cmpRowH,
      color: isEven ? pureWhite : lightGrayBg,
      borderColor: borderLight,
      borderWidth: 0.5
    });
    drawTextSafe(page7, r.metric, { x: 60, y: cy + 10, size: 8.5, font: helveticaBold, color: darkText });
    drawTextSafe(page7, r.ours, { x: 220, y: cy + 10, size: 8.5, font: helveticaBold, color: copperOrange });
    drawTextSafe(page7, r.coal, { x: 390, y: cy + 10, size: 8.5, font: helvetica, color: grayText });
  });

  drawFooter(page7, 'Page 07');

  // ==========================================
  // PAGE 8: PACKAGING & STORAGE
  // ==========================================
  const page8 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page8, 'PACKAGING & STORAGE');

  drawTextSafe(page8, 'PACKAGING & STORAGE', { x: 50, y: pageHeight - 95, size: 18, font: helveticaBold, color: darkText });
  drawTextSafe(page8, 'To ensure our high-iodine activated carbon reaches your facility in pristine, moisture-free', { x: 50, y: pageHeight - 118, size: 9, font: helvetica, color: grayText });
  drawTextSafe(page8, 'condition, we employ rigorous industrial packaging standards tailored for global maritime export.', { x: 50, y: pageHeight - 130, size: 9, font: helvetica, color: grayText });

  // Left Box: Standard Export Packaging (Dark Green)
  const pkgY = pageHeight - 440;
  page8.drawRectangle({
    x: 50,
    y: pkgY,
    width: 235,
    height: 280,
    color: forestGreenCard
  });

  drawTextSafe(page8, 'Standard Export Packaging', { x: 65, y: pkgY + 250, size: 12, font: helveticaBold, color: goldAmber });

  const stdPkg = [
    { title: '25 kg Bags:', desc: 'Multi-wall Kraft paper bags or heavy-duty PP woven bags with inner PE moisture-proof liners.' },
    { title: 'Jumbo Bags:', desc: '500 kg or 1000 kg FIBC bulk bags with inner liners and bottom discharge spouts for automated hopper feeding.' },
    { title: 'Palletization:', desc: 'Shrink-wrapped and secured on ISPM-15 compliant heat-treated export pallets.' }
  ];

  let py = pkgY + 215;
  stdPkg.forEach(p => {
    drawTextSafe(page8, '[x] ' + p.title, { x: 65, y: py, size: 8.5, font: helveticaBold, color: pureWhite });
    drawTextSafe(page8, p.desc.substring(0, 48), { x: 75, y: py - 12, size: 7.5, font: helvetica, color: rgb(0.8, 0.9, 0.85) });
    drawTextSafe(page8, p.desc.substring(48), { x: 75, y: py - 23, size: 7.5, font: helvetica, color: rgb(0.8, 0.9, 0.85) });
    py -= 55;
  });

  // Right Top Box: Custom Requirements
  page8.drawRectangle({
    x: 305,
    y: pkgY + 140,
    width: 240,
    height: 140,
    color: rgb(0.99, 0.97, 0.95),
    borderColor: rgb(0.95, 0.75, 0.6),
    borderWidth: 1
  });
  page8.drawLine({ start: { x: 305, y: pkgY + 280 }, end: { x: 545, y: pkgY + 280 }, thickness: 3, color: copperOrange });
  drawTextSafe(page8, 'Custom Requirements', { x: 320, y: pkgY + 255, size: 12, font: helveticaBold, color: copperOrange });
  drawTextSafe(page8, 'Private labeling, OEM packaging, and custom', { x: 320, y: pkgY + 230, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page8, 'weight bagging are available for wholesale distributors', { x: 320, y: pkgY + 218, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page8, 'and specific batch-dosing requirements.', { x: 320, y: pkgY + 206, size: 8, font: helvetica, color: grayText });

  // Right Bottom Box: Critical Storage & Safety
  page8.drawRectangle({
    x: 305,
    y: pkgY,
    width: 240,
    height: 125,
    color: rgb(0.99, 0.97, 0.95),
    borderColor: rgb(0.9, 0.85, 0.8),
    borderWidth: 1
  });
  page8.drawRectangle({ x: 305, y: pkgY, width: 4, height: 125, color: rgb(0.8, 0.2, 0.2) });

  drawTextSafe(page8, 'Critical Storage & Safety', { x: 320, y: pkgY + 100, size: 11, font: helveticaBold, color: rgb(0.8, 0.2, 0.2) });
  drawTextSafe(page8, 'Store in a dry, well-ventilated area away from', { x: 320, y: pkgY + 80, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page8, 'direct sunlight. Activated carbon is a strong', { x: 320, y: pkgY + 68, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page8, 'reducing agent. Keep strictly away from strong', { x: 320, y: pkgY + 56, size: 8, font: helvetica, color: grayText });
  drawTextSafe(page8, 'oxidizers to prevent spontaneous combustion.', { x: 320, y: pkgY + 44, size: 8, font: helvetica, color: grayText });

  drawFooter(page8, 'Page 08');

  // ==========================================
  // PAGE 9: EXPORT & SALES INQUIRY
  // ==========================================
  const page9 = pdfDoc.addPage([pageWidth, pageHeight]);

  drawTextSafe(page9, 'PR ORIGIN GLOBAL', { x: 195, y: pageHeight - 120, size: 22, font: helveticaBold, color: deepForestGreen });
  page9.drawLine({ start: { x: 260, y: pageHeight - 135 }, end: { x: 335, y: pageHeight - 135 }, thickness: 3, color: copperOrange });

  drawTextSafe(page9, 'READY TO UPGRADE YOUR FILTRATION?', { x: 110, y: pageHeight - 175, size: 17, font: helveticaBold, color: darkText });

  const cta1 = 'Contact our Global Export Division to discuss your specific mesh size requirements,';
  const cta2 = 'request a commercial sample, or secure forward-contract pricing for CIF/FOB delivery.';

  drawTextSafe(page9, cta1, { x: 95, y: pageHeight - 205, size: 9.5, font: helvetica, color: grayText });
  drawTextSafe(page9, cta2, { x: 105, y: pageHeight - 220, size: 9.5, font: helvetica, color: grayText });

  // Contact Center Card
  const cardBoxY = pageHeight - 560;
  page9.drawRectangle({
    x: 100,
    y: cardBoxY,
    width: 395,
    height: 300,
    color: pureWhite,
    borderColor: borderLight,
    borderWidth: 1.5
  });

  drawTextSafe(page9, 'Export & Sales Inquiry', { x: 215, y: cardBoxY + 265, size: 15, font: helveticaBold, color: darkText });

  drawTextSafe(page9, 'Executive Contact: Yogesh Patel', { x: 130, y: cardBoxY + 225, size: 11, font: helveticaBold, color: darkText });
  drawTextSafe(page9, 'FF 01, Paradise Complex, Kada Road,', { x: 130, y: cardBoxY + 205, size: 9.5, font: helvetica, color: grayText });
  drawTextSafe(page9, 'Visnagar, Gujarat, India', { x: 130, y: cardBoxY + 190, size: 9.5, font: helvetica, color: grayText });

  // Direct Mobile Box (Cream/Orange)
  page9.drawRectangle({
    x: 130,
    y: cardBoxY + 95,
    width: 335,
    height: 70,
    color: rgb(0.99, 0.97, 0.94),
    borderColor: rgb(0.95, 0.85, 0.7),
    borderWidth: 1
  });
  drawTextSafe(page9, 'Direct Mobile / WhatsApp', { x: 150, y: cardBoxY + 140, size: 9, font: helveticaBold, color: copperOrange });
  drawTextSafe(page9, '+91 97378 86587', { x: 150, y: cardBoxY + 112, size: 18, font: helveticaBold, color: darkText });

  drawTextSafe(page9, 'Email: contact@proriginglobal.com', { x: 195, y: cardBoxY + 65, size: 9.5, font: helvetica, color: grayText });
  drawTextSafe(page9, 'Web: www.proriginglobal.com', { x: 205, y: cardBoxY + 45, size: 9.5, font: helvetica, color: grayText });

  drawFooter(page9, 'Page 09');

  // ==========================================
  // PAGE 10: BACK COVER (Deep Forest Green)
  // ==========================================
  const page10 = pdfDoc.addPage([pageWidth, pageHeight]);
  page10.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: deepForestGreen
  });

  drawTextSafe(page10, 'PR', { x: 70, y: pageHeight - 160, size: 36, font: helveticaBold, color: pureWhite });
  drawTextSafe(page10, 'ORIGIN', { x: 70, y: pageHeight - 210, size: 36, font: helveticaBold, color: pureWhite });
  drawTextSafe(page10, 'GLOBAL', { x: 70, y: pageHeight - 260, size: 36, font: helveticaBold, color: pureWhite });

  page10.drawLine({ start: { x: 70, y: pageHeight - 285 }, end: { x: 170, y: pageHeight - 285 }, thickness: 3, color: copperOrange });

  drawTextSafe(page10, '"Engineered', { x: 70, y: pageHeight - 330, size: 18, font: helvetica, color: pureWhite });
  drawTextSafe(page10, 'for', { x: 70, y: pageHeight - 360, size: 18, font: helvetica, color: pureWhite });
  drawTextSafe(page10, 'Performance.', { x: 70, y: pageHeight - 390, size: 18, font: helvetica, color: pureWhite });
  drawTextSafe(page10, 'Trusted', { x: 70, y: pageHeight - 430, size: 18, font: helvetica, color: pureWhite });
  drawTextSafe(page10, 'for', { x: 70, y: pageHeight - 460, size: 18, font: helvetica, color: pureWhite });
  drawTextSafe(page10, 'Reliability."', { x: 70, y: pageHeight - 490, size: 18, font: helvetica, color: pureWhite });

  drawTextSafe(page10, 'I S O', { x: 70, y: pageHeight - 570, size: 10, font: helveticaBold, color: rgb(0.7, 0.85, 0.8) });
  drawTextSafe(page10, '9 0 0 1 : 2 0 1 5', { x: 70, y: pageHeight - 590, size: 10, font: helveticaBold, color: rgb(0.7, 0.85, 0.8) });
  drawTextSafe(page10, 'C E R T I F I E D', { x: 70, y: pageHeight - 610, size: 10, font: helveticaBold, color: rgb(0.7, 0.85, 0.8) });
  drawTextSafe(page10, 'E X P O R T E R', { x: 70, y: pageHeight - 630, size: 10, font: helveticaBold, color: rgb(0.7, 0.85, 0.8) });

  drawTextSafe(page10, 'www.proriginglobal.com', { x: 70, y: 50, size: 9, font: helvetica, color: rgb(0.7, 0.85, 0.8) });
  drawTextSafe(page10, 'Page 10', { x: pageWidth - 100, y: 50, size: 9, font: helvetica, color: rgb(0.7, 0.85, 0.8) });

  // Save the generated PDF
  const pdfBytes = await pdfDoc.save();

  // Save to root, /public, and /dist if exists
  const rootPath = path.join(__dirname, 'PR_Origin_Global_Activated_Carbon_Catalog_2026.pdf');
  const publicPath = path.join(__dirname, 'public', 'PR_Origin_Global_Activated_Carbon_Catalog_2026.pdf');
  fs.writeFileSync(rootPath, pdfBytes);
  fs.writeFileSync(publicPath, pdfBytes);

  const distPath = path.join(__dirname, 'dist', 'PR_Origin_Global_Activated_Carbon_Catalog_2026.pdf');
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.writeFileSync(distPath, pdfBytes);
  }

  console.log(`[OK] Generated 10-page Activated Carbon Catalog PDF (${pdfBytes.length} bytes) at ${publicPath}`);
}

generateCarbonCatalogPDF().catch(err => {
  console.error('[FAIL] Error generating carbon catalog PDF:', err);
  process.exit(1);
});
