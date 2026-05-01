package com.coloringbook.ai.ui.albums

import com.coloringbook.ai.MainDispatcherRule
import com.coloringbook.ai.data.model.FamilyAlbum
import com.coloringbook.ai.service.SupabaseService
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AlbumsViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `init fetches albums`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchAlbums() } returns listOf(
            FamilyAlbum(id = "1", name = "A", shareCode = "AAAA1111"),
        )

        val vm = AlbumsViewModel(service)
        advanceUntilIdle()

        assertEquals(1, vm.albums.value.size)
        assertEquals("A", vm.albums.value.first().name)
    }

    @Test
    fun `createAlbum prepends new album with generated share code`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchAlbums() } returns emptyList()
        every { service.currentUserId } returns "user-1"

        val albumSlot = slot<FamilyAlbum>()
        coEvery { service.createAlbum(capture(albumSlot)) } answers { albumSlot.captured }

        val vm = AlbumsViewModel(service)
        advanceUntilIdle()

        vm.createAlbum("Vacation", listOf("img-1", "img-2"))
        advanceUntilIdle()

        assertEquals(1, vm.albums.value.size)
        val created = vm.albums.value.first()
        assertEquals("Vacation", created.name)
        assertEquals(listOf("img-1", "img-2"), created.imageIds)
        assertEquals("user-1", created.userId)
        assertEquals(8, created.shareCode.length)
        assertTrue(created.shareCode.all { it.isLetterOrDigit() })
        assertNotNull(created.id)
    }

    @Test
    fun `createAlbum without auth surfaces error and skips insert`() = runTest {
        val service = mockk<SupabaseService>(relaxed = true)
        coEvery { service.fetchAlbums() } returns emptyList()
        every { service.currentUserId } returns null

        val vm = AlbumsViewModel(service)
        advanceUntilIdle()

        vm.createAlbum("X", emptyList())
        advanceUntilIdle()

        assertTrue(vm.albums.value.isEmpty())
        assertNotNull(vm.error.value)
    }
}
