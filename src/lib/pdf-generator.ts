import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { readFile } from 'fs/promises'
import { join } from 'path'

const COLORS = {
  heading: rgb(0.298, 0.376, 0.082),  // Dark olive green matching ZALUD brand (#4C6015)
  text: rgb(0.1, 0.1, 0.1),           // #1A1A1A
  secondary: rgb(0.333, 0.333, 0.333), // #555555
  separator: rgb(0.867, 0.867, 0.867), // #DDDDDD
}

const PAGE_INDEX = 2 // Page 3 (0-indexed)
const MARGIN_LEFT = 45
const MARGIN_RIGHT = 45
const LINE_HEIGHT = 14
const SECTION_GAP = 10

export async function generatePlanPdf(
  clientName: string,
  routineContent: string
): Promise<Uint8Array> {
  // Read template from filesystem (included in Vercel bundle via outputFileTracingIncludes)
  const templatePath = join(process.cwd(), 'public', 'plan-template.pdf')
  const templateBytes = await readFile(templatePath)
  const pdf = await PDFDocument.load(templateBytes)

  const page = pdf.getPage(PAGE_INDEX)
  const { width, height } = page.getSize()
  const maxTextWidth = width - MARGIN_LEFT - MARGIN_RIGHT

  const helvetica = await pdf.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  // Start below the existing header ("ZALUD" + "RUTINA DIARIA OPTIMIZADA" + subtitle)
  // From the image, the header takes roughly the top 120pt
  let y = height - 130

  // Draw client name
  const nameText = clientName.toUpperCase()
  const nameWidth = helveticaBold.widthOfTextAtSize(nameText, 11)
  page.drawText(nameText, {
    x: (width - nameWidth) / 2,
    y,
    size: 11,
    font: helveticaBold,
    color: COLORS.text,
  })
  y -= LINE_HEIGHT + 6

  // Draw separator
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: width - MARGIN_RIGHT, y },
    thickness: 0.5,
    color: COLORS.separator,
  })
  y -= SECTION_GAP + 4

  // Parse and render the routine content
  const lines = routineContent.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      y -= 6
      continue
    }

    // Check if we're running out of space
    if (y < 40) break

    if (isSectionHeader(trimmed)) {
      // Section headers: ALIMENTACIÓN, ENTRENAMIENTO, SUEÑO
      if (y < height - 150) y -= SECTION_GAP // extra gap between sections (not before first)
      page.drawText(trimmed, {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: helveticaBold,
        color: COLORS.heading,
      })
      y -= LINE_HEIGHT + 2
    } else if (trimmed.startsWith('→') || trimmed.startsWith('->')) {
      // Bullet points
      const text = trimmed.replace(/^(→|->)\s*/, '')
      const wrappedLines = wrapText(text, helvetica, 9, maxTextWidth - 12)
      for (let i = 0; i < wrappedLines.length; i++) {
        if (y < 40) break
        const prefix = i === 0 ? '→  ' : '     '
        page.drawText(prefix + wrappedLines[i], {
          x: MARGIN_LEFT,
          y,
          size: 9,
          font: helvetica,
          color: COLORS.text,
        })
        y -= LINE_HEIGHT
      }
    } else {
      // Closing lines or other text
      const wrappedLines = wrapText(trimmed, helvetica, 8.5, maxTextWidth)
      for (const wl of wrappedLines) {
        if (y < 40) break
        page.drawText(wl, {
          x: MARGIN_LEFT,
          y,
          size: 8.5,
          font: helvetica,
          color: COLORS.secondary,
        })
        y -= LINE_HEIGHT
      }
    }
  }

  return pdf.save()
}

function isSectionHeader(line: string): boolean {
  const headers = ['ALIMENTACIÓN', 'ALIMENTACION', 'ENTRENAMIENTO', 'SUEÑO', 'SUENO']
  const upper = line.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑÜ]/g, '')
  return headers.some(h => upper === h || upper.startsWith(h + ' '))
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}
