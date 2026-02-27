package com.coloringbook.ai.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.PhotoAlbum
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material.icons.outlined.PhotoAlbum
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String) {
    data object Welcome : Screen("welcome")
    data object Auth : Screen("auth")
    data object Main : Screen("main")
    data object Dashboard : Screen("dashboard")
    data object Upload : Screen("upload")
    data object Albums : Screen("albums")
    data object Settings : Screen("settings")
    data object Canvas : Screen("canvas/{imageId}") {
        fun createRoute(imageId: String) = "canvas/$imageId"
    }
    data object ImageDetail : Screen("image/{imageId}") {
        fun createRoute(imageId: String) = "image/$imageId"
    }
    data object KidMode : Screen("kid_mode")
    data object SharedAlbum : Screen("shared_album/{shareCode}") {
        fun createRoute(shareCode: String) = "shared_album/$shareCode"
    }
}

data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
)

val bottomNavItems = listOf(
    BottomNavItem(Screen.Dashboard, "Gallery", Icons.Filled.PhotoLibrary, Icons.Outlined.PhotoLibrary),
    BottomNavItem(Screen.Upload, "Create", Icons.Filled.Add, Icons.Outlined.Add),
    BottomNavItem(Screen.Albums, "Albums", Icons.Filled.PhotoAlbum, Icons.Outlined.PhotoAlbum),
    BottomNavItem(Screen.Settings, "Settings", Icons.Filled.Settings, Icons.Outlined.Settings),
)
