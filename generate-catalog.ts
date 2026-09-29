import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function safeStr(s: string): string {
  if (!s) return '';
  return s
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/[–—]/g, '-')
    .replace(/•/g, '*')
    .replace(/×/g, 'x')
    .replace(/…/g, '...')
    .replace(/’|‘/g, "'")
    .replace(/“|”/g, '"');
}

async function generateCatalogPDF() {
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Palette
  const darkGreen = rgb(0.08, 0.22, 0.13); // #143821
  const gold = rgb(0.83, 0.63, 0.09); // #d4a017
  const forestGreen = rgb(0.18, 0.49, 0.20); // #2e7d32
  const lightBg = rgb(0.97, 0.98, 0.97);
  const darkText = rgb(0.12, 0.15, 0.12);
  const grayText = rgb(0.4, 0.45, 0.4);
  const borderGray = rgb(0.85, 0.88, 0.85);
  const tableHeaderBg = rgb(0.12, 0.28, 0.16);

  // Load cocopeat image if available
  let embeddedImage = null;
  const imgPath = path.join(__dirname, 'public', 'cocopeat_5kg_block.png');
  if (fs.existsSync(imgPath)) {
    try {
      const imgBytes = fs.readFileSync(imgPath);
      embeddedImage = await pdfDoc.embedPng(imgBytes);
    } catch (e) {
      console.warn('Could not embed image:', e);
    }
  }

  // Helper to draw text with safeStr
  const drawTextSafe = (page: any, text: string, options: any) => {
    page.drawText(safeStr(text), options);
  };

  // ---------------- PAGE 1: COVER ----------------
  {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Dark Forest Green Card / Frame
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      color: darkGreen,
      borderColor: gold,
      borderWidth: 1.5,
    });

    // Top Tag Badge
    page.drawRectangle({
      x: width / 2 - 140,
      y: height - 140,
      width: 280,
      height: 24,
      color: rgb(0.15, 0.32, 0.2),
      borderColor: gold,
      borderWidth: 1,
    });
    drawTextSafe(page, 'G L O B A L   M A S T E R   C A T A L O G   2 0 2 6', {
      x: width / 2 - 122,
      y: height - 132,
      size: 9,
      font: helveticaBold,
      color: rgb(0.9, 0.95, 0.9),
    });

    // Brand Name
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: width / 2 - 140,
      y: height - 185,
      size: 26,
      font: helveticaBold,
      color: gold,
    });

    // Subtitle
    drawTextSafe(page, 'PREMIUM COCOPEAT', {
      x: width / 2 - 195,
      y: height - 230,
      size: 34,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    drawTextSafe(page, '100% Natural, Buffered & Organic Growing Media Solutions', {
      x: width / 2 - 185,
      y: height - 265,
      size: 13,
      font: helvetica,
      color: rgb(0.85, 0.92, 0.85),
    });

    // Center Image
    if (embeddedImage) {
      const imgWidth = 260;
      const imgHeight = 260;
      page.drawImage(embeddedImage, {
        x: width / 2 - imgWidth / 2,
        y: height / 2 - 150,
        width: imgWidth,
        height: imgHeight,
      });
    } else {
      page.drawRectangle({
        x: width / 2 - 120,
        y: height / 2 - 100,
        width: 240,
        height: 200,
        color: rgb(0.15, 0.3, 0.18),
        borderColor: gold,
        borderWidth: 1,
      });
      drawTextSafe(page, '5 KG COMPRESSED COCOPEAT BALE', {
        x: width / 2 - 105,
        y: height / 2,
        size: 11,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
    }

    // Cover Footer Info
    drawTextSafe(page, 'PR Origin Global Export Division  *  www.proriginglobal.com  *  contact@proriginglobal.com', {
      x: width / 2 - 195,
      y: 95,
      size: 9,
      font: helvetica,
      color: rgb(0.75, 0.82, 0.75),
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Global Product Catalog 2026', {
      x: 45,
      y: 15,
      size: 8,
      font: helvetica,
      color: grayText,
    });
    drawTextSafe(page, 'Page 1 of 5', {
      x: width - 85,
      y: 15,
      size: 8,
      font: helvetica,
      color: grayText,
    });
  }

  // ---------------- PAGE 2: ABOUT & TECHNICAL SPECIFICATIONS ----------------
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 0,
      y: height - 8,
      width: width,
      height: 8,
      color: forestGreen,
    });

    drawTextSafe(page, 'About PR Origin Global', {
      x: 45,
      y: height - 60,
      size: 22,
      font: timesBold,
      color: darkGreen,
    });

    const aboutP1 = "PR Origin Global is a premier manufacturer and international exporter of high-grade organic growing media. We harness advanced washing, buffering, and compression technologies to transform raw coconut husks into premium, eco-friendly substrates. Serving commercial growers, greenhouse operators, and agricultural distributors worldwide, our products provide exceptional aeration, water retention, and structural stability.";

    drawWrappedText(page, aboutP1, 45, height - 90, width - 90, 10.5, 16, helvetica, darkText);

    // Commitment Callout Card
    page.drawRectangle({
      x: 45,
      y: height - 210,
      width: width - 90,
      height: 52,
      color: lightBg,
      borderColor: borderGray,
      borderWidth: 1,
    });
    page.drawLine({
      start: { x: 45, y: height - 210 },
      end: { x: 45, y: height - 158 },
      thickness: 4,
      color: forestGreen,
    });
    drawTextSafe(page, 'Our Commitment:', {
      x: 58,
      y: height - 180,
      size: 10.5,
      font: helveticaBold,
      color: darkGreen,
    });
    const commitText = "Every batch produced by PR Origin Global adheres to strict international export standards, ensuring pathogen-free, uniform, and sustainable peat-free cultivation.";
    drawWrappedText(page, commitText, 155, height - 180, width - 215, 9.5, 14, helvetica, darkText);

    // Core Technical Specifications Section
    page.drawLine({
      start: { x: 45, y: height - 238 },
      end: { x: 45, y: height - 253 },
      thickness: 4,
      color: forestGreen,
    });
    drawTextSafe(page, 'Core Technical Specifications', {
      x: 55,
      y: height - 251,
      size: 15,
      font: helveticaBold,
      color: darkGreen,
    });

    // Technical Specs Table
    const tableTop = height - 275;
    const col1 = 45;
    const col2 = 185;
    const col3 = 360;
    const rowH = 26;

    page.drawRectangle({
      x: 45,
      y: tableTop - rowH,
      width: width - 90,
      height: rowH,
      color: tableHeaderBg,
    });
    drawTextSafe(page, 'Parameter', { x: col1 + 10, y: tableTop - 18, size: 9.5, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Standard Value', { x: col2 + 10, y: tableTop - 18, size: 9.5, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Testing / Export Notes', { x: col3 + 10, y: tableTop - 18, size: 9.5, font: helveticaBold, color: rgb(1, 1, 1) });

    const specsRows = [
      ['pH Range', '5.5 - 6.8 (Low EC) / 5.4 - 6.4 (High EC)', '1:1.5 Water Extraction Method'],
      ['Electrical Conductivity (EC)', 'Low EC: < 0.5 mS/cm; High EC: < 0.9 mS/cm', '1:1.5 Extract (dS/m at 25°C)'],
      ['Moisture Content', '10% - 15%', 'Sun-dried, optimized for safe maritime transit'],
      ['Compression Ratio', '5:1 (Blocks) / 8:1 (Briquettes)', 'High hydraulic density for logistics efficiency'],
      ['Expansion Rate', '12 - 18 Litres per kg', 'Grade-dependent volumetric yield'],
      ['Sand & Impurity Content', '<= 2%', 'Cleaned via advanced mechanical screening']
    ];

    specsRows.forEach((row, i) => {
      const y = tableTop - rowH * (i + 2);
      const bg = i % 2 === 0 ? rgb(1, 1, 1) : lightBg;
      page.drawRectangle({
        x: 45,
        y: y,
        width: width - 90,
        height: rowH,
        color: bg,
        borderColor: borderGray,
        borderWidth: 0.5,
      });
      drawTextSafe(page, row[0], { x: col1 + 10, y: y + 8, size: 9, font: helveticaBold, color: darkText });
      drawTextSafe(page, row[1], { x: col2 + 10, y: y + 8, size: 8.5, font: helvetica, color: darkText });
      drawTextSafe(page, row[2], { x: col3 + 10, y: y + 8, size: 8.5, font: helvetica, color: grayText });
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Global Product Catalog 2026', { x: 45, y: 25, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 2 of 5', { x: width - 85, y: 25, size: 8, font: helvetica, color: grayText });
  }

  // ---------------- PAGE 3: COCOPEAT GRADES & PARTICLE SIZING ----------------
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    drawTextSafe(page, 'Cocopeat Grades & Particle Sizing', {
      x: 45,
      y: height - 60,
      size: 22,
      font: timesBold,
      color: darkGreen,
    });

    const intro3 = "PR Origin Global processes raw pith into specific particle structures designed to match diverse root zone requirements and crop types.";
    drawTextSafe(page, intro3, { x: 45, y: height - 85, size: 10, font: helvetica, color: darkText });

    // Banner area
    page.drawRectangle({
      x: 45,
      y: height - 275,
      width: width - 90,
      height: 170,
      color: rgb(0.94, 0.95, 0.93),
      borderColor: borderGray,
      borderWidth: 1,
    });
    if (embeddedImage) {
      page.drawImage(embeddedImage, {
        x: 65,
        y: height - 265,
        width: 150,
        height: 150,
      });
      drawTextSafe(page, 'HYDRAULIC COMPRESSED 5KG BALES', {
        x: 235,
        y: height - 160,
        size: 13,
        font: helveticaBold,
        color: darkGreen,
      });
      drawTextSafe(page, '* Uniform 30x30x10cm calibrated dimension', {
        x: 235,
        y: height - 185,
        size: 9.5,
        font: helvetica,
        color: darkText,
      });
      drawTextSafe(page, '* Expands to 75 - 80 Litres upon hydration', {
        x: 235,
        y: height - 205,
        size: 9.5,
        font: helvetica,
        color: darkText,
      });
      drawTextSafe(page, '* Triple-washed freshwater desalinated grade', {
        x: 235,
        y: height - 225,
        size: 9.5,
        font: helvetica,
        color: darkText,
      });
    }

    // 2x2 Grid of Grades
    const gridY = height - 295;
    const cardW = (width - 90 - 15) / 2;
    const cardH = 160;

    const grades = [
      {
        title: 'Fine Grade (4-6 mm)',
        expansion: 'Expansion: 15 L/kg',
        bestFor: 'Best For: Seed raising trays, turf dressing, golf greens, and plug propagation.',
        benefits: 'Benefits: Rapid water uptake and superior seed-to-media contact.'
      },
      {
        title: 'Standard Grade (8 mm)',
        expansion: 'Expansion: 18 L/kg',
        bestFor: 'Best For: Potting mixes, nurseries, and landscaping soil conditioning.',
        benefits: 'Benefits: Balanced aeration and moisture holding capacity.'
      },
      {
        title: 'Coarse Grade (Un-sieved)',
        expansion: 'Expansion: 12 L/kg',
        bestFor: 'Best For: Cool-season crops, orchids, and high-drainage setups.',
        benefits: 'Benefits: Enhanced macro-porosity and root oxygenation.'
      },
      {
        title: 'Fibre-Mixed Blend',
        expansion: 'Expansion: Custom (Varies)',
        bestFor: 'Best For: Strawberry grow bags and long-cycle crops.',
        benefits: 'Benefits: Incorporates 10%-30% natural coir fibers for longevity.'
      }
    ];

    grades.forEach((g, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 45 + col * (cardW + 15);
      const y = gridY - (row + 1) * cardH - row * 15;

      page.drawRectangle({
        x: x,
        y: y,
        width: cardW,
        height: cardH,
        color: rgb(1, 1, 1),
        borderColor: borderGray,
        borderWidth: 1,
      });

      drawTextSafe(page, g.title, { x: x + 14, y: y + cardH - 24, size: 12, font: helveticaBold, color: darkGreen });
      drawTextSafe(page, g.expansion, { x: x + 14, y: y + cardH - 44, size: 9.5, font: helveticaBold, color: forestGreen });
      drawWrappedText(page, g.bestFor, x + 14, y + cardH - 64, cardW - 28, 8.5, 12.5, helvetica, darkText);
      drawWrappedText(page, g.benefits, x + 14, y + cardH - 112, cardW - 28, 8.5, 12.5, helveticaOblique, grayText);
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Global Product Catalog 2026', { x: 45, y: 25, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 3 of 5', { x: width - 85, y: 25, size: 8, font: helvetica, color: grayText });
  }

  // ---------------- PAGE 4: COMMERCIAL PRODUCT FORMATS & 10-STAGE PROCESS ----------------
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    drawTextSafe(page, 'Commercial Product Formats & Packaging', {
      x: 45,
      y: height - 60,
      size: 22,
      font: timesBold,
      color: darkGreen,
    });

    const intro4 = "Our products are custom-packaged to suit commercial greenhouse operations, retail distribution networks, and bulk horticultural blending plants.";
    drawWrappedText(page, intro4, 45, height - 85, width - 90, 9.5, 14, helvetica, darkText);

    // Formats Table
    const tableTop4 = height - 125;
    const col4_1 = 45;
    const col4_2 = 160;
    const col4_3 = 290;
    const col4_4 = 390;
    const rowH4 = 34;

    page.drawRectangle({
      x: 45,
      y: tableTop4 - 24,
      width: width - 90,
      height: 24,
      color: tableHeaderBg,
    });
    drawTextSafe(page, 'Product Format', { x: col4_1 + 8, y: tableTop4 - 17, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Dimensions / Weight', { x: col4_2 + 8, y: tableTop4 - 17, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Volumetric Expansion', { x: col4_3 + 8, y: tableTop4 - 17, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Primary Application', { x: col4_4 + 8, y: tableTop4 - 17, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });

    const formatsData = [
      ['5 kg Compressed Blocks', '30 x 30 x 10 cm | 5.0 kg', '75 - 80 Litres', 'Commercial nurseries and greenhouse substrate preparation.'],
      ['650 g Briquettes', '20 x 10 x 5 cm | 0.65 kg', '9 Litres', 'Retail garden centers and urban home gardening.'],
      ['Grow Bags / Slabs', '100 x 18 x 4 cm (Compressed)', 'Expands to 100 x 18 x 16 cm', 'Hydroponic tomato, pepper, and berry production.'],
      ['25 kg Loose Bags', 'Heavy-Duty Poly Bag', '200 Litres', 'Ready-to-use potting lines requiring zero pre-soaking.']
    ];

    formatsData.forEach((row, i) => {
      const y = tableTop4 - 24 - rowH4 * (i + 1);
      const bg = i % 2 === 0 ? rgb(1, 1, 1) : lightBg;
      page.drawRectangle({
        x: 45,
        y: y,
        width: width - 90,
        height: rowH4,
        color: bg,
        borderColor: borderGray,
        borderWidth: 0.5,
      });
      drawTextSafe(page, row[0], { x: col4_1 + 8, y: y + 14, size: 8.5, font: helveticaBold, color: darkText });
      drawTextSafe(page, row[1], { x: col4_2 + 8, y: y + 14, size: 8, font: helvetica, color: darkText });
      drawTextSafe(page, row[2], { x: col4_3 + 8, y: y + 14, size: 8, font: helveticaBold, color: forestGreen });
      drawWrappedText(page, row[3], col4_4 + 8, y + 22, width - 90 - (col4_4 - 45) - 16, 7.5, 10.5, helvetica, grayText);
    });

    // Manufacturing Excellence Section
    const mfgTop = height - 325;
    page.drawLine({
      start: { x: 45, y: mfgTop },
      end: { x: 45, y: mfgTop - 15 },
      thickness: 4,
      color: forestGreen,
    });
    drawTextSafe(page, 'Manufacturing Excellence: The 10-Stage Process', {
      x: 55,
      y: mfgTop - 13,
      size: 15,
      font: helveticaBold,
      color: darkGreen,
    });

    const mfgIntro = "At PR Origin Global, quality is guaranteed through a rigorous 10-stage production methodology:";
    drawTextSafe(page, mfgIntro, { x: 45, y: mfgTop - 38, size: 9.5, font: helvetica, color: darkText });

    const stages = [
      '1. Husk Selection (semi-mature coconuts)',
      '2. Controlled Retting',
      '3. Mechanical Defibering',
      '4. Multi-Stage Fresh Water Washing',
      '5. Sun-Drying (below 15% moisture)',
      '6. Precision Sieving & Grading',
      '7. Calcium-Magnesium Buffering',
      '8. Hydraulic Compacting',
      '9. Laboratory Quality Testing (EC, pH, Sand %)',
      '10. Palletized Export Packing'
    ];

    stages.forEach((stage, i) => {
      const col = i < 5 ? 0 : 1;
      const row = i % 5;
      const x = 45 + col * 260;
      const y = mfgTop - 68 - row * 38;

      page.drawRectangle({
        x: x,
        y: y,
        width: 245,
        height: 30,
        color: rgb(0.97, 0.99, 0.97),
        borderColor: rgb(0.8, 0.88, 0.8),
        borderWidth: 0.75,
      });

      drawTextSafe(page, stage, {
        x: x + 8,
        y: y + 10,
        size: 7.8,
        font: helveticaBold,
        color: darkGreen,
      });
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Global Product Catalog 2026', { x: 45, y: 25, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 4 of 5', { x: width - 85, y: 25, size: 8, font: helvetica, color: grayText });
  }

  // ---------------- PAGE 5: APPLICATIONS, CERTIFICATIONS & LOGISTICS ----------------
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    drawTextSafe(page, 'Sector-Specific Applications & Certifications', {
      x: 45,
      y: height - 60,
      size: 22,
      font: timesBold,
      color: darkGreen,
    });

    // 1. Hydroponics
    drawTextSafe(page, '1. Hydroponics & Controlled Environment Agriculture', {
      x: 45,
      y: height - 95,
      size: 11,
      font: helveticaBold,
      color: darkGreen,
    });
    const hydroDesc = "Our buffered low-EC coco peat slabs provide an inert, sterile root zone with optimal cation exchange capacity, widely deployed in drip-irrigated commercial greenhouses.";
    drawWrappedText(page, hydroDesc, 45, height - 112, width - 90, 9.5, 14, helvetica, darkText);

    // 2. Professional Horticulture
    drawTextSafe(page, '2. Professional Horticulture & Landscaping', {
      x: 45,
      y: height - 155,
      size: 11,
      font: helveticaBold,
      color: darkGreen,
    });
    const hortDesc = "Replaces traditional peat moss in seedling trays and container nurseries, eliminating soil-borne pathogens while improving moisture retention in arid climates.";
    drawWrappedText(page, hortDesc, 45, height - 172, width - 90, 9.5, 14, helvetica, darkText);

    // Global Market Certifications
    const certTop = height - 230;
    page.drawLine({
      start: { x: 45, y: certTop },
      end: { x: 45, y: certTop - 15 },
      thickness: 4,
      color: forestGreen,
    });
    drawTextSafe(page, 'Global Market Certifications & Quality Assurance', {
      x: 55,
      y: certTop - 13,
      size: 15,
      font: helveticaBold,
      color: darkGreen,
    });

    // Cert Card Box
    page.drawRectangle({
      x: 45,
      y: certTop - 95,
      width: width - 90,
      height: 68,
      color: lightBg,
      borderColor: borderGray,
      borderWidth: 1,
    });
    drawTextSafe(page, 'Certified Compliance:', {
      x: 58,
      y: certTop - 45,
      size: 9.5,
      font: helveticaBold,
      color: forestGreen,
    });
    const certText = "PR Origin Global products meet stringent international standards, holding ISO 9001:2015 (SGS & UKAS), OMRI Certification for organic production, RHP European Standards, and full Phytosanitary export clearance with ISPM 15 heat-treated pallets.";
    drawWrappedText(page, certText, 58, certTop - 62, width - 116, 9, 13.5, helvetica, darkText);

    // Logistics & Ordering Information
    const logTop = certTop - 130;
    drawTextSafe(page, 'Logistics & Ordering Information', {
      x: 45,
      y: logTop,
      size: 13,
      font: helveticaBold,
      color: darkGreen,
    });

    const logText = "Supplied in 40ft High Cube containers (approx. 24-26 metric tons per FCL). Minimum Order Quantity (MOQ): 1 pallet for trial orders or 1 full container load (FCL) for wholesale distribution. Custom private labeling and OEM packaging available upon request.";
    drawWrappedText(page, logText, 45, logTop - 22, width - 90, 9.5, 14.5, helvetica, darkText);

    // Contact Box / Footer Callout
    page.drawRectangle({
      x: 45,
      y: 110,
      width: width - 90,
      height: 95,
      color: darkGreen,
      borderColor: gold,
      borderWidth: 1.5,
    });
    drawTextSafe(page, 'PR ORIGIN GLOBAL EXPORT DIVISION', {
      x: width / 2 - 120,
      y: 180,
      size: 12,
      font: helveticaBold,
      color: gold,
    });
    drawTextSafe(page, 'Global Headquarters & Maritime Export Terminals (Tuticorin / Cochin Ports, India)', {
      x: width / 2 - 180,
      y: 160,
      size: 9,
      font: helvetica,
      color: rgb(0.9, 0.95, 0.9),
    });
    drawTextSafe(page, 'Inquiries: contact@proriginglobal.com  |  Export Desk: +91 90852 72829  |  Direct: +91 97378 86587', {
      x: width / 2 - 230,
      y: 140,
      size: 9,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    drawTextSafe(page, 'Web: www.proriginglobal.com  *  B2B Container Contract Desk', {
      x: width / 2 - 145,
      y: 122,
      size: 8.5,
      font: helvetica,
      color: rgb(0.8, 0.88, 0.8),
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Global Product Catalog 2026', { x: 45, y: 25, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 5 of 5', { x: width - 85, y: 25, size: 8, font: helvetica, color: grayText });
  }

  // Helper function to draw wrapped text
  function drawWrappedText(page: any, text: string, x: number, y: number, maxWidth: number, fontSize: number, lineHeight: number, font: any, color: any) {
    const words = safeStr(text).split(' ');
    let currentLine = '';
    let currentY = y;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && currentLine) {
        page.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
        currentLine = word;
        currentY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, 'public', 'PR_Origin_Global_Master_Catalog_2026.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`[CATALOG] Successfully generated catalog PDF at ${outPath} (${pdfBytes.length} bytes)`);
}

generateCatalogPDF().catch(console.error);
