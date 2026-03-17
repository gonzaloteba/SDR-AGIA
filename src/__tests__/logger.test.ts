import { logger } from '@/lib/logger'

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof jest.spyOn>
    warn: ReturnType<typeof jest.spyOn>
    error: ReturnType<typeof jest.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('creates a logger with context', () => {
    const log = logger('test-context')
    expect(log).toHaveProperty('info')
    expect(log).toHaveProperty('warn')
    expect(log).toHaveProperty('error')
  })

  it('logs info messages with context', () => {
    const log = logger('my-module')
    log.info('Hello world')
    expect(consoleSpy.log).toHaveBeenCalledTimes(1)
    const output = consoleSpy.log.mock.calls[0][0]
    expect(output).toContain('[INFO]')
    expect(output).toContain('[my-module]')
    expect(output).toContain('Hello world')
  })

  it('logs warn messages', () => {
    const log = logger('warn-test')
    log.warn('Something wrong')
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
    expect(consoleSpy.warn.mock.calls[0][0]).toContain('[WARN]')
  })

  it('logs error messages', () => {
    const log = logger('error-test')
    log.error('Failure', { code: 500 })
    expect(consoleSpy.error).toHaveBeenCalledTimes(1)
    const output = consoleSpy.error.mock.calls[0][0]
    expect(output).toContain('[ERROR]')
    expect(output).toContain('Failure')
  })

  it('serializes data as JSON', () => {
    const log = logger('data-test')
    log.info('With data', { key: 'value', num: 42 })
    const dataArg = consoleSpy.log.mock.calls[0][1]
    expect(dataArg).toContain('"key":"value"')
    expect(dataArg).toContain('"num":42')
  })

  it('includes ISO timestamp', () => {
    const log = logger('time-test')
    log.info('Timestamped')
    const output = consoleSpy.log.mock.calls[0][0]
    // ISO format: contains T and Z or timezone offset
    expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T/)
  })
})
