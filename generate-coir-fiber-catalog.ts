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
    .replace(/“|”/g, '"')
    .replace(/✓/g, '[v]');
}

async function generateCoirFiberCatalogPDF() {
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Colors
  const darkGreen = rgb(0.08, 0.22, 0.13); // #143821
  const gold = rgb(0.83, 0.63, 0.09); // #d4a017
  const forestGreen = rgb(0.18, 0.49, 0.20); // #2e7d32
  const lightBg = rgb(0.97, 0.98, 0.97);
  const darkText = rgb(0.12, 0.15, 0.12);
  const grayText = rgb(0.4, 0.45, 0.4);
  const borderGray = rgb(0.85, 0.88, 0.85);
  const tableHeaderBg = rgb(0.12, 0.28, 0.16);

  // Load coir fiber image
  let coirImage = null;
  const imgPath = path.join(__dirname, 'public', 'coir-fiber.jpg');
  if (fs.existsSync(imgPath)) {
    try {
      const imgBytes = fs.readFileSync(imgPath);
      coirImage = await pdfDoc.embedJpg(imgBytes);
    } catch (e) {
      console.warn('Could not embed coir image:', e);
    }
  }

  const drawTextSafe = (page: any, text: string, options: any) => {
    page.drawText(safeStr(text), options);
  };

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
    return currentY;
  }

  // =========================================================================
  // PAGE 1: COVER
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Dark Green Background Frame
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
      x: width / 2 - 90,
      y: height - 120,
      width: 180,
      height: 24,
      color: rgb(0.15, 0.32, 0.2),
      borderColor: gold,
      borderWidth: 1,
    });
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: width / 2 - 62,
      y: height - 112,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Subtitle
    drawTextSafe(page, 'GLOBAL EXPORT CATALOG 2026', {
      x: width / 2 - 130,
      y: height - 155,
      size: 14,
      font: helveticaBold,
      color: gold,
    });

    // Main Title
    drawTextSafe(page, 'COCONUT FIBER / COIR', {
      x: width / 2 - 190,
      y: height - 200,
      size: 28,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    // Feature tag line
    drawTextSafe(page, 'High Tensile Strength * Rot-Resistant * Natural Bristle & Mattress Fiber', {
      x: width / 2 - 195,
      y: height - 225,
      size: 10,
      font: helvetica,
      color: rgb(0.85, 0.92, 0.85),
    });

    // Center Image or Banner
    if (coirImage) {
      const imgW = 280;
      const imgH = 170;
      page.drawImage(coirImage, {
        x: width / 2 - imgW / 2,
        y: height / 2 - 40,
        width: imgW,
        height: imgH,
      });
      page.drawRectangle({
        x: width / 2 - imgW / 2,
        y: height / 2 - 40,
        width: imgW,
        height: imgH,
        borderColor: gold,
        borderWidth: 1,
      });
    }

    // Intro Card Box
    page.drawRectangle({
      x: 75,
      y: height / 2 - 180,
      width: width - 150,
      height: 120,
      color: rgb(0.12, 0.28, 0.17),
      borderColor: rgb(0.25, 0.45, 0.3),
      borderWidth: 1,
    });

    const coverDesc = "Extracted from mature coconut husks, PR Origin Global coir fiber is a highly durable, eco-friendly material trusted in geotextiles, erosion control, mattresses, upholstery, and industrial applications globally. Every batch is meticulously cleaned, graded, and quality-tested for consistent performance.";
    drawWrappedText(page, coverDesc, 95, height / 2 - 80, width - 190, 10, 15, helvetica, rgb(0.92, 0.96, 0.92));

    // Badges Row
    const badges = ['100% NATURAL', 'BIODEGRADABLE', 'HIGH TENSILE', 'ROT-RESISTANT', 'EXPORT READY'];
    const bW = 85;
    const bStartX = width / 2 - (badges.length * (bW + 6)) / 2 + 3;
    badges.forEach((badge, idx) => {
      const bx = bStartX + idx * (bW + 6);
      page.drawRectangle({
        x: bx,
        y: height / 2 - 215,
        width: bW,
        height: 18,
        color: rgb(0.18, 0.36, 0.22),
        borderColor: gold,
        borderWidth: 0.8,
      });
      drawTextSafe(page, badge, {
        x: bx + 7,
        y: height / 2 - 210,
        size: 7,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
    });

    // Cover Footer
    drawTextSafe(page, 'PR Origin Global * Made in India | Exporting Worldwide', {
      x: width / 2 - 145,
      y: 95,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.85, 0.9, 0.85),
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Coconut Fiber / Coir Catalog 2026', { x: 45, y: 15, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 1 of 6', { x: width - 85, y: 15, size: 8, font: helvetica, color: grayText });
  }

  // =========================================================================
  // PAGE 2: WHY BUYERS CHOOSE & TECHNICAL SPECIFICATIONS
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    drawTextSafe(page, 'WHY BUYERS CHOOSE PR ORIGIN GLOBAL', {
      x: 45,
      y: height - 55,
      size: 18,
      font: helveticaBold,
      color: darkGreen,
    });

    const intro = "Our commitment to quality ensures that industrial manufacturers, agricultural distributors, and geotechnical engineers receive premium-grade coir fiber engineered for performance.";
    drawWrappedText(page, intro, 45, height - 80, width - 90, 9.5, 14, helvetica, darkText);

    // Bullets
    const bullets = [
      { title: '100% Natural, Biodegradable & Renewable:', desc: ' A sustainable alternative to synthetic fibers.' },
      { title: 'Superior Structural Integrity:', desc: ' High tensile strength and excellent durability under stress.' },
      { title: 'Weather Resilient:', desc: ' Naturally rot-resistant and highly moisture-tolerant.' },
      { title: 'Precision Graded:', desc: ' Uniform grading ensures seamless industrial processing.' },
      { title: 'Optimized Logistics:', desc: ' Export-ready compressed bales maximize container loadability.' },
      { title: 'Customization:', desc: ' Private label and OEM packaging available for global distributors.' },
    ];

    let bY = height - 120;
    for (const b of bullets) {
      drawTextSafe(page, '*', { x: 50, y: bY, size: 10, font: helveticaBold, color: forestGreen });
      drawTextSafe(page, b.title, { x: 62, y: bY, size: 9, font: helveticaBold, color: darkGreen });
      const tW = helveticaBold.widthOfTextAtSize(b.title, 9);
      drawTextSafe(page, b.desc, { x: 62 + tW, y: bY, size: 9, font: helvetica, color: darkText });
      bY -= 17;
    }

    // Header: Technical Specifications
    bY -= 10;
    page.drawLine({ start: { x: 45, y: bY - 2 }, end: { x: 45, y: bY + 12 }, thickness: 4, color: forestGreen });
    drawTextSafe(page, 'Technical Specifications', {
      x: 55,
      y: bY,
      size: 14,
      font: helveticaBold,
      color: darkGreen,
    });

    // Technical Specs Table
    const tableTop = bY - 20;
    const rowH = 22;
    const col1 = 45;
    const col2 = 230;

    page.drawRectangle({
      x: col1,
      y: tableTop - rowH,
      width: width - 90,
      height: rowH,
      color: tableHeaderBg,
    });
    drawTextSafe(page, 'Parameter', { x: col1 + 10, y: tableTop - 15, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Typical Export Specification', { x: col2 + 10, y: tableTop - 15, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });

    const specs = [
      ['Fiber Type', 'Bristle Fiber / Mattress Fiber / Mixed Fiber'],
      ['Color', 'Golden brown to dark brown'],
      ['Fiber Length', 'Bristle: 5-30 cm / Mattress: 2-15 cm'],
      ['Fiber Diameter', '0.1-0.6 mm'],
      ['Tensile Strength', '100-200 MPa (typical range)'],
      ['Elongation at Break', '15-40%'],
      ['Density', '1.15-1.46 g/cm3'],
      ['Moisture Content', '10-15%'],
      ['Lignin Content', 'Approx. 45% (Ensures rot-resistance)'],
      ['Cellulose Content', 'Approx. 43%'],
      ['Impurity / Sand Content', '<= 2-3%'],
      ['Shelf Life', '2-3 years when stored dry'],
    ];

    let rY = tableTop - rowH;
    specs.forEach(([param, val], idx) => {
      const bg = idx % 2 === 0 ? rgb(1, 1, 1) : lightBg;
      page.drawRectangle({
        x: col1,
        y: rY - rowH,
        width: width - 90,
        height: rowH,
        color: bg,
        borderColor: borderGray,
        borderWidth: 0.5,
      });
      drawTextSafe(page, param, { x: col1 + 10, y: rY - 15, size: 8.5, font: helveticaBold, color: darkText });
      drawTextSafe(page, val, { x: col2 + 10, y: rY - 15, size: 8.5, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      rY -= rowH;
    });

    drawTextSafe(page, 'Note: Values are indicative. Custom industrial specifications are available upon request.', {
      x: 45,
      y: rY - 16,
      size: 8,
      font: helveticaOblique,
      color: grayText,
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Coconut Fiber / Coir Catalog 2026', { x: 45, y: 15, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 2 of 6', { x: width - 85, y: 15, size: 8, font: helvetica, color: grayText });
  }

  // =========================================================================
  // PAGE 3: COIR GRADES & PRODUCT FORMATS
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    drawTextSafe(page, 'COIR GRADES & PRODUCT FORMATS', {
      x: 45,
      y: height - 55,
      size: 18,
      font: helveticaBold,
      color: darkGreen,
    });

    const sub = "PR Origin Global supplies a comprehensive range of coir fiber formats, customized to fit seamlessly into diverse manufacturing and environmental applications.";
    drawWrappedText(page, sub, 45, height - 78, width - 90, 9.5, 14, helvetica, darkText);

    // Table
    const tableTop = height - 120;
    const col1 = 45;
    const col2 = 180;
    const col3 = 390;
    const headerH = 24;

    page.drawRectangle({
      x: col1,
      y: tableTop - headerH,
      width: width - 90,
      height: headerH,
      color: tableHeaderBg,
    });
    drawTextSafe(page, 'Grade / Format', { x: col1 + 8, y: tableTop - 16, size: 8.5, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Description', { x: col2 + 8, y: tableTop - 16, size: 8.5, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Best For', { x: col3 + 8, y: tableTop - 16, size: 8.5, font: helveticaBold, color: rgb(1, 1, 1) });

    const grades = [
      {
        format: 'Bristle Coir Fiber',
        desc: 'Long, stiff, golden-brown fibers extracted via specialized defibering.',
        best: 'Brushes, brooms, doormats, geotextiles.',
      },
      {
        format: 'Mattress Coir Fiber',
        desc: 'Shorter, curled, softer fibers providing excellent resilience.',
        best: 'Mattresses, upholstery, cushioning.',
      },
      {
        format: 'Mixed Coir Fiber',
        desc: 'Engineered blend of bristle and mattress fibers.',
        best: 'General industrial use, automotive padding.',
      },
      {
        format: 'Coir Yarn / Twine',
        desc: 'Uniformly spun yarn derived from high-grade coir fiber.',
        best: 'Ropes, nets, mat weaving, hop vines.',
      },
      {
        format: 'Coir Rope',
        desc: 'Heavy-duty twisted coir yarn.',
        best: 'Agriculture, marine, packaging, landscaping.',
      },
      {
        format: 'Coir Geotextile',
        desc: 'Durable, open-weave or closed-weave coir fabric.',
        best: 'Erosion control, severe slope stabilization.',
      },
      {
        format: 'Erosion Control Blanket',
        desc: 'Thick, open-weave coir mesh designed for rapid vegetation.',
        best: 'Landscaping, riverbanks, highway slopes.',
      },
      {
        format: 'Rubberized Coir Sheet',
        desc: 'Coir fiber permanently bonded with natural latex rubber.',
        best: 'Mattress cores, automotive acoustic insulation.',
      },
    ];

    let gY = tableTop - headerH;
    const rH = 50;

    grades.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? rgb(1, 1, 1) : lightBg;
      page.drawRectangle({
        x: col1,
        y: gY - rH,
        width: width - 90,
        height: rH,
        color: bg,
        borderColor: borderGray,
        borderWidth: 0.5,
      });

      drawTextSafe(page, item.format, { x: col1 + 8, y: gY - 20, size: 8.5, font: helveticaBold, color: forestGreen });
      drawWrappedText(page, item.desc, col2 + 8, gY - 18, 195, 8, 12, helvetica, darkText);
      drawWrappedText(page, item.best, col3 + 8, gY - 18, 140, 8, 12, helvetica, rgb(0.25, 0.25, 0.25));

      gY -= rH;
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Coconut Fiber / Coir Catalog 2026', { x: 45, y: 15, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 3 of 6', { x: width - 85, y: 15, size: 8, font: helvetica, color: grayText });
  }

  // =========================================================================
  // PAGE 4: INDUSTRIAL APPLICATIONS & 10-STAGE PROCESS
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    drawTextSafe(page, 'INDUSTRIAL & COMMERCIAL APPLICATIONS', {
      x: 45,
      y: height - 55,
      size: 18,
      font: helveticaBold,
      color: darkGreen,
    });

    // 6 Application Cards in 2 columns
    const apps = [
      {
        num: '1. Mattresses & Upholstery',
        desc: 'Highly breathable, resilient, and dust-free coir fiber acts as an excellent organic core for premium mattresses, structural cushions, and furniture upholstery padding.',
      },
      {
        num: '2. Geotextiles & Erosion Control',
        desc: 'High-tensile coir fiber woven into robust blankets and nets. Essential for civil engineering, slope protection, riverbank restoration, and roadside landscaping.',
      },
      {
        num: '3. Brushes, Brooms & Doormats',
        desc: 'Stiff, water-resistant bristle fiber is the global standard for crafting highly durable natural cleaning brushes, commercial brooms, and heavy-duty entrance mats.',
      },
      {
        num: '4. Ropes, Twines & Packaging',
        desc: 'Exceptionally strong, rot-resistant coir yarn utilized in agriculture (hop twines), marine ropes, aquaculture, and sustainable eco-friendly packaging solutions.',
      },
      {
        num: '5. Automotive & Industrial',
        desc: 'Rubberized coir sheets provide structural insulation, vibration dampening, seating padding, and sound absorption in modern automotive manufacturing.',
      },
      {
        num: '6. Horticulture & Landscaping',
        desc: 'Short fibers and mixed grades are incorporated into growing media blends, acting as structural mulch and long-term soil conditioning agents.',
      },
    ];

    const cardW = (width - 100) / 2;
    const cardH = 76;
    const startY = height - 75;

    apps.forEach((app, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cX = 45 + col * (cardW + 10);
      const cY = startY - row * (cardH + 8) - cardH;

      page.drawRectangle({
        x: cX,
        y: cY,
        width: cardW,
        height: cardH,
        color: lightBg,
        borderColor: borderGray,
        borderWidth: 1,
      });

      drawTextSafe(page, app.num, { x: cX + 10, y: cY + cardH - 18, size: 9, font: helveticaBold, color: forestGreen });
      drawWrappedText(page, app.desc, cX + 10, cY + cardH - 32, cardW - 20, 7.5, 11, helvetica, darkText);
    });

    // 10-Stage Process Header
    const procTop = startY - 3 * (cardH + 8) - 15;
    page.drawLine({ start: { x: 45, y: procTop - 2 }, end: { x: 45, y: procTop + 14 }, thickness: 4, color: forestGreen });
    drawTextSafe(page, 'Manufacturing Excellence: The 10-Stage Process', {
      x: 55,
      y: procTop,
      size: 14,
      font: helveticaBold,
      color: darkGreen,
    });

    const stages = [
      '[v]  1. Mature Husk Collection',
      '[v]  2. Controlled Retting (Water soaking for fiber softening)',
      '[v]  3. Mechanical Defibering (Separation of pith and fiber)',
      '[v]  4. Cleaning & Dust Removal',
      '[v]  5. Precision Grading & Sieving',
      '[v]  6. Sun-Drying / Mechanical Drying (Moisture reduction)',
      '[v]  7. Laboratory Quality Testing',
      '[v]  8. Hydraulic Baling (High-density compression)',
      '[v]  9. Palletized Packing & Strapping',
    ];

    let sY = procTop - 25;
    stages.forEach((stg) => {
      page.drawRectangle({
        x: 45,
        y: sY - 6,
        width: width - 90,
        height: 22,
        color: rgb(1, 1, 1),
        borderColor: borderGray,
        borderWidth: 0.5,
      });
      drawTextSafe(page, stg, { x: 55, y: sY + 1, size: 8.5, font: helvetica, color: darkText });
      sY -= 26;
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Coconut Fiber / Coir Catalog 2026', { x: 45, y: 15, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 4 of 6', { x: width - 85, y: 15, size: 8, font: helvetica, color: grayText });
  }

  // =========================================================================
  // PAGE 5: PROCESS COMPLETION & QUALITY CONTROL INFOGRAPHIC
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    // Step 10 Box
    page.drawRectangle({
      x: 45,
      y: height - 60,
      width: width - 90,
      height: 30,
      color: rgb(1, 1, 1),
      borderColor: borderGray,
      borderWidth: 1,
    });
    drawTextSafe(page, '[v]  10. Export Container Loading', {
      x: 55,
      y: height - 42,
      size: 10.5,
      font: helveticaBold,
      color: forestGreen,
    });

    // Subheader
    drawTextSafe(page, 'MANUFACTURING QUALITY ASSURANCE & EXPORT LINE', {
      x: 45,
      y: height - 100,
      size: 15,
      font: helveticaBold,
      color: darkGreen,
    });

    const p5intro = "Every consignment of PR Origin Global coir fiber is processed through state-of-the-art hydraulic balers and tested in our on-site laboratories to meet rigorous international tensile, moisture, and purity standards before maritime container stuffing.";
    drawWrappedText(page, p5intro, 45, height - 125, width - 90, 9.5, 14, helvetica, darkText);

    // 4 Visual Feature Cards
    const fCards = [
      {
        title: 'Mature Husk Sourcing',
        detail: 'Harvested exclusively from mature coconut palms (>11 months) ensuring high lignin concentration (approx. 45%) for maximum rot resistance and structural elasticity.',
      },
      {
        title: 'Precision Mechanical Defibering',
        detail: 'Turbo-drum defibering separators isolate long bristle strands from cushioning mattress fibers while stripping dust, sand, and extraneous pith matter.',
      },
      {
        title: 'Sun-Drying & Laboratory Verification',
        detail: 'Hygienic open-air drying platforms and hot-air tunnels reduce moisture to the strict 10-15% export window, preventing mold formation during maritime container transit.',
      },
      {
        title: 'Multi-Ton Hydraulic Compression',
        detail: '100-125 kg high-density bales strapped with UV-stabilized plastic bands or steel wire, optimizing ocean freight container loadability up to 26 MT per 40ft High Cube.',
      },
    ];

    let fcY = height - 185;
    fCards.forEach((fc, idx) => {
      page.drawRectangle({
        x: 45,
        y: fcY - 80,
        width: width - 90,
        height: 75,
        color: lightBg,
        borderColor: borderGray,
        borderWidth: 1,
      });
      page.drawRectangle({
        x: 45,
        y: fcY - 80,
        width: 6,
        height: 75,
        color: forestGreen,
      });
      drawTextSafe(page, `Stage Highlight 0${idx + 1}: ${fc.title}`, {
        x: 62,
        y: fcY - 22,
        size: 10,
        font: helveticaBold,
        color: darkGreen,
      });
      drawWrappedText(page, fc.detail, 62, fcY - 38, width - 130, 8.5, 12.5, helvetica, darkText);
      fcY -= 92;
    });

    // Global Export Seal Box
    page.drawRectangle({
      x: 45,
      y: 70,
      width: width - 90,
      height: 90,
      color: darkGreen,
      borderColor: gold,
      borderWidth: 1.5,
    });
    drawTextSafe(page, 'PR ORIGIN GLOBAL - QUALITY GUARANTEED EXPORTS', {
      x: width / 2 - 140,
      y: 135,
      size: 10.5,
      font: helveticaBold,
      color: gold,
    });
    drawTextSafe(page, 'All export consignments are inspected for tensile integrity, fiber length distribution,', {
      x: width / 2 - 185,
      y: 115,
      size: 8.5,
      font: helvetica,
      color: rgb(0.9, 0.95, 0.9),
    });
    drawTextSafe(page, 'and phytosanitary compliance prior to customs dispatch from Indian ocean terminals.', {
      x: width / 2 - 185,
      y: 100,
      size: 8.5,
      font: helvetica,
      color: rgb(0.9, 0.95, 0.9),
    });
    drawTextSafe(page, 'Tuticorin & Cochin Sea Ports, India * Direct Vessel Connections Worldwide', {
      x: width / 2 - 160,
      y: 84,
      size: 8.5,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Coconut Fiber / Coir Catalog 2026', { x: 45, y: 15, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 5 of 6', { x: width - 85, y: 15, size: 8, font: helvetica, color: grayText });
  }

  // =========================================================================
  // PAGE 6: PACKAGING, LOGISTICS & QUALITY ASSURANCE
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 8, width: width, height: 8, color: forestGreen });

    drawTextSafe(page, 'PACKAGING, LOGISTICS & QUALITY ASSURANCE', {
      x: 45,
      y: height - 55,
      size: 18,
      font: helveticaBold,
      color: darkGreen,
    });

    // Subheader: Packaging & Global Logistics
    page.drawLine({ start: { x: 45, y: height - 82 }, end: { x: 45, y: height - 68 }, thickness: 4, color: forestGreen });
    drawTextSafe(page, 'Packaging & Global Logistics', {
      x: 55,
      y: height - 80,
      size: 13,
      font: helveticaBold,
      color: darkGreen,
    });

    // Table
    const tableTop = height - 95;
    const col1 = 45;
    const col2 = 180;
    const col3 = 330;
    const rH = 20;

    page.drawRectangle({
      x: col1,
      y: tableTop - rH,
      width: width - 90,
      height: rH,
      color: tableHeaderBg,
    });
    drawTextSafe(page, 'Format', { x: col1 + 8, y: tableTop - 14, size: 8.5, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Weight / Size', { x: col2 + 8, y: tableTop - 14, size: 8.5, font: helveticaBold, color: rgb(1, 1, 1) });
    drawTextSafe(page, 'Container Loadability', { x: col3 + 8, y: tableTop - 14, size: 8.5, font: helveticaBold, color: rgb(1, 1, 1) });

    const logRows = [
      ['Compressed Bales', '100 - 125 kg', '20ft: 12-14 MT / 40ft HC: 24-26 MT'],
      ['Small Bales', '20 - 50 kg', 'Custom loaded based on palletization'],
      ['Coir Yarn Hanks', '10 - 25 kg', 'Custom loaded'],
      ['Coir Rope Coils', '10 - 50 kg', 'Custom loaded'],
      ['Geotextile Rolls', 'Custom width/length', 'Custom loaded to maximize volume'],
    ];

    let ly = tableTop - rH;
    logRows.forEach(([f, w, c], idx) => {
      const bg = idx % 2 === 0 ? rgb(1, 1, 1) : lightBg;
      page.drawRectangle({
        x: col1,
        y: ly - rH,
        width: width - 90,
        height: rH,
        color: bg,
        borderColor: borderGray,
        borderWidth: 0.5,
      });
      drawTextSafe(page, f, { x: col1 + 8, y: ly - 14, size: 8, font: helveticaBold, color: darkText });
      drawTextSafe(page, w, { x: col2 + 8, y: ly - 14, size: 8, font: helvetica, color: darkText });
      drawTextSafe(page, c, { x: col3 + 8, y: ly - 14, size: 8, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      ly -= rH;
    });

    // Logistics Terms Box
    ly -= 15;
    page.drawRectangle({
      x: col1,
      y: ly - 65,
      width: width - 90,
      height: 65,
      color: lightBg,
      borderColor: borderGray,
      borderWidth: 1,
    });
    drawTextSafe(page, 'MOQ: 1 pallet for trial orders / 1 FCL for wholesale.', { x: col1 + 12, y: ly - 18, size: 8.5, font: helveticaBold, color: darkGreen });
    drawTextSafe(page, 'Incoterms: FOB, CIF, CFR.', { x: col1 + 12, y: ly - 32, size: 8.5, font: helvetica, color: darkText });
    drawTextSafe(page, 'Port of Loading: India.', { x: col1 + 12, y: ly - 46, size: 8.5, font: helvetica, color: darkText });
    drawTextSafe(page, 'Private Label / OEM: Available for all compressed bales and retail formats.', { x: col1 + 12, y: ly - 60, size: 8.5, font: helveticaBold, color: forestGreen });

    // Certifications & Quality Standards
    ly -= 90;
    page.drawLine({ start: { x: 45, y: ly - 2 }, end: { x: 45, y: ly + 12 }, thickness: 4, color: forestGreen });
    drawTextSafe(page, 'Certifications & Quality Standards', {
      x: 55,
      y: ly,
      size: 13,
      font: helveticaBold,
      color: darkGreen,
    });

    drawTextSafe(page, 'PR Origin Global guarantees uncompromised quality through rigorous international compliance:', {
      x: 45,
      y: ly - 18,
      size: 8.5,
      font: helvetica,
      color: darkText,
    });

    const certs = [
      '* ISO 9001:2015 Certified Quality Management System',
      '* Coir Board Registered Exporter (Government of India)',
      '* Phytosanitary Certificate issued for every export shipment',
      '* ISPM 15 Compliant Heat-Treated Export Pallets',
      '* OMRI Listed & RHP Certified (For applicable horticultural coir grades)',
      '* Batch Traceability & Lab Testing for moisture, impurities, and tensile strength',
    ];

    let cy = ly - 35;
    certs.forEach(cert => {
      drawTextSafe(page, cert, { x: 50, y: cy, size: 8.5, font: helvetica, color: darkText });
      cy -= 15;
    });

    // Direct Export Inquiries & Orders Box
    cy -= 12;
    page.drawRectangle({
      x: 45,
      y: cy - 130,
      width: width - 90,
      height: 130,
      color: darkGreen,
      borderColor: gold,
      borderWidth: 1.5,
    });

    drawTextSafe(page, 'Direct Export Inquiries & Orders', {
      x: 65,
      y: cy - 22,
      size: 12,
      font: helveticaBold,
      color: gold,
    });
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: 65,
      y: cy - 40,
      size: 11,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    drawTextSafe(page, 'Executive Contact: Yogesh Patel', {
      x: 65,
      y: cy - 56,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.9, 0.95, 0.9),
    });
    drawTextSafe(page, 'Address: FF 01, Paradise Complex, Kada Road, Visnagar, Gujarat, India', {
      x: 65,
      y: cy - 72,
      size: 8.5,
      font: helvetica,
      color: rgb(0.85, 0.9, 0.85),
    });
    drawTextSafe(page, 'Phone / WhatsApp: +91 97378 86587  |  Alternate Export Desk: +91 90852 72829', {
      x: 65,
      y: cy - 88,
      size: 8.5,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    drawTextSafe(page, 'Email: contact@proriginglobal.com', {
      x: 65,
      y: cy - 104,
      size: 8.5,
      font: helvetica,
      color: rgb(0.85, 0.9, 0.85),
    });
    drawTextSafe(page, 'Website: www.proriginglobal.com', {
      x: 65,
      y: cy - 120,
      size: 8.5,
      font: helveticaBold,
      color: gold,
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL - Coconut Fiber / Coir Catalog 2026', { x: 45, y: 15, size: 8, font: helvetica, color: grayText });
    drawTextSafe(page, 'Page 6 of 6', { x: width - 85, y: 15, size: 8, font: helvetica, color: grayText });
  }

  const pdfBytes = await pdfDoc.save();
  const outPathPublic = path.join(__dirname, 'public', 'PR_Origin_Global_Coir_Fiber_Catalog_2026.pdf');
  const outPathRoot = path.join(__dirname, 'PR_Origin_Global_Coir_Fiber_Catalog_2026.pdf');
  fs.writeFileSync(outPathPublic, pdfBytes);
  fs.writeFileSync(outPathRoot, pdfBytes);
  console.log(`[COIR FIBER CATALOG] Generated 6-page PDF (${pdfBytes.length} bytes) at ${outPathPublic}`);
}

generateCoirFiberCatalogPDF().catch(console.error);
