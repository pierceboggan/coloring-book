import Foundation
import Combine
import Supabase

@MainActor
final class SupabaseSession: ObservableObject {
    @Published private(set) var user: User?
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private var authStateTask: Task<Void, Never>?
    private let client: SupabaseClient

    init(client: SupabaseClient = SupabaseClient(supabaseURL: AppConfig.supabaseURL, supabaseKey: AppConfig.supabaseAnonKey)) {
        self.client = client
        observeAuthChanges()
    }

    deinit {
        authStateTask?.cancel()
    }

    func signIn(email: String, password: String) async {
        await performAuthAction {
            try await client.auth.signIn(email: email, password: password)
        }
    }

    func signUp(email: String, password: String) async {
        await performAuthAction {
            try await client.auth.signUp(email: email, password: password)
        }
    }

    func signOut() async {
        do {
            try await client.auth.signOut()
            user = nil
        } catch {
            errorMessage = "Failed to sign out: \(error.localizedDescription)"
        }
    }

    private func performAuthAction(_ action: @escaping () async throws -> Void) async {
        isLoading = true
        errorMessage = nil

        do {
            try await action()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func observeAuthChanges() {
        authStateTask = Task {
            for await state in client.auth.authStateChanges {
                switch state.event {
                case .initialSession, .signedIn:
                    user = state.session?.user
                case .signedOut:
                    user = nil
                default:
                    break
                }
            }
        }
    }
}
