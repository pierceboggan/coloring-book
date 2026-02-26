package com.coloringbook.ai

import com.coloringbook.ai.util.generateShareCode
import com.coloringbook.ai.util.relativeTimeString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class UtilsTest {

    @Test
    fun `generateShareCode returns 8 character string`() {
        val code = generateShareCode()
        assertEquals(8, code.length)
        assertTrue(code.all { it.isLetterOrDigit() })
    }

    @Test
    fun `generateShareCode returns unique codes`() {
        val codes = (1..100).map { generateShareCode() }.toSet()
        // With 62^8 possibilities, 100 codes should all be unique
        assertEquals(100, codes.size)
    }

    @Test
    fun `relativeTimeString returns empty for null`() {
        assertEquals("", relativeTimeString(null))
    }

    @Test
    fun `relativeTimeString returns empty for invalid input`() {
        assertEquals("", relativeTimeString("not-a-date"))
    }
}
