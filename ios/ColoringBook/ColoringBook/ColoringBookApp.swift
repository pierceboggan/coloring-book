//
//  ColoringBookApp.swift
//  ColoringBook
//
//  AI-powered coloring book app for iOS
//

import SwiftUI
import Supabase

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
    @Published var currentUser: Supabase.User?
    @Published var isKidModeActive = false
    @Published var isOffline = false

    private static let parentCodeKey = "kidmode_parent_code"
    private static let defaultParentCode = "1234"

    /// The current parent code, stored in UserDefaults
    var parentCode: String {
        get {
            UserDefaults.standard.string(forKey: Self.parentCodeKey) ?? Self.defaultParentCode
        }
        set {
            UserDefaults.standard.set(newValue, forKey: Self.parentCodeKey)
        }
    }

    init() {
        checkAuthStatus()
        setupNetworkMonitoring()
    }

    private func checkAuthStatus() {
        // Check if user is already authenticated with Supabase
        isAuthenticated = SupabaseService.shared.isAuthenticated
    }

    private func setupNetworkMonitoring() {
        // Monitor network status
        Task {
            for await isConnected in NetworkMonitor.shared.$isConnected.values {
                self.isOffline = !isConnected
            }
        }
    }

    func enableKidMode() {
        isKidModeActive = true
    }

    func disableKidMode(withCode code: String) -> Bool {
        if code == parentCode {
            isKidModeActive = false
            return true
        }
        return false
    }
}
