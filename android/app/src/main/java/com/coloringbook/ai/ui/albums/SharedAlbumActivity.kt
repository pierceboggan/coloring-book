package com.coloringbook.ai.ui.albums

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.coloringbook.ai.ui.theme.ColoringBookTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SharedAlbumActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val shareCode = intent?.data?.lastPathSegment ?: ""

        setContent {
            ColoringBookTheme {
                // TODO: Shared album view for deep link
            }
        }
    }
}
