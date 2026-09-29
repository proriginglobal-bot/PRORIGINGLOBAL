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
    .replace(/✓/g, '[v]');
}

async function generateCharcoalCatalogPDF() {
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Palette matching dark high-carbon industrial theme & PDF screenshot
  const darkCarbonBg = rgb(0.11, 0.12, 0.13); // #1c1f22
  const cardDark = rgb(0.15, 0.16, 0.18);
  const charcoalBlack = rgb(0.08, 0.08, 0.09);
  const amberGold = rgb(0.88, 0.55, 0.12); // #e08c1e
  const gold = rgb(0.92, 0.70, 0.15); // #ebb226
  const pureWhite = rgb(1, 1, 1);
  const lightGray = rgb(0.85, 0.86, 0.88);
  const darkText = rgb(0.12, 0.15, 0.18);
  const borderLine = rgb(0.82, 0.84, 0.86);

  // Load Charcoal Image
  let charcoalImg = null;
  const imgPath = path.join(__dirname, 'public', 'coconut-shell-charcoal.jpg');
  if (fs.existsSync(imgPath)) {
    try {
      const imgBytes = fs.readFileSync(imgPath);
      charcoalImg = await pdfDoc.embedJpg(imgBytes);
    } catch (e) {
      console.warn('Could not embed charcoal image:', e);
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
  // PAGE 1: COVER (Industrial High-Carbon Aesthetic)
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Deep Dark Carbon Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: darkCarbonBg,
    });

    // Outer decorative border
    page.drawRectangle({
      x: 35,
      y: 35,
      width: width - 70,
      height: height - 70,
      borderColor: amberGold,
      borderWidth: 1.5,
    });

    // Top brand text
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: 65,
      y: height - 100,
      size: 24,
      font: helveticaBold,
      color: amberGold,
    });
    drawTextSafe(page, 'GLOBAL EXPORT DIVISION', {
      x: 65,
      y: height - 120,
      size: 10,
      font: helveticaBold,
      color: lightGray,
    });

    // Divider line
    page.drawLine({
      start: { x: 65, y: height - 130 },
      end: { x: 180, y: height - 130 },
      thickness: 2,
      color: amberGold,
    });

    // Category Eyebrow
    drawTextSafe(page, 'HIGH CARBON - ENERGY & SMELTING', {
      x: 65,
      y: height - 210,
      size: 13,
      font: helveticaBold,
      color: lightGray,
    });

    // Main Title
    drawTextSafe(page, 'COCONUT SHELL', {
      x: 65,
      y: height - 265,
      size: 38,
      font: helveticaBold,
      color: pureWhite,
    });
    drawTextSafe(page, 'CHARCOAL', {
      x: 65,
      y: height - 315,
      size: 42,
      font: helveticaBold,
      color: amberGold,
    });

    // Subtitle
    drawWrappedText(
      page,
      'Delivering sustainable, high-performance biomass energy solutions to heavy industry worldwide.',
      65,
      height - 355,
      width - 130,
      12.5,
      18,
      helvetica,
      lightGray
    );

    // Charcoal Photo Mockup Box
    if (charcoalImg) {
      const imgWidth = 360;
      const imgHeight = 220;
      const imgX = (width - imgWidth) / 2;
      const imgY = height - 620;

      page.drawRectangle({
        x: imgX - 6,
        y: imgY - 6,
        width: imgWidth + 12,
        height: imgHeight + 12,
        color: cardDark,
        borderColor: amberGold,
        borderWidth: 1,
      });

      page.drawImage(charcoalImg, {
        x: imgX,
        y: imgY,
        width: imgWidth,
        height: imgHeight,
      });
    }

    // Bottom Badges Row
    const bY = 95;
    page.drawRectangle({
      x: 65,
      y: bY,
      width: width - 130,
      height: 38,
      color: cardDark,
      borderColor: rgb(0.3, 0.32, 0.35),
      borderWidth: 1,
    });

    drawTextSafe(page, 'FIXED CARBON > 75%  |  CALORIFIC: 7,200 - 7,500 KCAL/KG  |  ULTRA-LOW ASH < 3%', {
      x: 80,
      y: bY + 14,
      size: 9.5,
      font: helveticaBold,
      color: amberGold,
    });

    // Footer info
    drawTextSafe(page, 'PR ORIGIN GLOBAL  *  Industrial Grade Publication  *  Page 01', {
      x: 65,
      y: 50,
      size: 8.5,
      font: helvetica,
      color: rgb(0.6, 0.62, 0.65),
    });
  }

  // =========================================================================
  // PAGE 2: PRODUCT OVERVIEW & THE PR ORIGIN ADVANTAGE
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Top Header Bar
    page.drawRectangle({
      x: 0,
      y: height - 55,
      width,
      height: 55,
      color: darkCarbonBg,
    });
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: 45,
      y: height - 35,
      size: 13,
      font: helveticaBold,
      color: pureWhite,
    });
    drawTextSafe(page, 'PRODUCT OVERVIEW', {
      x: width - 180,
      y: height - 35,
      size: 11,
      font: helveticaBold,
      color: amberGold,
    });

    // Main Heading
    drawTextSafe(page, 'PREMIUM BIOMASS ENERGY', {
      x: 45,
      y: height - 95,
      size: 22,
      font: helveticaBold,
      color: darkText,
    });
    drawTextSafe(page, 'FOR HEAVY INDUSTRY', {
      x: 45,
      y: height - 122,
      size: 18,
      font: helveticaBold,
      color: amberGold,
    });

    // Intro paragraph
    drawWrappedText(
      page,
      'PR ORIGIN GLOBAL supplies industrial operators with clean-burning, high-calorific fractured lump charcoal and briquettes. Manufactured from 100% mature coconut shells, our charcoal is engineered to deliver sustained, extreme heat with minimal degradation. It serves as an optimal fuel and reducing agent for the global energy, metallurgy, and smelting sectors, outperforming traditional biomass alternatives.',
      45,
      height - 155,
      width - 90,
      10,
      15.5,
      helvetica,
      darkText
    );

    // Left Column: Sourcing & Integrity Cards
    const colWidth = 235;

    // Card 1: Sustainably Sourced
    page.drawRectangle({
      x: 45,
      y: height - 335,
      width: colWidth,
      height: 110,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: borderLine,
      borderWidth: 1,
    });
    page.drawRectangle({
      x: 45,
      y: height - 335,
      width: 4,
      height: 110,
      color: amberGold,
    });
    drawTextSafe(page, 'Sustainably Sourced', {
      x: 60,
      y: height - 245,
      size: 12,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'Our raw materials are ethically harvested from the premier coconut-producing regions across India, Indonesia, and the Philippines. This strategic tropical sourcing ensures a continuous, high-volume supply chain of dense, fully mature shells.',
      60,
      height - 265,
      colWidth - 25,
      8.8,
      12.5,
      helvetica,
      darkText
    );

    // Card 2: Superior Integrity
    page.drawRectangle({
      x: 45,
      y: height - 460,
      width: colWidth,
      height: 110,
      color: darkCarbonBg,
    });
    drawTextSafe(page, 'Superior Integrity', {
      x: 60,
      y: height - 370,
      size: 12,
      font: helveticaBold,
      color: amberGold,
    });
    drawWrappedText(
      page,
      'Using fully mature shells translates directly into superior fixed carbon levels and exceptional structural integrity during both maritime transit and industrial combustion.',
      60,
      height - 390,
      colWidth - 25,
      8.8,
      13,
      helvetica,
      lightGray
    );

    // Right Column: The PR Origin Advantage (Container Box)
    const rightX = 305;
    const rightW = width - rightX - 45;

    page.drawRectangle({
      x: rightX,
      y: height - 460,
      width: rightW,
      height: 235,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

    drawTextSafe(page, 'The PR Origin Advantage', {
      x: rightX + 15,
      y: height - 245,
      size: 13,
      font: helveticaBold,
      color: amberGold,
    });

    const advantages = [
      {
        title: 'Smokeless & Odor-Free:',
        desc: 'Advanced carbonization ensures a clean burn, improving operational safety and facility environmental compliance.'
      },
      {
        title: 'Ultra-Low Ash:',
        desc: 'Yielding less than 3% ash residue, our charcoal minimizes furnace clean-out downtime and maintains heat efficiency.'
      },
      {
        title: 'Sulfur-Free:',
        desc: 'Ideal for sensitive metallurgical smelting and alloy manufacturing where sulfur contamination must be strictly avoided.'
      },
      {
        title: 'High Thermal Efficiency:',
        desc: 'Exceptional calorific value maximizes energy output per metric ton, driving down operational fuel consumption.'
      }
    ];

    let advY = height - 272;
    for (const adv of advantages) {
      drawTextSafe(page, '[v] ' + adv.title, {
        x: rightX + 15,
        y: advY,
        size: 9.5,
        font: helveticaBold,
        color: darkText,
      });
      advY = drawWrappedText(page, adv.desc, rightX + 30, advY - 13, rightW - 40, 8.5, 11.5, helvetica, rgb(0.3, 0.35, 0.38));
      advY -= 8;
    }

    // Bottom Highlight Box
    page.drawRectangle({
      x: 45,
      y: 95,
      width: width - 90,
      height: 90,
      color: rgb(0.95, 0.97, 0.96),
      borderColor: borderLine,
      borderWidth: 1,
    });
    drawTextSafe(page, 'REDUCING AGENT & HIGH-ENERGY BIOFUEL', {
      x: 65,
      y: 155,
      size: 11,
      font: helveticaBold,
      color: amberGold,
    });
    drawWrappedText(
      page,
      'By replacing fossil coal and metallurgical coke with carbon-neutral coconut shell charcoal, industrial processors achieve up to 85% reduction in lifecycle greenhouse gas emissions while preserving furnace refractory lifespans.',
      65,
      138,
      width - 130,
      9.2,
      13.5,
      helvetica,
      darkText
    );

    // Footer
    drawTextSafe(page, 'Coconut Shell Charcoal | Industrial Grade', {
      x: 45,
      y: 40,
      size: 8.5,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.48),
    });
    drawTextSafe(page, 'Page 02', {
      x: width - 85,
      y: 40,
      size: 8.5,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.48),
    });
  }

  // =========================================================================
  // PAGE 3: TECHNICAL DATA & SPECIFICATIONS
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Top Header Bar
    page.drawRectangle({
      x: 0,
      y: height - 55,
      width,
      height: 55,
      color: darkCarbonBg,
    });
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: 45,
      y: height - 35,
      size: 13,
      font: helveticaBold,
      color: pureWhite,
    });
    drawTextSafe(page, 'TECHNICAL DATA', {
      x: width - 165,
      y: height - 35,
      size: 11,
      font: helveticaBold,
      color: amberGold,
    });

    // Heading
    drawTextSafe(page, 'SPECIFICATIONS & FORMATS', {
      x: 45,
      y: height - 95,
      size: 20,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'Our coconut shell charcoal undergoes rigorous laboratory quality control to meet the demanding requirements of industrial buyers worldwide.',
      45,
      height - 120,
      width - 90,
      9.5,
      14,
      helvetica,
      rgb(0.3, 0.35, 0.38)
    );

    // SPECIFICATIONS TABLE
    const tableTop = height - 155;
    const tableX = 45;
    const tableW = width - 90;

    // Header row
    page.drawRectangle({
      x: tableX,
      y: tableTop - 26,
      width: tableW,
      height: 26,
      color: darkCarbonBg,
    });
    drawTextSafe(page, 'PARAMETER', {
      x: tableX + 15,
      y: tableTop - 18,
      size: 9.5,
      font: helveticaBold,
      color: pureWhite,
    });
    drawTextSafe(page, 'GUARANTEED EXPORT VALUE', {
      x: tableX + 210,
      y: tableTop - 18,
      size: 9.5,
      font: helveticaBold,
      color: pureWhite,
    });
    drawTextSafe(page, 'STANDARD TEST METHOD', {
      x: tableX + 370,
      y: tableTop - 18,
      size: 9.5,
      font: helveticaBold,
      color: pureWhite,
    });

    const rows = [
      { param: 'Moisture Content', val: '< 10%', method: 'ASTM D3173' },
      { param: 'Ash Residue', val: '< 3%', method: 'ASTM D3174' },
      { param: 'Volatile Matter', val: '12% - 15%', method: 'ASTM D3175' },
      { param: 'Fixed Carbon', val: '75% - 85%', method: 'ASTM D3172' },
      { param: 'Calorific Value', val: '7,200 - 7,500 kcal/kg', method: 'ASTM D5865' },
      { param: 'Sulfur Content', val: '< 0.05% (Free)', method: 'ASTM D4239' },
      { param: 'Foreign Matter', val: 'Nil', method: 'Visual / Screen' },
    ];

    let rowY = tableTop - 26;
    let isEven = false;
    for (const r of rows) {
      rowY -= 24;
      page.drawRectangle({
        x: tableX,
        y: rowY,
        width: tableW,
        height: 24,
        color: isEven ? rgb(0.96, 0.97, 0.98) : pureWhite,
        borderColor: borderLine,
        borderWidth: 0.5,
      });

      drawTextSafe(page, r.param, {
        x: tableX + 15,
        y: rowY + 7,
        size: 9,
        font: helveticaBold,
        color: darkText,
      });
      drawTextSafe(page, r.val, {
        x: tableX + 210,
        y: rowY + 7,
        size: 9,
        font: helveticaBold,
        color: amberGold,
      });
      drawTextSafe(page, r.method, {
        x: tableX + 370,
        y: rowY + 7,
        size: 8.5,
        font: helvetica,
        color: rgb(0.3, 0.35, 0.38),
      });

      isEven = !isEven;
    }

    // Two Bottom Columns: Formats vs Primary Applications
    const colY = rowY - 35;
    const halfW = (width - 110) / 2;

    // Left Column: Product Formats
    drawTextSafe(page, 'Product Formats', {
      x: tableX,
      y: colY,
      size: 13,
      font: helveticaBold,
      color: amberGold,
    });

    page.drawRectangle({
      x: tableX,
      y: colY - 145,
      width: halfW,
      height: 130,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: borderLine,
      borderWidth: 1,
    });

    drawTextSafe(page, '[v] Natural Fractured Lumps:', {
      x: tableX + 12,
      y: colY - 25,
      size: 9.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'Screened and graded to custom millimeter specifications to optimize airflow in industrial furnaces.',
      tableX + 25,
      colY - 40,
      halfW - 35,
      8.5,
      12,
      helvetica,
      darkText
    );

    drawTextSafe(page, '[v] Extruded Briquettes:', {
      x: tableX + 12,
      y: colY - 80,
      size: 9.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'High-density, uniformly shaped briquettes for predictable, long-lasting thermal output and automated feeding systems.',
      tableX + 25,
      colY - 95,
      halfW - 35,
      8.5,
      12,
      helvetica,
      darkText
    );

    // Right Column: Primary Applications
    const rightColX = tableX + halfW + 20;
    drawTextSafe(page, 'Primary Applications', {
      x: rightColX,
      y: colY,
      size: 13,
      font: helveticaBold,
      color: amberGold,
    });

    page.drawRectangle({
      x: rightColX,
      y: colY - 145,
      width: halfW,
      height: 130,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: borderLine,
      borderWidth: 1,
    });

    drawTextSafe(page, '[v] Metallurgical Smelting:', {
      x: rightColX + 12,
      y: colY - 25,
      size: 9.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'Superior, reactive reducing agent for silicon, copper, steel, and precious metal smelting.',
      rightColX + 25,
      colY - 38,
      halfW - 35,
      8.2,
      11.5,
      helvetica,
      darkText
    );

    drawTextSafe(page, '[v] Energy Generation:', {
      x: rightColX + 12,
      y: colY - 65,
      size: 9.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'High-calorific, low-ash fuel source for industrial boilers and kilns.',
      rightColX + 25,
      colY - 78,
      halfW - 35,
      8.2,
      11.5,
      helvetica,
      darkText
    );

    drawTextSafe(page, '[v] Activated Carbon:', {
      x: rightColX + 12,
      y: colY - 105,
      size: 9.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'Naturally dense pore structure serves as the perfect precursor material.',
      rightColX + 25,
      colY - 118,
      halfW - 35,
      8.2,
      11.5,
      helvetica,
      darkText
    );

    // Footer
    drawTextSafe(page, 'Coconut Shell Charcoal | Industrial Grade', {
      x: 45,
      y: 40,
      size: 8.5,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.48),
    });
    drawTextSafe(page, 'Page 03', {
      x: width - 85,
      y: 40,
      size: 8.5,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.48),
    });
  }

  // =========================================================================
  // PAGE 4: LOGISTICS & ORDERING (EXPORT CAPABILITIES)
  // =========================================================================
  {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Top Header Bar
    page.drawRectangle({
      x: 0,
      y: height - 55,
      width,
      height: 55,
      color: darkCarbonBg,
    });
    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: 45,
      y: height - 35,
      size: 13,
      font: helveticaBold,
      color: pureWhite,
    });
    drawTextSafe(page, 'LOGISTICS & ORDERING', {
      x: width - 195,
      y: height - 35,
      size: 11,
      font: helveticaBold,
      color: amberGold,
    });

    // Heading
    drawTextSafe(page, 'EXPORT CAPABILITIES', {
      x: 45,
      y: height - 95,
      size: 20,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'We specialize in high-volume, continuous export shipments to industrial procurement divisions worldwide. Our logistics infrastructure ensures secure, moisture-controlled packaging and timely delivery to major global ports.',
      45,
      height - 120,
      width - 90,
      9.5,
      14.5,
      helvetica,
      darkText
    );

    // Left Column: Seamless Global Logistics
    const leftW = 270;
    drawTextSafe(page, 'Seamless Global Logistics', {
      x: 45,
      y: height - 180,
      size: 13,
      font: helveticaBold,
      color: amberGold,
    });

    const logisticsItems = [
      {
        title: 'Packaging Options:',
        desc: '25kg/50kg heavy-duty PP woven bags, or 500kg/1000kg Jumbo FIBC bags. Inner moisture-proof PE liners included.'
      },
      {
        title: 'Container Loadability:',
        desc: '20ft FCL: Approx. 17 - 18 MT\n40ft HC FCL: Approx. 25 - 26 MT.'
      },
      {
        title: 'Incoterms Supported:',
        desc: 'FOB, CFR, CIF available upon request to any global discharge port.'
      },
      {
        title: 'Quality Assurance:',
        desc: 'Pre-shipment inspection by SGS or equivalent third-party testing agencies.'
      }
    ];

    let logY = height - 205;
    for (const item of logisticsItems) {
      drawTextSafe(page, '[v] ' + item.title, {
        x: 45,
        y: logY,
        size: 9.5,
        font: helveticaBold,
        color: darkText,
      });
      logY = drawWrappedText(page, item.desc, 60, logY - 14, leftW - 20, 8.8, 12.5, helvetica, rgb(0.3, 0.35, 0.38));
      logY -= 12;
    }

    // Left Column: Contact Card Box
    const contactBoxY = logY - 20;
    page.drawRectangle({
      x: 45,
      y: contactBoxY - 140,
      width: leftW,
      height: 140,
      color: darkCarbonBg,
      borderColor: amberGold,
      borderWidth: 1.2,
    });

    drawTextSafe(page, 'PR ORIGIN GLOBAL', {
      x: 60,
      y: contactBoxY - 25,
      size: 12,
      font: helveticaBold,
      color: amberGold,
    });
    drawTextSafe(page, 'FF 01, Paradise Complex, Kada Road', {
      x: 60,
      y: contactBoxY - 45,
      size: 9,
      font: helvetica,
      color: lightGray,
    });
    drawTextSafe(page, 'Visnagar, Gujarat, India', {
      x: 60,
      y: contactBoxY - 60,
      size: 9,
      font: helvetica,
      color: lightGray,
    });
    drawTextSafe(page, 'Contact: Yogesh Patel', {
      x: 60,
      y: contactBoxY - 80,
      size: 9.5,
      font: helveticaBold,
      color: pureWhite,
    });
    drawTextSafe(page, 'WhatsApp / Desk: +91 97378 86587  |  +91 90852 72829', {
      x: 60,
      y: contactBoxY - 100,
      size: 9,
      font: helveticaBold,
      color: amberGold,
    });
    drawTextSafe(page, 'Email: contact@proriginglobal.com', {
      x: 60,
      y: contactBoxY - 120,
      size: 9,
      font: helvetica,
      color: pureWhite,
    });

    // Right Column: Next Steps for Procurement
    const rightX = 335;
    const rightW = width - rightX - 45;

    // Dark Container
    page.drawRectangle({
      x: rightX,
      y: 95,
      width: rightW,
      height: height - 280,
      color: cardDark,
      borderColor: amberGold,
      borderWidth: 1.5,
    });

    drawTextSafe(page, 'Next Steps for Procurement', {
      x: rightX + 20,
      y: height - 215,
      size: 13,
      font: helveticaBold,
      color: pureWhite,
    });

    // Step 1
    page.drawRectangle({
      x: rightX + 15,
      y: height - 325,
      width: rightW - 30,
      height: 95,
      color: pureWhite,
      borderColor: borderLine,
      borderWidth: 1,
    });
    drawTextSafe(page, '1. Secure Your Forward Contract', {
      x: rightX + 25,
      y: height - 250,
      size: 10.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      "Request a custom CFR/CIF quote tailored to your facility's annual tonnage requirements and specifications.",
      rightX + 25,
      height - 270,
      rightW - 50,
      8.5,
      12.5,
      helvetica,
      rgb(0.3, 0.35, 0.38)
    );

    // Step 2
    page.drawRectangle({
      x: rightX + 15,
      y: height - 440,
      width: rightW - 30,
      height: 95,
      color: pureWhite,
      borderColor: borderLine,
      borderWidth: 1,
    });
    drawTextSafe(page, '2. Require Laboratory Validation?', {
      x: rightX + 25,
      y: height - 365,
      size: 10.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'Order a commercial sample batch for independent testing and burn-analysis at your smelter.',
      rightX + 25,
      height - 385,
      rightW - 50,
      8.5,
      12.5,
      helvetica,
      rgb(0.3, 0.35, 0.38)
    );

    // Step 3
    page.drawRectangle({
      x: rightX + 15,
      y: height - 555,
      width: rightW - 30,
      height: 95,
      color: pureWhite,
      borderColor: borderLine,
      borderWidth: 1,
    });
    drawTextSafe(page, '3. Connect Directly', {
      x: rightX + 25,
      y: height - 480,
      size: 10.5,
      font: helveticaBold,
      color: darkText,
    });
    drawWrappedText(
      page,
      'Message our Export Division on WhatsApp for live FOB pricing, lead times, and current port availability.',
      rightX + 25,
      height - 500,
      rightW - 50,
      8.5,
      12.5,
      helvetica,
      rgb(0.3, 0.35, 0.38)
    );

    // Footer
    drawTextSafe(page, 'Coconut Shell Charcoal | Industrial Grade', {
      x: 45,
      y: 40,
      size: 8.5,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.48),
    });
    drawTextSafe(page, 'Page 04', {
      x: width - 85,
      y: 40,
      size: 8.5,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.48),
    });
  }

  // Save PDF to both root and public/
  const pdfBytes = await pdfDoc.save();
  const rootOut = path.join(__dirname, 'PR_Origin_Global_Coconut_Shell_Charcoal_Catalog_2026.pdf');
  const publicOut = path.join(__dirname, 'public', 'PR_Origin_Global_Coconut_Shell_Charcoal_Catalog_2026.pdf');

  fs.writeFileSync(rootOut, pdfBytes);
  fs.writeFileSync(publicOut, pdfBytes);
  console.log(`[SUCCESS] Generated Coconut Shell Charcoal Catalog PDF (${pdfBytes.length} bytes) to root and public/`);
}

generateCharcoalCatalogPDF().catch(err => {
  console.error('[ERROR] Failed to generate charcoal catalog PDF:', err);
  process.exit(1);
});
