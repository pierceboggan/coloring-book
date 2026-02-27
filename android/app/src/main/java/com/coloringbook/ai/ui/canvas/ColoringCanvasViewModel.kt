package com.coloringbook.ai.ui.canvas

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coloringbook.ai.service.SupabaseService
import com.coloringbook.ai.ui.theme.CanvasBlack
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

    // Committed paths (complete strokes only)
    private val _committedPaths = MutableStateFlow<List<DrawingPath>>(emptyList())

    // Current in-progress stroke (while finger is down)
    private val _currentStroke = MutableStateFlow<DrawingPath?>(null)

    // Combined paths for rendering: committed + in-progress
    private val _paths = MutableStateFlow<List<DrawingPath>>(emptyList())
    val paths: StateFlow<List<DrawingPath>> = _paths.asStateFlow()

    private val _currentColor = MutableStateFlow(CanvasBlack)
    val currentColor: StateFlow<Color> = _currentColor.asStateFlow()

    private val _strokeWidth = MutableStateFlow(8f)
    val strokeWidth: StateFlow<Float> = _strokeWidth.asStateFlow()

    private val undoStack = mutableListOf<List<DrawingPath>>()
    private val redoStack = mutableListOf<List<DrawingPath>>()

    private val _canUndo = MutableStateFlow(false)
    val canUndo: StateFlow<Boolean> = _canUndo.asStateFlow()

    private val _canRedo = MutableStateFlow(false)
    val canRedo: StateFlow<Boolean> = _canRedo.asStateFlow()

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

    private fun updateRenderPaths() {
        val stroke = _currentStroke.value
        _paths.value = if (stroke != null) _committedPaths.value + stroke
            else _committedPaths.value
    }

    private fun updateUndoRedoState() {
        _canUndo.value = undoStack.isNotEmpty()
        _canRedo.value = redoStack.isNotEmpty()
    }

    fun setColor(color: Color) {
        _currentColor.value = color
    }

    fun setStrokeWidth(width: Float) {
        _strokeWidth.value = width
    }

    fun onDrawStart(offset: Offset) {
        currentPoints = mutableListOf(offset)
        _currentStroke.value = DrawingPath(
            points = listOf(offset),
            color = _currentColor.value,
            strokeWidth = _strokeWidth.value,
        )
        updateRenderPaths()
    }

    fun onDrawMove(offset: Offset) {
        currentPoints.add(offset)
        _currentStroke.value = DrawingPath(
            points = currentPoints.toList(),
            color = _currentColor.value,
            strokeWidth = _strokeWidth.value,
        )
        updateRenderPaths()
    }

    fun onDrawEnd() {
        val stroke = _currentStroke.value
        if (stroke != null && stroke.points.size >= 2) {
            // Push current committed state onto undo stack
            if (undoStack.size >= 15) undoStack.removeFirst()
            undoStack.add(_committedPaths.value)
            redoStack.clear()

            // Commit the stroke
            _committedPaths.value = _committedPaths.value + stroke
        }
        _currentStroke.value = null
        currentPoints = mutableListOf()
        updateRenderPaths()
        updateUndoRedoState()
    }

    fun undo() {
        if (undoStack.isEmpty()) return
        redoStack.add(_committedPaths.value)
        _committedPaths.value = undoStack.removeLast()
        updateRenderPaths()
        updateUndoRedoState()
    }

    fun redo() {
        if (redoStack.isEmpty()) return
        undoStack.add(_committedPaths.value)
        _committedPaths.value = redoStack.removeLast()
        updateRenderPaths()
        updateUndoRedoState()
    }

    fun clearCanvas() {
        if (_committedPaths.value.isNotEmpty()) {
            undoStack.add(_committedPaths.value)
            redoStack.clear()
        }
        _committedPaths.value = emptyList()
        _currentStroke.value = null
        updateRenderPaths()
        updateUndoRedoState()
    }
}
