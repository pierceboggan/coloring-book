package com.coloringbook.ai.ui.dashboard

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.data.model.ImageStatus
import com.coloringbook.ai.ui.theme.StatusCompleted
import com.coloringbook.ai.ui.theme.StatusError
import com.coloringbook.ai.ui.theme.StatusProcessing
import com.coloringbook.ai.util.relativeTimeString

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onImageClick: (String) -> Unit,
    onColorClick: (String) -> Unit,
    viewModel: DashboardViewModel = hiltViewModel(),
) {
    val images by viewModel.images.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("My Coloring Pages") })
        }
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = isLoading,
            onRefresh = { viewModel.fetchImages() },
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            if (images.isEmpty() && !isLoading) {
                EmptyGallery()
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(images, key = { it.id }) { image ->
                        ImageCard(
                            image = image,
                            onClick = { onImageClick(image.id) },
                            onColorClick = { onColorClick(image.id) },
                            onFavoriteClick = { viewModel.toggleFavorite(image.id) },
                            onDeleteClick = { viewModel.deleteImage(image.id) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ImageCard(
    image: ColoringImage,
    onClick: () -> Unit,
    onColorClick: () -> Unit,
    onFavoriteClick: () -> Unit,
    onDeleteClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f),
            ) {
                val imageUrl = image.coloringPageUrl ?: image.originalUrl
                AsyncImage(
                    model = imageUrl,
                    contentDescription = image.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )

                // Status badge
                if (image.status != ImageStatus.COMPLETED) {
                    StatusBadge(
                        status = image.status,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp),
                    )
                }
            }

            Column(modifier = Modifier.padding(8.dp)) {
                Text(
                    text = image.name,
                    style = MaterialTheme.typography.labelLarge,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = relativeTimeString(image.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                // Action row
                Box(
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    IconButton(
                        onClick = onFavoriteClick,
                        modifier = Modifier.align(Alignment.CenterStart).size(32.dp),
                    ) {
                        Icon(
                            imageVector = if (image.isFavorite) Icons.Filled.Favorite
                                else Icons.Filled.FavoriteBorder,
                            contentDescription = "Favorite",
                            tint = if (image.isFavorite) MaterialTheme.colorScheme.error
                                else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp),
                        )
                    }

                    if (image.status == ImageStatus.COMPLETED) {
                        IconButton(
                            onClick = onColorClick,
                            modifier = Modifier.align(Alignment.Center).size(32.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Palette,
                                contentDescription = "Color",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                    }

                    IconButton(
                        onClick = onDeleteClick,
                        modifier = Modifier.align(Alignment.CenterEnd).size(32.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Delete",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusBadge(status: ImageStatus, modifier: Modifier = Modifier) {
    val (text, color) = when (status) {
        ImageStatus.UPLOADING -> "Uploading" to StatusProcessing
        ImageStatus.PROCESSING -> "Processing" to StatusProcessing
        ImageStatus.ERROR -> "Error" to StatusError
        ImageStatus.COMPLETED -> "Ready" to StatusCompleted
    }
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = color),
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimary,
        )
    }
}

@Composable
private fun EmptyGallery() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Filled.Palette,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = "No coloring pages yet",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(top = 16.dp),
        )
        Text(
            text = "Upload a photo to get started!",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
