import Foundation

enum AppConfig {
    /// Supabase project URL
    static let supabaseURL = URL(string: "https://tzigphpwhwogecpxvuop.supabase.co")!
    /// Supabase anon key that matches the web client configuration
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aWdwaHB3aHdvZ2VjcHh2dW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDkzNTAsImV4cCI6MjA2NzA4NTM1MH0.5WyUJGuo1FU0sCfLQJ-YS_B2gm3aGLVOVC1xyh86dOY"
    /// Local development server - use your computer's local IP when testing on device
    /// Use "localhost" for simulator or your Mac's IP address (e.g., "192.168.1.x") for physical device
    static let apiBaseURL = URL(string: "http://localhost:3000")!
}
