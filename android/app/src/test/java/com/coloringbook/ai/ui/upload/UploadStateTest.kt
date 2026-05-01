package com.coloringbook.ai.ui.upload

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pure-state assertions for [UploadState]. The full ViewModel pipeline depends on
 * `android.graphics.Bitmap`, which requires Robolectric or instrumented tests, so
 * we cover the sealed hierarchy explicitly instead.
 */
class UploadStateTest {

    @Test
    fun `idle and complete are singletons`() {
        assertTrue(UploadState.Idle === UploadState.Idle)
        assertTrue(UploadState.Complete === UploadState.Complete)
    }

    @Test
    fun `progress steps are monotonically increasing`() {
        val compressing = UploadState.Compressing()
        val uploading = UploadState.Uploading()
        val processing = UploadState.Processing()

        assertTrue(compressing.progress < uploading.progress)
        assertTrue(uploading.progress < processing.progress)
    }

    @Test
    fun `error state preserves message`() {
        val state = UploadState.Error("nope")
        assertEquals("nope", state.message)
        assertNotEquals(UploadState.Error("other"), state)
    }
}
