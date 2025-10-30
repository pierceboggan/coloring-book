'use client'

import { useEffect } from 'react'
import * as amplitude from '@amplitude/analytics-browser'
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser'

const AMPLITUDE_API_KEY = '58b1ed87a5222642dfcce47c51e35f50'
const SESSION_REPLAY_SAMPLE_RATE = 1
const AUTOCAPTURE_CONFIG = { autocapture: true }

let isInitialized = false

export function AmplitudeInitializer() {
  useEffect(() => {
    if (isInitialized) {
      return
    }

    amplitude.add(sessionReplayPlugin({ sampleRate: SESSION_REPLAY_SAMPLE_RATE }))
    amplitude.init(AMPLITUDE_API_KEY, undefined, AUTOCAPTURE_CONFIG)

    isInitialized = true
  }, [])

  return null
}
