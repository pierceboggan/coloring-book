import Foundation

enum AppConfig {
    /// Update with the Supabase project URL, e.g. https://xyzcompany.supabase.co
    static let supabaseURL = URL(string: "https://YOUR_PROJECT.supabase.co")!
    /// Supabase anon key that matches the web client configuration
    static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"
    /// Base URL for the deployed Next.js backend that exposes the mobile API routes
    static let apiBaseURL = URL(string: "https://your-web-app.vercel.app")!
}
