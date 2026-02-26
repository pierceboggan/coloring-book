package com.coloringbook.ai.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.service.SupabaseService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val supabaseService: SupabaseService,
) : ViewModel() {

    private val _images = MutableStateFlow<List<ColoringImage>>(emptyList())
    val images: StateFlow<List<ColoringImage>> = _images.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        fetchImages()
    }

    fun fetchImages() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                _images.value = supabaseService.fetchImages()
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load images"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun deleteImage(imageId: String) {
        viewModelScope.launch {
            try {
                supabaseService.deleteImage(imageId)
                _images.value = _images.value.filter { it.id != imageId }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to delete image"
            }
        }
    }

    fun toggleFavorite(imageId: String) {
        viewModelScope.launch {
            try {
                val image = _images.value.find { it.id == imageId } ?: return@launch
                val newFavorite = !image.isFavorite
                supabaseService.toggleFavorite(imageId, newFavorite)
                _images.value = _images.value.map {
                    if (it.id == imageId) it.copy(isFavorite = newFavorite) else it
                }
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }
}
