/**
 * Centralized logger for ColoringBook.AI.
 *
 * Goals:
 *  - One API for server, edge, and browser code.
 *  - Suppress noisy `debug`/`info` in production unless explicitly enabled.
 *  - Forward `warn` to Sentry as breadcrumbs and `error` to Sentry as
 *    `captureException` (when an Error is supplied) or `captureMessage`.
 *  - Carry structured context instead of relying on emoji-prefixed strings.
 *  - Never throw — logging failures must not take down a request.
 *
 * Configuration:
 *  - `LOG_LEVEL` (server)        — one of debug|info|warn|error|silent
 *  - `NEXT_PUBLIC_LOG_LEVEL` (client) — same set
 *  - Defaults: `debug` when NODE_ENV !== 'production', otherwise `warn`.
 */

import * as Sentry from '@sentry/nextjs'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogLevelSetting = LogLevel | 'silent'
export type LogContext = Record<string, unknown> & { error?: unknown }

const LEVEL_WEIGHT: Record<LogLevelSetting, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
}

const LEVEL_EMOJI: Record<LogLevel, string> = {
  debug: '🔎',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

const isBrowser = typeof window !== 'undefined'

function resolveLevelSetting(): LogLevelSetting {
  // Prefer the side-appropriate env var, but fall back to the other so test
  // and shared-env configurations work uniformly.
  const candidates = isBrowser
    ? [process.env.NEXT_PUBLIC_LOG_LEVEL, process.env.LOG_LEVEL]
    : [process.env.LOG_LEVEL, process.env.NEXT_PUBLIC_LOG_LEVEL]

  for (const raw of candidates) {
    if (raw && raw in LEVEL_WEIGHT) {
      return raw as LogLevelSetting
    }
  }

  const nodeEnv = process.env.NODE_ENV
  return nodeEnv === 'production' ? 'warn' : 'debug'
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[resolveLevelSetting()]
}

function formatPrefix(level: LogLevel): string {
  return `${LEVEL_EMOJI[level]} [${level}]`
}

function safeSentry(fn: () => void): void {
  try {
    fn()
  } catch {
    // Logging must never throw. Swallow Sentry SDK errors silently — there is
    // no better channel to report them on.
  }
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value
  if (typeof value === 'string') return new Error(value)
  try {
    return new Error(JSON.stringify(value))
  } catch {
    return new Error(String(value))
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

function normalizeContext(args: unknown[]): LogContext | undefined {
  if (args.length === 0) return undefined
  if (args.length === 1 && isPlainObject(args[0])) {
    return args[0] as LogContext
  }
  // Variadic / unstructured form: pack everything into an `args` array so it
  // still appears alongside the message in the console and Sentry breadcrumbs.
  const ctx: LogContext = { args }
  // Surface the first Error encountered so Sentry treats it as an exception.
  for (const a of args) {
    if (a instanceof Error) {
      ctx.error = a
      break
    }
  }
  return ctx
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    // Even when console output is suppressed, drop a breadcrumb so Sentry
    // retains narrative context for any later `captureException`.
    if (level === 'info' || level === 'debug') {
      safeSentry(() => {
        Sentry.addBreadcrumb({
          level: level === 'debug' ? 'debug' : 'info',
          message,
          data: context,
        })
      })
    }
    return
  }

  const prefix = formatPrefix(level)
  const consoleFn =
    level === 'debug'
      ? console.debug
      : level === 'info'
        ? console.info
        : level === 'warn'
          ? console.warn
          : console.error

  if (context && Object.keys(context).length > 0) {
    consoleFn(`${prefix} ${message}`, context)
  } else {
    consoleFn(`${prefix} ${message}`)
  }

  if (level === 'warn') {
    safeSentry(() => {
      Sentry.addBreadcrumb({
        level: 'warning',
        message,
        data: context,
      })
    })
    return
  }

  if (level === 'error') {
    safeSentry(() => {
      const { error, ...extra } = context ?? {}
      if (error !== undefined) {
        Sentry.captureException(toError(error), {
          extra: { message, ...extra },
        })
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra,
        })
      }
    })
    return
  }

  // info/debug — also leave a breadcrumb so Sentry has context on later errors.
  safeSentry(() => {
    Sentry.addBreadcrumb({
      level: level === 'debug' ? 'debug' : 'info',
      message,
      data: context,
    })
  })
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    emit('debug', message, normalizeContext(args))
  },
  info(message: string, ...args: unknown[]): void {
    emit('info', message, normalizeContext(args))
  },
  warn(message: string, ...args: unknown[]): void {
    emit('warn', message, normalizeContext(args))
  },
  error(message: string, ...args: unknown[]): void {
    emit('error', message, normalizeContext(args))
  },
}

// Exposed for tests only.
export const __testing = {
  resolveLevelSetting,
  shouldLog,
  toError,
}
