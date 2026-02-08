//
//  SentryService.swift
//  ColoringBook
//
//  Centralized Sentry error tracking and monitoring service
//

import Foundation
import Sentry

/// Service for managing Sentry error tracking and performance monitoring
class SentryService {
    static let shared = SentryService()
    
    private init() {}
    
    /// Initialize Sentry with configuration from Info.plist
    func configure() {
        // Get DSN from Info.plist (can be overridden by environment variable)
        guard let dsn = getSentryDSN() else {
            print("⚠️ Sentry DSN not configured - error tracking disabled")
            return
        }
        
        SentrySDK.start { options in
            options.dsn = dsn
            options.debug = false // Set to true for development debugging
            
            // Performance monitoring
            options.tracesSampleRate = 1.0 // Capture 100% of transactions for performance monitoring
            
            // Enable automatic breadcrumbs for better error context
            options.enableAutoSessionTracking = true
            options.enableAutoBreadcrumbTracking = true
            options.enableAutoPerformanceTracing = true
            
            // Attach screenshots to errors
            options.attachScreenshot = true
            
            // Filter out sensitive data
            options.beforeSend = { event in
                // Remove sensitive data from events before sending
                // For example, you might want to filter out user emails or tokens
                return event
            }
            
            // Set release version and build number
            if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
               let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String {
                options.releaseName = "\(version) (\(build))"
            }
            
            // Set environment (development, staging, production)
            #if DEBUG
            options.environment = "development"
            #else
            options.environment = "production"
            #endif
        }
        
        print("✅ Sentry initialized successfully")
    }
    
    /// Get Sentry DSN from environment or Info.plist
    private func getSentryDSN() -> String? {
        // First try environment variable (for CI/CD and local development)
        if let envDSN = ProcessInfo.processInfo.environment["SENTRY_DSN"], !envDSN.isEmpty {
            return envDSN
        }
        
        // Fall back to Info.plist
        if let infoDSN = Bundle.main.infoDictionary?["SENTRY_DSN"] as? String, !infoDSN.isEmpty {
            return infoDSN
        }
        
        return nil
    }
    
    /// Capture a message for tracking
    func captureMessage(_ message: String, level: SentryLevel = .info) {
        SentrySDK.capture(message: message) { scope in
            scope.setLevel(level)
        }
    }
    
    /// Capture an error with additional context
    func captureError(_ error: Error, context: [String: Any]? = nil) {
        SentrySDK.capture(error: error) { scope in
            if let context = context {
                for (key, value) in context {
                    scope.setExtra(value: value, key: key)
                }
            }
        }
        print("❌ Error captured by Sentry: \(error.localizedDescription)")
    }
    
    /// Set user information for error tracking
    func setUser(id: String, email: String? = nil) {
        let user = Sentry.User(userId: id)
        user.email = email
        SentrySDK.setUser(user)
    }
    
    /// Clear user information (e.g., on logout)
    func clearUser() {
        SentrySDK.setUser(nil)
    }
    
    /// Add breadcrumb for debugging context
    func addBreadcrumb(message: String, category: String, level: SentryLevel = .info) {
        let crumb = Breadcrumb(level: level, category: category)
        crumb.message = message
        SentrySDK.addBreadcrumb(crumb)
    }
    
    /// Start a performance transaction
    @discardableResult
    func startTransaction(name: String, operation: String) -> Span? {
        let transaction = SentrySDK.startTransaction(name: name, operation: operation)
        return transaction
    }
}
