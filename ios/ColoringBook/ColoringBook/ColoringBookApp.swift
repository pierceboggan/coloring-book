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

    init() {
        // Initialize Sentry for error tracking and monitoring
        SentryService.shared.configure()
    }

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
    @Published var isAuthResolved = false

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

    private var authObserverTasks: [Task<Void, Never>] = []

    init(enableServiceObservers: Bool = true, enableNetworkMonitoring: Bool = true) {
        if applyUITestLaunchOverrides() {
            if enableNetworkMonitoring {
                setupNetworkMonitoring()
            }
            return
        }

        if enableServiceObservers {
            syncAuthSnapshot()
            observeAuthChanges()
        }

        if enableNetworkMonitoring {
            setupNetworkMonitoring()
        }
    }

    deinit {
        authObserverTasks.forEach { $0.cancel() }
    }

    private func syncAuthSnapshot() {
        isAuthenticated = SupabaseService.shared.isAuthenticated
        currentUser = SupabaseService.shared.currentUser
        isAuthResolved = SupabaseService.shared.isInitialSessionResolved
    }

    private func observeAuthChanges() {
        authObserverTasks.append(Task { [weak self] in
            for await authenticated in SupabaseService.shared.$isAuthenticated.values {
                self?.isAuthenticated = authenticated
            }
        })

        authObserverTasks.append(Task { [weak self] in
            for await user in SupabaseService.shared.$currentUser.values {
                self?.currentUser = user
            }
        })

        authObserverTasks.append(Task { [weak self] in
            for await resolved in SupabaseService.shared.$isInitialSessionResolved.values {
                self?.isAuthResolved = resolved
            }
        })
    }

    private func setupNetworkMonitoring() {
        Task {
            for await isConnected in NetworkMonitor.shared.$isConnected.values {
                self.isOffline = !isConnected
            }
        }
    }

    private func applyUITestLaunchOverrides() -> Bool {
        let args = ProcessInfo.processInfo.arguments

        if args.contains("--uitest-auth-loading") {
            isAuthResolved = false
            isAuthenticated = false
            return true
        }

        if args.contains("--uitest-authenticated") {
            isAuthResolved = true
            isAuthenticated = true
            return true
        }

        if args.contains("--uitest-unauthenticated") {
            isAuthResolved = true
            isAuthenticated = false
            return true
        }

        return false
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
