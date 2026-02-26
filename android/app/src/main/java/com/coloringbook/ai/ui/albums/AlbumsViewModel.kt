package com.coloringbook.ai.ui.albums

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coloringbook.ai.data.model.FamilyAlbum
import com.coloringbook.ai.service.SupabaseService
import com.coloringbook.ai.util.generateShareCode
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class AlbumsViewModel @Inject constructor(
    private val supabaseService: SupabaseService,
) : ViewModel() {

    private val _albums = MutableStateFlow<List<FamilyAlbum>>(emptyList())
    val albums: StateFlow<List<FamilyAlbum>> = _albums.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        fetchAlbums()
    }

    fun fetchAlbums() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _albums.value = supabaseService.fetchAlbums()
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun createAlbum(name: String, imageIds: List<String>) {
        viewModelScope.launch {
            try {
                val userId = supabaseService.currentUserId
                    ?: throw IllegalStateException("Not authenticated")
                val album = FamilyAlbum(
                    id = UUID.randomUUID().toString(),
                    userId = userId,
                    createdBy = userId,
                    name = name,
                    shareCode = generateShareCode(),
                    imageIds = imageIds,
                )
                val created = supabaseService.createAlbum(album)
                _albums.value = listOf(created) + _albums.value
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }
}
