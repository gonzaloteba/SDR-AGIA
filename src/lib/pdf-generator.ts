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

// Replace unicode characters that WinAnsi (standard PDF fonts) cannot encode
function sanitizeForPdf(text: string): string {
  return text
    .replace(/\u2192/g, '>')      // → rightwards arrow
    .replace(/\u2022/g, '-')      // • bullet
    .replace(/\u2013/g, '-')      // – en dash
    .replace(/\u2014/g, '--')     // — em dash
    .replace(/\u2018/g, "'")      // ' left single quote
    .replace(/\u2019/g, "'")      // ' right single quote
    .replace(/\u201C/g, '"')      // " left double quote
    .replace(/\u201D/g, '"')      // " right double quote
    .replace(/\u2026/g, '...')    // … ellipsis
    .replace(/\u00B7/g, '-')      // · middle dot
    // Strip any remaining non-WinAnsi characters (keep latin-1 range)
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xFF]/g, '')
}

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
  let y = height - 130

  // Draw client name
  const nameText = sanitizeForPdf(clientName)
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

    if (y < 40) break

    // Detect bullet lines before sanitizing (→ gets replaced)
    const isBullet = trimmed.startsWith('\u2192') || trimmed.startsWith('->')
    const safe = sanitizeForPdf(trimmed)

    if (isSectionHeader(trimmed)) {
      if (y < height - 150) y -= SECTION_GAP
      page.drawText(safe, {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: helveticaBold,
        color: COLORS.heading,
      })
      y -= LINE_HEIGHT + 2
    } else if (isBullet) {
      const text = safe.replace(/^(>|->)\s*/, '')
      const wrappedLines = wrapText(text, helvetica, 9, maxTextWidth - 15)
      for (let i = 0; i < wrappedLines.length; i++) {
        if (y < 40) break
        const prefix = i === 0 ? '>  ' : '     '
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
      const wrappedLines = wrapText(safe, helvetica, 8.5, maxTextWidth)
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
  const normalized = line.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
  const headers = ['ALIMENTACION', 'ENTRENAMIENTO', 'SUENO']
  return headers.some(h => normalized === h || normalized.startsWith(h + ' '))
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
