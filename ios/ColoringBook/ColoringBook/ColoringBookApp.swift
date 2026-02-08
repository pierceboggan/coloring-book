//
//  ColoringBookApp.swift
//  ColoringBook
//
//  AI-powered coloring book app for iOS
//

import SwiftUI

@main
struct ColoringBookApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

/// Global app state manager
@MainActor
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isKidModeActive = false
    @Published var isOffline = false

    init() {
        checkAuthStatus()
        setupNetworkMonitoring()
    }

    private func checkAuthStatus() {
        // Check if user is already authenticated
        // This will be implemented with Firebase Auth
    }

    private func setupNetworkMonitoring() {
        // Setup network reachability monitoring
    }

    func enableKidMode() {
        isKidModeActive = true
    }

    func disableKidMode(withCode code: String) -> Bool {
        // Verify parent code
        // For now, use a simple check
        if code == "1234" {
            isKidModeActive = false
            return true
        }
        return false
    }
}
