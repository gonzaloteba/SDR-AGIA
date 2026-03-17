import { NextRequest, NextResponse } from 'next/server'
import { AUDIT_FORM_ID, AUDIT_FIELD_MAP, AUDIT_FIRST_NAME_REF, AUDIT_LAST_NAME_REF } from '@/lib/typeform-mappings'

const TYPEFORM_API_BASE = 'https://api.typeform.com'

/**
 * GET /api/typeform/discover?secret=...
 *
 * Fetches the Typeform audit form definition and returns all fields
 * with their IDs, titles, and whether they are currently mapped.
 * Use this to discover missing field IDs for birth_date, location, etc.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const typeformToken = process.env.TYPEFORM_API_TOKEN
  if (!typeformToken) {
    return NextResponse.json({ error: 'TYPEFORM_API_TOKEN not configured' }, { status: 500 })
  }

  // Fetch form definition
  const res = await fetch(`${TYPEFORM_API_BASE}/forms/${AUDIT_FORM_ID}`, {
    headers: { Authorization: `Bearer ${typeformToken}` },
  })
  if (!res.ok) {
    return NextResponse.json({ error: `Typeform API ${res.status}` }, { status: 502 })
  }

  const form = await res.json()
  const allMappedIds = new Set([
    ...Object.keys(AUDIT_FIELD_MAP),
    AUDIT_FIRST_NAME_REF,
    AUDIT_LAST_NAME_REF,
  ])

  // Extract fields (including nested group fields)
  const fields: Array<{ id: string; ref: string; type: string; title: string; mapped_to: string | null }> = []

  function processField(f: { id: string; ref?: string; type: string; title: string; properties?: { fields?: Array<{ id: string; ref?: string; type: string; title: string }> } }) {
    fields.push({
      id: f.id,
      ref: f.ref || '',
      type: f.type,
      title: f.title,
      mapped_to: AUDIT_FIELD_MAP[f.id] || (f.id === AUDIT_FIRST_NAME_REF ? 'first_name' : f.id === AUDIT_LAST_NAME_REF ? 'last_name' : null),
    })
    if (f.properties?.fields) {
      for (const sf of f.properties.fields) {
        processField(sf as typeof f)
      }
    }
  }

  for (const f of form.fields || []) {
    processField(f)
  }

  // Also fetch ONE response to see field IDs with sample values
  const respRes = await fetch(
    `${TYPEFORM_API_BASE}/forms/${AUDIT_FORM_ID}/responses?page_size=1`,
    { headers: { Authorization: `Bearer ${typeformToken}` } }
  )
  let sampleAnswers: Array<{ field_id: string; type: string; sample_value: string }> = []
  if (respRes.ok) {
    const respData = await respRes.json()
    const item = respData.items?.[0]
    if (item?.answers) {
      sampleAnswers = item.answers.map((a: Record<string, unknown>) => {
        const field = a.field as { id: string } | undefined
        let val = ''
        if (a.text) val = String(a.text).substring(0, 80)
        else if (a.date) val = String(a.date)
        else if (a.choice) val = (a.choice as { label: string }).label
        else if (a.number !== undefined) val = String(a.number)
        else if (a.boolean !== undefined) val = String(a.boolean)
        else if (a.phone_number) val = String(a.phone_number)
        else if (a.file_url) val = String(a.file_url).substring(0, 80)
        return { field_id: field?.id || 'unknown', type: String(a.type), sample_value: val }
      })
    }
  }

  const unmapped = fields.filter(f => !allMappedIds.has(f.id))
  const mapped = fields.filter(f => allMappedIds.has(f.id))

  return NextResponse.json({
    form_id: AUDIT_FORM_ID,
    total_fields: fields.length,
    mapped_count: mapped.length,
    unmapped_count: unmapped.length,
    unmapped_fields: unmapped,
    mapped_fields: mapped,
    sample_answers: sampleAnswers,
    hint: 'Add unmapped field IDs to AUDIT_FIELD_MAP in src/lib/typeform-mappings.ts',
  })
}
