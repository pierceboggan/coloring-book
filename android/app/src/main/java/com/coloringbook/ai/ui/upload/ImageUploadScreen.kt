package com.coloringbook.ai.ui.upload

import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageUploadScreen(
    viewModel: ImageUploadViewModel = hiltViewModel(),
) {
    val uploadState by viewModel.uploadState.collectAsState()
    val selectedUri by viewModel.selectedImageUri.collectAsState()
    val context = LocalContext.current

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { viewModel.setSelectedImage(it) }
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        bitmap?.let { viewModel.uploadAndProcess(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Create Coloring Page") })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (selectedUri != null) {
                // Show selected image preview
                AsyncImage(
                    model = selectedUri,
                    contentDescription = "Selected photo",
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop,
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Upload state indicator
                UploadProgressSection(uploadState)

                Spacer(modifier = Modifier.height(24.dp))

                when (uploadState) {
                    is UploadState.Idle -> {
                        Button(
                            onClick = {
                                val uri = selectedUri ?: return@Button
                                val inputStream = context.contentResolver.openInputStream(uri)
                                val bitmap = BitmapFactory.decodeStream(inputStream)
                                inputStream?.close()
                                bitmap?.let { viewModel.uploadAndProcess(it) }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Icon(Icons.Filled.CloudUpload, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Generate Coloring Page")
                        }
                        OutlinedButton(
                            onClick = { viewModel.reset() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp),
                        ) {
                            Text("Choose Different Photo")
                        }
                    }
                    is UploadState.Complete -> {
                        Button(
                            onClick = { viewModel.reset() },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Create Another")
                        }
                    }
                    is UploadState.Error -> {
                        Button(
                            onClick = {
                                val uri = selectedUri ?: return@Button
                                val inputStream = context.contentResolver.openInputStream(uri)
                                val bitmap = BitmapFactory.decodeStream(inputStream)
                                inputStream?.close()
                                bitmap?.let { viewModel.uploadAndProcess(it) }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Retry")
                        }
                    }
                    else -> {} // Processing states show progress
                }
            } else {
                // No image selected - show upload options
                Spacer(modifier = Modifier.weight(1f))
                UploadOptionsCard(
                    onPickPhoto = { photoPickerLauncher.launch("image/*") },
                    onTakePhoto = { cameraLauncher.launch(null) },
                )
                Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun UploadOptionsCard(
    onPickPhoto: () -> Unit,
    onTakePhoto: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                imageVector = Icons.Filled.CloudUpload,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Upload a photo to transform it into a coloring page",
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onPickPhoto,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Filled.PhotoLibrary, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Choose from Gallery")
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = onTakePhoto,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Filled.CameraAlt, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Take a Photo")
            }
        }
    }
}

@Composable
private fun UploadProgressSection(state: UploadState) {
    val (label, progress, icon) = when (state) {
        is UploadState.Compressing -> Triple("Compressing image…", state.progress, null)
        is UploadState.Uploading -> Triple("Uploading to cloud…", state.progress, null)
        is UploadState.Processing -> Triple("AI is creating your coloring page…", state.progress, null)
        is UploadState.Complete -> Triple("Coloring page ready!", 1f, Icons.Filled.CheckCircle)
        is UploadState.Error -> Triple(state.message, 0f, Icons.Filled.Error)
        else -> return
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = if (state is UploadState.Error) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.primary,
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            color = if (state is UploadState.Error) MaterialTheme.colorScheme.error
                else MaterialTheme.colorScheme.onSurface,
        )

        if (state !is UploadState.Complete && state !is UploadState.Error) {
            Spacer(modifier = Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
