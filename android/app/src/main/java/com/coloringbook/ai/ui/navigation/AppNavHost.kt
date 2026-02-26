package com.coloringbook.ai.ui.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.coloringbook.ai.ui.albums.AlbumsScreen
import com.coloringbook.ai.ui.auth.AuthScreen
import com.coloringbook.ai.ui.auth.AuthState
import com.coloringbook.ai.ui.auth.AuthViewModel
import com.coloringbook.ai.ui.auth.WelcomeScreen
import com.coloringbook.ai.ui.canvas.ColoringCanvasScreen
import com.coloringbook.ai.ui.dashboard.DashboardScreen
import com.coloringbook.ai.ui.kidmode.KidModeScreen
import com.coloringbook.ai.ui.kidmode.KidModeViewModel
import com.coloringbook.ai.ui.settings.SettingsScreen
import com.coloringbook.ai.ui.upload.ImageUploadScreen

@Composable
fun AppNavHost(
    authState: AuthState,
    authViewModel: AuthViewModel,
) {
    val navController = rememberNavController()

    val startDestination = when (authState) {
        is AuthState.Loading -> Screen.Welcome.route
        is AuthState.Unauthenticated -> Screen.Welcome.route
        is AuthState.Authenticated -> Screen.Main.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onNavigateToAuth = {
                    navController.navigate(Screen.Auth.route)
                },
            )
        }

        composable(Screen.Auth.route) {
            AuthScreen(
                authViewModel = authViewModel,
                onAuthSuccess = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        composable(Screen.Main.route) {
            MainScreen(
                authViewModel = authViewModel,
                navController = navController,
            )
        }

        composable(
            route = Screen.Canvas.route,
            arguments = listOf(navArgument("imageId") { type = NavType.StringType }),
        ) {
            ColoringCanvasScreen(
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.KidMode.route) {
            val kidModeViewModel: KidModeViewModel = hiltViewModel()
            KidModeScreen(
                viewModel = kidModeViewModel,
                onColorPage = { imageId ->
                    navController.navigate(Screen.Canvas.createRoute(imageId))
                },
            )
        }
    }
}

@Composable
private fun MainScreen(
    authViewModel: AuthViewModel,
    navController: androidx.navigation.NavHostController,
) {
    val innerNavController = rememberNavController()
    val navBackStackEntry by innerNavController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    Scaffold(
        bottomBar = {
            NavigationBar {
                bottomNavItems.forEach { item ->
                    val selected = currentDestination?.hierarchy?.any {
                        it.route == item.screen.route
                    } == true

                    NavigationBarItem(
                        icon = {
                            Icon(
                                imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                                contentDescription = item.label,
                            )
                        },
                        label = { Text(item.label) },
                        selected = selected,
                        onClick = {
                            innerNavController.navigate(item.screen.route) {
                                popUpTo(innerNavController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = innerNavController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onImageClick = { imageId ->
                        navController.navigate(Screen.Canvas.createRoute(imageId))
                    },
                    onColorClick = { imageId ->
                        navController.navigate(Screen.Canvas.createRoute(imageId))
                    },
                )
            }

            composable(Screen.Upload.route) {
                ImageUploadScreen()
            }

            composable(Screen.Albums.route) {
                AlbumsScreen()
            }

            composable(Screen.Settings.route) {
                val kidModeViewModel: KidModeViewModel = hiltViewModel()
                SettingsScreen(
                    authViewModel = authViewModel,
                    kidModeViewModel = kidModeViewModel,
                    onNavigateToKidMode = {
                        navController.navigate(Screen.KidMode.route)
                    },
                )
            }
        }
    }
}
