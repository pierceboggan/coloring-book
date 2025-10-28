import SwiftUI

@main
struct ColoringBookApp: App {
    @StateObject private var supabaseSession = SupabaseSession()
    @StateObject private var coloringPageService = ColoringPageService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(supabaseSession)
                .environmentObject(coloringPageService)
        }
    }
}
