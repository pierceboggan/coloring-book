//
//  ContentView.swift
//  ColoringBook
//
//  Main content view that routes between different app states
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            if !appState.isAuthResolved {
                AppLaunchLoadingView()
            } else if appState.isKidModeActive {
                KidModeView()
            } else if appState.isAuthenticated {
                MainTabView()
            } else {
                WelcomeView()
            }
        }
        .animation(.easeInOut, value: appState.isAuthResolved)
        .animation(.easeInOut, value: appState.isKidModeActive)
        .animation(.easeInOut, value: appState.isAuthenticated)
    }
}

private struct AppLaunchLoadingView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "FFF5D6"), Color(hex: "FFE6EB")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .tint(Color(hex: "FF6F91"))
                    .scaleEffect(1.2)

                Text("Loading your coloring studio...")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(Color(hex: "594144"))
            }
            .padding(24)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
