package com.coloringbook.ai

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import io.sentry.android.core.SentryAndroid

@HiltAndroidApp
class ColoringBookApp : Application() {

    override fun onCreate() {
        super.onCreate()
        initSentry()
    }

    private fun initSentry() {
        val dsn = BuildConfig.SENTRY_DSN
        if (dsn.isNotBlank()) {
            SentryAndroid.init(this) { options ->
                options.dsn = dsn
                options.tracesSampleRate = if (BuildConfig.DEBUG) 1.0 else 0.1
                options.isEnableAutoSessionTracking = true
                options.environment = if (BuildConfig.DEBUG) "development" else "production"
            }
        }
    }
}
