package com.coloringbook.ai.ui.dashboard

import com.coloringbook.ai.MainDispatcherRule
import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.data.model.ImageStatus
import com.coloringbook.ai.service.SupabaseService
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class DashboardViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private fun image(id: String, fav: Boolean = false) = ColoringImage(
        id = id,
        userId = "u",
        originalUrl = "https://example.com/$id.jpg",
        name = "img-$id",
        status = ImageStatus.COMPLETED,
        isFavorite = fav,
    )

    @Test
    fun `init fetches images and clears loading`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchImages() } returns listOf(image("a"), image("b"))

        val vm = DashboardViewModel(service)
        advanceUntilIdle()

        assertEquals(2, vm.images.value.size)
        assertFalse(vm.isLoading.value)
        assertNull(vm.error.value)
    }

    @Test
    fun `fetchImages surfaces error message`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchImages() } throws RuntimeException("boom")

        val vm = DashboardViewModel(service)
        advanceUntilIdle()

        assertTrue(vm.images.value.isEmpty())
        assertEquals("boom", vm.error.value)
        assertFalse(vm.isLoading.value)
    }

    @Test
    fun `deleteImage removes from list and calls service`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchImages() } returns listOf(image("a"), image("b"))

        val vm = DashboardViewModel(service)
        advanceUntilIdle()

        vm.deleteImage("a")
        advanceUntilIdle()

        coVerify { service.deleteImage("a") }
        assertEquals(listOf("b"), vm.images.value.map { it.id })
    }

    @Test
    fun `toggleFavorite flips state and calls service`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchImages() } returns listOf(image("a", fav = false))

        val vm = DashboardViewModel(service)
        advanceUntilIdle()

        vm.toggleFavorite("a")
        advanceUntilIdle()

        coVerify { service.toggleFavorite("a", true) }
        assertTrue(vm.images.value.first().isFavorite)
    }

    @Test
    fun `toggleFavorite is a no-op for unknown id`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchImages() } returns listOf(image("a"))

        val vm = DashboardViewModel(service)
        advanceUntilIdle()

        vm.toggleFavorite("missing")
        advanceUntilIdle()

        coVerify(exactly = 0) { service.toggleFavorite(any(), any()) }
    }
}
