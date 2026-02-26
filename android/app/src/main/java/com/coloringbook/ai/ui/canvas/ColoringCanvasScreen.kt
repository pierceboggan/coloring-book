package com.coloringbook.ai.ui.canvas

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Undo
import androidx.compose.material.icons.automirrored.filled.Redo
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.Path as ComposePath
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.coloringbook.ai.ui.theme.canvasColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ColoringCanvasScreen(
    onBack: () -> Unit,
    viewModel: ColoringCanvasViewModel = hiltViewModel(),
) {
    val coloringPageUrl by viewModel.coloringPageUrl.collectAsState()
    val paths by viewModel.paths.collectAsState()
    val currentColor by viewModel.currentColor.collectAsState()
    val strokeWidth by viewModel.strokeWidth.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Color") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.Close, contentDescription = "Close")
                    }
                },
                actions = {
                    IconButton(
                        onClick = { viewModel.undo() },
                        enabled = viewModel.canUndo,
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Undo, contentDescription = "Undo")
                    }
                    IconButton(
                        onClick = { viewModel.redo() },
                        enabled = viewModel.canRedo,
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Redo, contentDescription = "Redo")
                    }
                    IconButton(onClick = { viewModel.clearCanvas() }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Clear")
                    }
                    IconButton(onClick = { /* TODO: Save artwork */ }) {
                        Icon(Icons.Filled.Save, contentDescription = "Save")
                    }
                },
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            // Drawing canvas area
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .clipToBounds(),
            ) {
                // Background coloring page image
                coloringPageUrl?.let { url ->
                    AsyncImage(
                        model = url,
                        contentDescription = "Coloring page",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit,
                    )
                }

                // Drawing canvas overlay
                Canvas(
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(Unit) {
                            detectDragGestures(
                                onDragStart = { offset -> viewModel.onDrawStart(offset) },
                                onDrag = { change, _ ->
                                    viewModel.onDrawMove(change.position)
                                },
                                onDragEnd = { viewModel.onDrawEnd() },
                            )
                        },
                ) {
                    paths.forEach { drawingPath ->
                        if (drawingPath.points.size >= 2) {
                            val path = ComposePath().apply {
                                val first = drawingPath.points.first()
                                moveTo(first.x, first.y)
                                drawingPath.points.drop(1).forEach { point ->
                                    lineTo(point.x, point.y)
                                }
                            }
                            drawPath(
                                path = path,
                                color = drawingPath.color,
                                style = Stroke(
                                    width = drawingPath.strokeWidth,
                                    cap = StrokeCap.Round,
                                    join = StrokeJoin.Round,
                                ),
                            )
                        }
                    }
                }
            }

            // Toolbar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(12.dp),
            ) {
                // Color picker row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    canvasColors.forEach { color ->
                        ColorSwatch(
                            color = color,
                            isSelected = color == currentColor,
                            onClick = { viewModel.setColor(color) },
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Brush size slider
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Size", style = MaterialTheme.typography.labelMedium)
                    Spacer(modifier = Modifier.width(8.dp))
                    Slider(
                        value = strokeWidth,
                        onValueChange = { viewModel.setStrokeWidth(it) },
                        valueRange = 2f..30f,
                        modifier = Modifier.weight(1f),
                    )
                    // Preview dot
                    Box(
                        modifier = Modifier
                            .size((strokeWidth.coerceIn(8f, 30f)).dp)
                            .clip(CircleShape)
                            .background(currentColor),
                    )
                }
            }
        }
    }
}

@Composable
private fun ColorSwatch(
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .clip(CircleShape)
            .background(color)
            .then(
                if (isSelected) Modifier.border(3.dp, MaterialTheme.colorScheme.onSurface, CircleShape)
                else Modifier.border(1.dp, Color.Gray.copy(alpha = 0.3f), CircleShape)
            )
            .clickable(onClick = onClick),
    )
}
