# Zalud Coach Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://coach-dash-board.vercel.app)

Dashboard interactivo para los coaches de Zalud - monitoreo de entrega de servicio de coaching de salud.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Recharts** para gráficos
- **Vercel** para deploy

## Configuración

1. Clona el repositorio
2. Copia `.env.local.example` a `.env.local` y configura las variables
3. Ejecuta las migraciones SQL en Supabase (`supabase/migrations/001_initial_schema.sql`)
4. Instala dependencias y ejecuta:

```bash
npm install
npm run dev
```

## Estructura

- `/dashboard` - Vista general con KPIs
- `/dashboard/clients` - Lista de clientes con sistema de semáforo
- `/dashboard/clients/[id]` - Detalle individual del cliente
- `/dashboard/alerts` - Centro de alertas
- `/api/webhooks/typeform` - Webhook para check-ins de Typeform
- `/api/cron/generate-alerts` - Cron job diario para generar alertas

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role |
| `TYPEFORM_WEBHOOK_SECRET` | Secret para webhooks de Typeform |
| `CRON_SECRET` | Secret para el cron job |
