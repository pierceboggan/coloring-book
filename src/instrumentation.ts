export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  const { startOpenTelemetry } = await import('@/lib/open-telemetry')
  startOpenTelemetry()
}