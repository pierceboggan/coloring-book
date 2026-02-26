package com.coloringbook.ai.ui.canvas

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coloringbook.ai.service.SupabaseService
import com.coloringbook.ai.ui.theme.CanvasBlack
import com.coloringbook.ai.ui.theme.canvasColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DrawingPath(
    val points: List<Offset>,
    val color: Color,
    val strokeWidth: Float,
)

@HiltViewModel
class ColoringCanvasViewModel @Inject constructor(
    private val supabaseService: SupabaseService,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    val imageId: String = savedStateHandle["imageId"] ?: ""

    private val _coloringPageUrl = MutableStateFlow<String?>(null)
    val coloringPageUrl: StateFlow<String?> = _coloringPageUrl.asStateFlow()

    private val _paths = MutableStateFlow<List<DrawingPath>>(emptyList())
    val paths: StateFlow<List<DrawingPath>> = _paths.asStateFlow()

    private val _currentColor = MutableStateFlow(CanvasBlack)
    val currentColor: StateFlow<Color> = _currentColor.asStateFlow()

    private val _strokeWidth = MutableStateFlow(8f)
    val strokeWidth: StateFlow<Float> = _strokeWidth.asStateFlow()

    private val _undoStack = MutableStateFlow<List<List<DrawingPath>>>(emptyList())
    private val _redoStack = MutableStateFlow<List<List<DrawingPath>>>(emptyList())

    val canUndo: Boolean get() = _undoStack.value.isNotEmpty()
    val canRedo: Boolean get() = _redoStack.value.isNotEmpty()

    private var currentPoints = mutableListOf<Offset>()

    init {
        loadImage()
    }

    private fun loadImage() {
        viewModelScope.launch {
            try {
                val image = supabaseService.fetchImage(imageId)
                _coloringPageUrl.value = image.coloringPageUrl
            } catch (_: Exception) {}
        }
    }

    fun setColor(color: Color) {
        _currentColor.value = color
    }

    fun setStrokeWidth(width: Float) {
        _strokeWidth.value = width
    }

    fun onDrawStart(offset: Offset) {
        currentPoints = mutableListOf(offset)
    }

    fun onDrawMove(offset: Offset) {
        currentPoints.add(offset)
        // Update paths with in-progress stroke
        val inProgressPath = DrawingPath(
            points = currentPoints.toList(),
            color = _currentColor.value,
            strokeWidth = _strokeWidth.value,
        )
        _paths.value = _paths.value.dropLast(
            if (_paths.value.lastOrNull()?.points == currentPoints) 1 else 0
        ) + inProgressPath
    }

    fun onDrawEnd() {
        if (currentPoints.size >= 2) {
            // Save undo state (max 15 levels)
            val undoList = _undoStack.value.toMutableList()
            undoList.add(_paths.value.dropLast(1))
            if (undoList.size > 15) undoList.removeFirst()
            _undoStack.value = undoList
            _redoStack.value = emptyList()
        }
        currentPoints = mutableListOf()
    }

    fun undo() {
        val undoStack = _undoStack.value.toMutableList()
        if (undoStack.isEmpty()) return
        val redoStack = _redoStack.value.toMutableList()
        redoStack.add(_paths.value)
        _redoStack.value = redoStack
        _paths.value = undoStack.removeLast()
        _undoStack.value = undoStack
    }

    fun redo() {
        val redoStack = _redoStack.value.toMutableList()
        if (redoStack.isEmpty()) return
        val undoStack = _undoStack.value.toMutableList()
        undoStack.add(_paths.value)
        _undoStack.value = undoStack
        _paths.value = redoStack.removeLast()
        _redoStack.value = redoStack
    }

    fun clearCanvas() {
        val undoStack = _undoStack.value.toMutableList()
        undoStack.add(_paths.value)
        _undoStack.value = undoStack
        _redoStack.value = emptyList()
        _paths.value = emptyList()
    }
}
