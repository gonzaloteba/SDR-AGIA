import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRoutine } from '@/lib/routine-ai'
import { generatePlanPdf } from '@/lib/pdf-generator'
import type { Client } from '@/lib/types'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const typedClient = client as Client

    // Check that the client has audit data
    if (!typedClient.first_meal_time && !typedClient.wake_time) {
      return NextResponse.json(
        { error: 'El cliente no tiene datos de auditoría inicial. Debe completar el formulario primero.' },
        { status: 400 }
      )
    }

    // Generate routine with Claude
    const routine = await generateRoutine(typedClient)
    if (!routine) {
      return NextResponse.json(
        { error: 'No se pudo generar la rutina. Verifica que ANTHROPIC_API_KEY esté configurada.' },
        { status: 500 }
      )
    }

    // Generate PDF with routine embedded in page 3
    const clientName = `${typedClient.first_name} ${typedClient.last_name}`
    const pdfBytes = await generatePlanPdf(clientName, routine)

    // Return PDF as downloadable file
    const fileName = `Plan Alimentacion - ${typedClient.first_name} ${typedClient.last_name}.pdf`
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Plan PDF generation error:', error)
    return NextResponse.json(
      { error: 'Error interno al generar el PDF' },
      { status: 500 }
    )
  }
}
