interface OpenTelemetrySdk {
  start(): void
  shutdown(): Promise<void>
}

interface NodeSdkCtor {
  new(config: {
    traceExporter: object
    metricReader: object
    instrumentations: object[]
  }): OpenTelemetrySdk
}

interface ExporterCtor {
  new(): object
}

interface MetricReaderCtor {
  new(config: {
    exporter: object
    exportIntervalMillis: number
  }): object
}

interface InstrumentationCtor {
  new(): object
}

function loadNodeModule<T>(specifier: string): T {
  const dynamicRequire = eval('require') as NodeRequire
  return dynamicRequire(specifier) as T
}

declare global {
  var __coloringBookOpenTelemetryStarted: boolean | undefined
  var __coloringBookOpenTelemetryShutdownRegistered: boolean | undefined
  var __coloringBookOpenTelemetrySdk: OpenTelemetrySdk | undefined
}

function getMetricExportInterval() {
  const parsed = Number(process.env.OTEL_METRIC_EXPORT_INTERVAL)
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return 1000
}

export function startOpenTelemetry() {
  if (globalThis.__coloringBookOpenTelemetryStarted) {
    return
  }

  if (process.env.NODE_ENV === 'test') {
    return
  }

  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log('📈 OpenTelemetry skipped because OTLP endpoint is not configured')
    return
  }

  const { NodeSDK } = loadNodeModule<{ NodeSDK: NodeSdkCtor }>('@opentelemetry/sdk-node')
  const { OTLPTraceExporter } = loadNodeModule<{ OTLPTraceExporter: ExporterCtor }>('@opentelemetry/exporter-trace-otlp-grpc')
  const { OTLPMetricExporter } = loadNodeModule<{ OTLPMetricExporter: ExporterCtor }>('@opentelemetry/exporter-metrics-otlp-grpc')
  const { PeriodicExportingMetricReader } = loadNodeModule<{ PeriodicExportingMetricReader: MetricReaderCtor }>('@opentelemetry/sdk-metrics')
  const { HttpInstrumentation } = loadNodeModule<{ HttpInstrumentation: InstrumentationCtor }>('@opentelemetry/instrumentation-http')
  const { RuntimeNodeInstrumentation } = loadNodeModule<{ RuntimeNodeInstrumentation: InstrumentationCtor }>('@opentelemetry/instrumentation-runtime-node')
  const { UndiciInstrumentation } = loadNodeModule<{ UndiciInstrumentation: InstrumentationCtor }>('@opentelemetry/instrumentation-undici')

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
      exportIntervalMillis: getMetricExportInterval(),
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new UndiciInstrumentation(),
      new RuntimeNodeInstrumentation(),
    ],
  })

  sdk.start()

  globalThis.__coloringBookOpenTelemetrySdk = sdk
  globalThis.__coloringBookOpenTelemetryStarted = true

  console.log('📈 OpenTelemetry configured for Aspire dashboard')

  if (!globalThis.__coloringBookOpenTelemetryShutdownRegistered) {
    globalThis.__coloringBookOpenTelemetryShutdownRegistered = true

    process.once('SIGTERM', () => {
      void sdk.shutdown().catch((error) => {
        console.error('❌ Error during OpenTelemetry shutdown:', error)
      })
    })
  }
}