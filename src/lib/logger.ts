type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: Record<string, unknown>
  timestamp: string
}

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.context ? `[${entry.context}]` : '',
    entry.message,
  ].filter(Boolean)
  return parts.join(' ')
}

function createEntry(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  }
}

function log(entry: LogEntry) {
  const formatted = formatEntry(entry)
  switch (entry.level) {
    case 'error':
      console.error(formatted, entry.data ? JSON.stringify(entry.data) : '')
      break
    case 'warn':
      console.warn(formatted, entry.data ? JSON.stringify(entry.data) : '')
      break
    case 'info':
      console.log(formatted, entry.data ? JSON.stringify(entry.data) : '')
      break
  }
}

/**
 * Structured logger for the application.
 * Creates a context-bound logger to trace operations.
 *
 * Usage:
 *   const log = logger('api:cron')
 *   log.info('Starting alert generation')
 *   log.error('Failed to fetch clients', { error: err.message })
 */
export function logger(context: string) {
  return {
    info(message: string, data?: Record<string, unknown>) {
      log(createEntry('info', message, context, data))
    },
    warn(message: string, data?: Record<string, unknown>) {
      log(createEntry('warn', message, context, data))
    },
    error(message: string, data?: Record<string, unknown>) {
      log(createEntry('error', message, context, data))
    },
  }
}
