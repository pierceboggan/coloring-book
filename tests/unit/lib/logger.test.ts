import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Sentry before importing the logger so the import picks up the mock.
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import * as Sentry from '@sentry/nextjs'

const mockedSentry = Sentry as unknown as {
  addBreadcrumb: ReturnType<typeof vi.fn>
  captureException: ReturnType<typeof vi.fn>
  captureMessage: ReturnType<typeof vi.fn>
}

async function freshLogger() {
  vi.resetModules()
  return await import('@/lib/logger')
}


beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockedSentry.addBreadcrumb.mockReset()
  mockedSentry.captureException.mockReset()
  mockedSentry.captureMessage.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('logger - level gating', () => {
  it('emits all levels in development by default', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LOG_LEVEL', '')
    vi.stubEnv('NEXT_PUBLIC_LOG_LEVEL', '')

    const { logger } = await freshLogger()
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')

    expect(console.debug).toHaveBeenCalledTimes(1)
    expect(console.info).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('suppresses debug and info in production by default', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('LOG_LEVEL', '')
    vi.stubEnv('NEXT_PUBLIC_LOG_LEVEL', '')

    const { logger } = await freshLogger()
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')

    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('respects explicit LOG_LEVEL=warn', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LOG_LEVEL', 'warn')

    const { logger } = await freshLogger()
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')

    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('LOG_LEVEL=silent suppresses everything', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LOG_LEVEL', 'silent')

    const { logger } = await freshLogger()
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')

    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('falls back to default when LOG_LEVEL is invalid', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('LOG_LEVEL', 'bogus')

    const { logger } = await freshLogger()
    logger.info('i')
    logger.error('e')

    expect(console.info).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledTimes(1)
  })
})

describe('logger - context handling', () => {
  it('passes context object as second console arg', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LOG_LEVEL', '')

    const { logger } = await freshLogger()
    logger.info('hello', { userId: 'u1', count: 3 })

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('hello'),
      { userId: 'u1', count: 3 },
    )
  })

  it('omits second arg when context is empty', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.info('hello', {})
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('hello'))
    expect(console.info).toHaveBeenCalledTimes(1)
  })

  it('omits second arg when context is undefined', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.warn('warn-no-ctx')
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('warn-no-ctx'))
  })
})

describe('logger - Sentry forwarding', () => {
  it('warn adds a Sentry breadcrumb (no capture)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.warn('careful', { jobId: 'j' })

    expect(mockedSentry.addBreadcrumb).toHaveBeenCalledWith({
      level: 'warning',
      message: 'careful',
      data: { jobId: 'j' },
    })
    expect(mockedSentry.captureException).not.toHaveBeenCalled()
    expect(mockedSentry.captureMessage).not.toHaveBeenCalled()
  })

  it('error with Error instance calls captureException', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    const err = new Error('boom')
    logger.error('failed thing', { error: err, requestId: 'r1' })

    expect(mockedSentry.captureException).toHaveBeenCalledTimes(1)
    const [capturedErr, capturedOpts] = mockedSentry.captureException.mock.calls[0]
    expect(capturedErr).toBe(err)
    expect(capturedOpts).toEqual({
      extra: { message: 'failed thing', requestId: 'r1' },
    })
    expect(mockedSentry.captureMessage).not.toHaveBeenCalled()
  })

  it('error with non-Error context.error wraps it as Error', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.error('failed thing', { error: 'string-error' })

    expect(mockedSentry.captureException).toHaveBeenCalledTimes(1)
    const [capturedErr] = mockedSentry.captureException.mock.calls[0]
    expect(capturedErr).toBeInstanceOf(Error)
    expect((capturedErr as Error).message).toBe('string-error')
  })

  it('error without context.error calls captureMessage', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.error('something off', { foo: 'bar' })

    expect(mockedSentry.captureMessage).toHaveBeenCalledWith('something off', {
      level: 'error',
      extra: { foo: 'bar' },
    })
    expect(mockedSentry.captureException).not.toHaveBeenCalled()
  })

  it('info emits a Sentry breadcrumb', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.info('saw it', { id: 'x' })

    expect(mockedSentry.addBreadcrumb).toHaveBeenCalledWith({
      level: 'info',
      message: 'saw it',
      data: { id: 'x' },
    })
  })

  it('drops a breadcrumb even when console output is suppressed', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('LOG_LEVEL', '')
    const { logger } = await freshLogger()

    logger.info('quiet but still seen', { id: 'q' })
    expect(console.info).not.toHaveBeenCalled()
    expect(mockedSentry.addBreadcrumb).toHaveBeenCalledWith({
      level: 'info',
      message: 'quiet but still seen',
      data: { id: 'q' },
    })
  })

  it('does not throw when Sentry throws', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockedSentry.captureException.mockImplementation(() => {
      throw new Error('sentry down')
    })
    mockedSentry.addBreadcrumb.mockImplementation(() => {
      throw new Error('sentry down')
    })

    const { logger } = await freshLogger()
    expect(() => logger.warn('w')).not.toThrow()
    expect(() => logger.error('e', { error: new Error('x') })).not.toThrow()
  })
})

describe('logger - variadic arguments', () => {
  it('packs multiple args into context.args and surfaces Error', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    const err = new Error('boom')
    logger.error('Failed thing', 'detail', err)
    const call = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[1]).toMatchObject({ error: err })
    expect(call[1].args).toEqual(['detail', err])
    expect(mockedSentry.captureException).toHaveBeenCalledWith(err, expect.any(Object))
  })

  it('treats a lone plain object arg as the context', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.info('hello', { userId: '42' })
    const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[1]).toEqual({ userId: '42' })
  })
})

describe('logger - level prefix', () => {
  it('prefixes message with level emoji', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { logger } = await freshLogger()
    logger.error('uh oh')
    const firstArg = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(firstArg).toContain('[error]')
    expect(firstArg).toContain('uh oh')
  })
})
