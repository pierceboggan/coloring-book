package com.coloringbook.ai.ui.canvas

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Undo
import androidx.compose.material.icons.automirrored.filled.Redo
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.Path as ComposePath
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.coloringbook.ai.ui.theme.canvasColors

// Pastel palette matching iOS
private val CanvasBgTop = Color(0xFFE0F7FA)
private val CanvasBgBottom = Color(0xFFFFE6EB)
private val ToolbarBg = Color(0xFFFFF0F5)
private val ToolbarBorder = Color(0xFFFF6F91)
private val CanvasBorder = Color(0xFFA0E7E5)
private val HeaderPink = Color(0xFFFF6F91)
private val AccentTeal = Color(0xFF1DB9B3)

@Composable
fun ColoringCanvasScreen(
    onBack: () -> Unit,
    viewModel: ColoringCanvasViewModel = hiltViewModel(),
) {
    val coloringPageUrl by viewModel.coloringPageUrl.collectAsState()
    val paths by viewModel.paths.collectAsState()
    val currentColor by viewModel.currentColor.collectAsState()
    val strokeWidth by viewModel.strokeWidth.collectAsState()
    val canUndo by viewModel.canUndo.collectAsState()
    val canRedo by viewModel.canRedo.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(CanvasBgTop, CanvasBgBottom))),
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ── Header ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White.copy(alpha = 0.85f))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.Close, contentDescription = "Close", tint = HeaderPink)
                }
                Text(
                    text = "✨ Coloring Studio",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = HeaderPink,
                    ),
                    modifier = Modifier.weight(1f),
                )
                IconButton(
                    onClick = { viewModel.undo() },
                    enabled = canUndo,
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.Undo,
                        contentDescription = "Undo",
                        tint = if (canUndo) AccentTeal else Color.Gray.copy(alpha = 0.35f),
                    )
                }
                IconButton(
                    onClick = { viewModel.redo() },
                    enabled = canRedo,
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.Redo,
                        contentDescription = "Redo",
                        tint = if (canRedo) AccentTeal else Color.Gray.copy(alpha = 0.35f),
                    )
                }
                IconButton(onClick = { viewModel.clearCanvas() }) {
                    Icon(Icons.Filled.DeleteOutline, contentDescription = "Clear", tint = Color.Gray)
                }
                FilledIconButton(
                    onClick = { /* TODO: Save artwork */ },
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = AccentTeal,
                        contentColor = Color.White,
                    ),
                    modifier = Modifier.size(36.dp),
                ) {
                    Icon(Icons.Filled.Save, contentDescription = "Save", modifier = Modifier.size(18.dp))
                }
            }

            // ── Canvas ──
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .shadow(6.dp, RoundedCornerShape(20.dp))
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.White)
                    .border(3.dp, CanvasBorder, RoundedCornerShape(20.dp))
                    .clipToBounds(),
            ) {
                coloringPageUrl?.let { url ->
                    AsyncImage(
                        model = url,
                        contentDescription = "Coloring page",
                        modifier = Modifier.fillMaxSize().padding(4.dp),
                        contentScale = ContentScale.Fit,
                    )
                }

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
                                for (i in 1 until drawingPath.points.size) {
                                    val prev = drawingPath.points[i - 1]
                                    val curr = drawingPath.points[i]
                                    // Smooth curves using quadratic bezier
                                    quadraticBezierTo(
                                        prev.x, prev.y,
                                        (prev.x + curr.x) / 2f, (prev.y + curr.y) / 2f,
                                    )
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

            // ── Tool Palette ──
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .shadow(4.dp, RoundedCornerShape(20.dp))
                    .clip(RoundedCornerShape(20.dp))
                    .background(ToolbarBg)
                    .border(2.dp, ToolbarBorder.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                    .padding(16.dp),
            ) {
                // Color picker
                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(canvasColors) { color ->
                        ColorSwatch(
                            color = color,
                            isSelected = color == currentColor,
                            onClick = { viewModel.setColor(color) },
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Brush size slider
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "Brush",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = HeaderPink,
                        ),
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Slider(
                        value = strokeWidth,
                        onValueChange = { viewModel.setStrokeWidth(it) },
                        valueRange = 2f..30f,
                        modifier = Modifier.weight(1f),
                        colors = SliderDefaults.colors(
                            thumbColor = AccentTeal,
                            activeTrackColor = AccentTeal,
                            inactiveTrackColor = AccentTeal.copy(alpha = 0.2f),
                        ),
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    // Live preview dot
                    Box(
                        modifier = Modifier
                            .size(strokeWidth.coerceIn(8f, 30f).dp)
                            .shadow(2.dp, CircleShape)
                            .clip(CircleShape)
                            .background(currentColor),
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

@Composable
private fun ColorSwatch(
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    val borderColor by animateColorAsState(
        targetValue = if (isSelected) Color(0xFF3A2E39) else Color.White,
        label = "swatchBorder",
    )
    Box(
        modifier = Modifier
            .size(if (isSelected) 40.dp else 36.dp)
            .shadow(if (isSelected) 4.dp else 2.dp, CircleShape)
            .clip(CircleShape)
            .background(color)
            .border(
                width = if (isSelected) 3.dp else 2.dp,
                color = borderColor,
                shape = CircleShape,
            )
            .clickable(onClick = onClick),
    )
}
