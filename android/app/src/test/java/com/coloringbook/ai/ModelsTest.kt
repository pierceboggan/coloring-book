package com.coloringbook.ai

import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.data.model.FamilyAlbum
import com.coloringbook.ai.data.model.ImageStatus
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ModelsTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun `ColoringImage deserializes from JSON`() {
        val jsonStr = """
            {
                "id": "abc-123",
                "user_id": "user-1",
                "original_url": "https://example.com/photo.jpg",
                "coloring_page_url": null,
                "name": "Test Photo",
                "status": "processing",
                "is_favorite": false
            }
        """.trimIndent()

        val image = json.decodeFromString<ColoringImage>(jsonStr)
        assertEquals("abc-123", image.id)
        assertEquals("user-1", image.userId)
        assertEquals(ImageStatus.PROCESSING, image.status)
        assertNull(image.coloringPageUrl)
    }

    @Test
    fun `FamilyAlbum serializes correctly`() {
        val album = FamilyAlbum(
            id = "album-1",
            userId = "user-1",
            name = "My Album",
            shareCode = "ABCD1234",
            imageIds = listOf("img-1", "img-2"),
        )

        val jsonStr = json.encodeToString(FamilyAlbum.serializer(), album)
        val decoded = json.decodeFromString<FamilyAlbum>(jsonStr)
        assertEquals(album.id, decoded.id)
        assertEquals(album.shareCode, decoded.shareCode)
        assertEquals(2, decoded.imageIds.size)
    }

    @Test
    fun `ImageStatus enum maps correctly`() {
        assertEquals(ImageStatus.UPLOADING, json.decodeFromString<ImageStatus>("\"uploading\""))
        assertEquals(ImageStatus.PROCESSING, json.decodeFromString<ImageStatus>("\"processing\""))
        assertEquals(ImageStatus.COMPLETED, json.decodeFromString<ImageStatus>("\"completed\""))
        assertEquals(ImageStatus.ERROR, json.decodeFromString<ImageStatus>("\"error\""))
    }
}
