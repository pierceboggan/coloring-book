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
            if appState.isKidModeActive {
                KidModeView()
            } else if appState.isAuthenticated {
                MainTabView()
            } else {
                WelcomeView()
            }
        }
        .animation(.easeInOut, value: appState.isKidModeActive)
        .animation(.easeInOut, value: appState.isAuthenticated)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
