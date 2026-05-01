package com.coloringbook.ai.ui.canvas

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.SavedStateHandle
import com.coloringbook.ai.MainDispatcherRule
import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.data.model.ImageStatus
import com.coloringbook.ai.service.SupabaseService
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ColoringCanvasViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var supabaseService: SupabaseService

    @Before
    fun setUp() {
        supabaseService = mockk(relaxed = true)
        coEvery { supabaseService.fetchImage(any()) } returns ColoringImage(
            id = "img-1",
            userId = "user-1",
            originalUrl = "https://example.com/o.jpg",
            coloringPageUrl = "https://example.com/coloring.png",
            name = "Test",
            status = ImageStatus.COMPLETED,
        )
    }

    private fun newViewModel(imageId: String = "img-1") = ColoringCanvasViewModel(
        supabaseService = supabaseService,
        savedStateHandle = SavedStateHandle(mapOf("imageId" to imageId)),
    )

    @Test
    fun `imageId is read from SavedStateHandle`() {
        val vm = newViewModel("xyz")
        assertEquals("xyz", vm.imageId)
    }

    @Test
    fun `loadImage populates coloringPageUrl from service`() = runTest {
        val vm = newViewModel()
        advanceUntilIdle()
        assertEquals("https://example.com/coloring.png", vm.coloringPageUrl.value)
    }

    @Test
    fun `loadImage swallows errors and leaves url null`() = runTest {
        coEvery { supabaseService.fetchImage(any()) } throws RuntimeException("network")
        val vm = newViewModel()
        advanceUntilIdle()
        assertNull(vm.coloringPageUrl.value)
    }

    @Test
    fun `setColor and setStrokeWidth update state`() {
        val vm = newViewModel()
        vm.setColor(Color.Red)
        vm.setStrokeWidth(20f)
        assertEquals(Color.Red, vm.currentColor.value)
        assertEquals(20f, vm.strokeWidth.value)
    }

    @Test
    fun `single point stroke does not commit on draw end`() {
        val vm = newViewModel()
        vm.onDrawStart(Offset(1f, 1f))
        vm.onDrawEnd()
        assertTrue(vm.paths.value.isEmpty())
        assertFalse(vm.canUndo.value)
    }

    @Test
    fun `multi point stroke commits and enables undo`() {
        val vm = newViewModel()
        vm.onDrawStart(Offset(1f, 1f))
        vm.onDrawMove(Offset(2f, 2f))
        vm.onDrawEnd()

        assertEquals(1, vm.paths.value.size)
        assertEquals(2, vm.paths.value.first().points.size)
        assertTrue(vm.canUndo.value)
        assertFalse(vm.canRedo.value)
    }

    @Test
    fun `undo restores previous state and enables redo`() {
        val vm = newViewModel()
        vm.onDrawStart(Offset(0f, 0f))
        vm.onDrawMove(Offset(1f, 1f))
        vm.onDrawEnd()

        vm.undo()
        assertTrue(vm.paths.value.isEmpty())
        assertFalse(vm.canUndo.value)
        assertTrue(vm.canRedo.value)

        vm.redo()
        assertEquals(1, vm.paths.value.size)
        assertTrue(vm.canUndo.value)
        assertFalse(vm.canRedo.value)
    }

    @Test
    fun `new stroke clears redo stack`() {
        val vm = newViewModel()
        vm.onDrawStart(Offset(0f, 0f)); vm.onDrawMove(Offset(1f, 1f)); vm.onDrawEnd()
        vm.undo()
        assertTrue(vm.canRedo.value)
        vm.onDrawStart(Offset(2f, 2f)); vm.onDrawMove(Offset(3f, 3f)); vm.onDrawEnd()
        assertFalse(vm.canRedo.value)
    }

    @Test
    fun `undo stack caps at 15 entries`() {
        val vm = newViewModel()
        repeat(20) { i ->
            vm.onDrawStart(Offset(i.toFloat(), i.toFloat()))
            vm.onDrawMove(Offset(i + 0.5f, i + 0.5f))
            vm.onDrawEnd()
        }
        var undoCount = 0
        while (vm.canUndo.value && undoCount < 100) {
            vm.undo(); undoCount++
        }
        assertEquals(15, undoCount)
    }

    @Test
    fun `clearCanvas removes paths and is undoable when non-empty`() {
        val vm = newViewModel()
        vm.onDrawStart(Offset(0f, 0f)); vm.onDrawMove(Offset(1f, 1f)); vm.onDrawEnd()
        vm.clearCanvas()
        assertTrue(vm.paths.value.isEmpty())
        assertTrue(vm.canUndo.value)

        vm.undo()
        assertEquals(1, vm.paths.value.size)
    }

    @Test
    fun `in-progress stroke is included in rendered paths`() {
        val vm = newViewModel()
        vm.onDrawStart(Offset(0f, 0f))
        vm.onDrawMove(Offset(5f, 5f))
        assertEquals(1, vm.paths.value.size)
        assertFalse(vm.canUndo.value)
    }
}
