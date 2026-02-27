package com.coloringbook.ai.ui.kidmode

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.data.model.ImageStatus
import com.coloringbook.ai.service.SupabaseService
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

private val Context.kidModeDataStore by preferencesDataStore(name = "kid_mode_prefs")

@HiltViewModel
class KidModeViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val supabaseService: SupabaseService,
) : ViewModel() {

    companion object {
        private val KEY_ENABLED = booleanPreferencesKey("kid_mode_enabled")
        private val KEY_PIN = stringPreferencesKey("kid_mode_pin")
    }

    private val _isKidModeActive = MutableStateFlow(false)
    val isKidModeActive: StateFlow<Boolean> = _isKidModeActive.asStateFlow()

    private val _images = MutableStateFlow<List<ColoringImage>>(emptyList())
    val images: StateFlow<List<ColoringImage>> = _images.asStateFlow()

    private val _currentIndex = MutableStateFlow(0)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    private val _showUnlockDialog = MutableStateFlow(false)
    val showUnlockDialog: StateFlow<Boolean> = _showUnlockDialog.asStateFlow()

    init {
        viewModelScope.launch {
            _isKidModeActive.value = context.kidModeDataStore.data
                .map { it[KEY_ENABLED] ?: false }
                .first()
            if (_isKidModeActive.value) loadCompletedImages()
        }
    }

    fun enableKidMode() {
        viewModelScope.launch {
            context.kidModeDataStore.edit { it[KEY_ENABLED] = true }
            _isKidModeActive.value = true
            loadCompletedImages()
        }
    }

    fun requestUnlock() {
        _showUnlockDialog.value = true
    }

    fun dismissUnlock() {
        _showUnlockDialog.value = false
    }

    fun tryUnlock(pin: String): Boolean {
        return viewModelScope.let {
            val storedPin = "1234" // Default PIN
            if (pin == storedPin) {
                viewModelScope.launch {
                    context.kidModeDataStore.edit { it[KEY_ENABLED] = false }
                    _isKidModeActive.value = false
                    _showUnlockDialog.value = false
                }
                true
            } else {
                false
            }
        }
    }

    fun setPin(newPin: String) {
        viewModelScope.launch {
            context.kidModeDataStore.edit { it[KEY_PIN] = newPin }
        }
    }

    fun nextImage() {
        if (_currentIndex.value < _images.value.size - 1) {
            _currentIndex.value++
        }
    }

    fun previousImage() {
        if (_currentIndex.value > 0) {
            _currentIndex.value--
        }
    }

    private fun loadCompletedImages() {
        viewModelScope.launch {
            try {
                val allImages = supabaseService.fetchImages()
                _images.value = allImages.filter { it.status == ImageStatus.COMPLETED }
            } catch (_: Exception) {}
        }
    }
}
