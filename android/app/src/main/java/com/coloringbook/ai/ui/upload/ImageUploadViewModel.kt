package com.coloringbook.ai.ui.upload

import android.graphics.Bitmap
import android.net.Uri
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.data.model.ImageStatus
import com.coloringbook.ai.service.SupabaseService
import com.coloringbook.ai.service.WebApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.util.UUID
import javax.inject.Inject

sealed class UploadState {
    data object Idle : UploadState()
    data class Compressing(val progress: Float = 0.3f) : UploadState()
    data class Uploading(val progress: Float = 0.5f) : UploadState()
    data class Processing(val progress: Float = 0.75f) : UploadState()
    data object Complete : UploadState()
    data class Error(val message: String) : UploadState()
}

@HiltViewModel
class ImageUploadViewModel @Inject constructor(
    private val supabaseService: SupabaseService,
    private val webApiService: WebApiService,
) : ViewModel() {

    private val TAG = "ImageUploadViewModel"

    private val _uploadState = MutableStateFlow<UploadState>(UploadState.Idle)
    val uploadState: StateFlow<UploadState> = _uploadState.asStateFlow()

    private val _selectedImageUri = MutableStateFlow<Uri?>(null)
    val selectedImageUri: StateFlow<Uri?> = _selectedImageUri.asStateFlow()

    fun setSelectedImage(uri: Uri) {
        _selectedImageUri.value = uri
        _uploadState.value = UploadState.Idle
    }

    fun uploadAndProcess(bitmap: Bitmap, name: String = "Coloring Page") {
        viewModelScope.launch {
            try {
                val userId = supabaseService.currentUserId
                    ?: throw IllegalStateException("Not authenticated")

                // Compress
                _uploadState.value = UploadState.Compressing()
                Log.d(TAG, "🚀 Compressing image...")
                val bytes = ByteArrayOutputStream().use { stream ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
                    stream.toByteArray()
                }

                // Upload to storage
                _uploadState.value = UploadState.Uploading()
                val imageId = UUID.randomUUID().toString()
                val path = "$userId/$imageId.jpg"
                Log.d(TAG, "🚀 Uploading ${bytes.size} bytes...")
                val originalUrl = supabaseService.uploadImage("images", path, bytes)

                // Create database record
                val image = ColoringImage(
                    id = imageId,
                    userId = userId,
                    originalUrl = originalUrl,
                    name = name,
                    status = ImageStatus.PROCESSING,
                )
                supabaseService.createImageRecord(image)

                // Trigger AI processing
                _uploadState.value = UploadState.Processing()
                Log.d(TAG, "🚀 Triggering AI processing...")
                val result = webApiService.generateColoringPage(
                    imageId = imageId,
                    imageUrl = originalUrl,
                )

                if (result.success) {
                    _uploadState.value = UploadState.Complete
                    Log.d(TAG, "✅ Processing complete")
                } else {
                    _uploadState.value = UploadState.Error(result.error ?: "Processing failed")
                    Log.e(TAG, "❌ Processing failed: ${result.error}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Upload failed", e)
                _uploadState.value = UploadState.Error(e.message ?: "Upload failed")
            }
        }
    }

    fun reset() {
        _uploadState.value = UploadState.Idle
        _selectedImageUri.value = null
    }
}
