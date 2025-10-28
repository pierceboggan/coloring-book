import SwiftUI
import Supabase

struct ContentView: View {
    @EnvironmentObject private var supabaseSession: SupabaseSession
    @EnvironmentObject private var coloringService: ColoringPageService
    @State private var email = ""
    @State private var password = ""
    @State private var isPresentingImagePicker = false
    @State private var selectedImageURL: URL?

    var body: some View {
        NavigationStack {
            Group {
                if let user = supabaseSession.user {
                    jobsView(for: user)
                } else {
                    authView
                }
            }
            .navigationTitle("Coloring Book")
            .toolbar {
                if supabaseSession.user != nil {
                    Button("Sign Out", action: signOut)
                }
            }
        }
        .sheet(isPresented: $isPresentingImagePicker) {
            PhotoPickerView(imageURL: $selectedImageURL, onComplete: handleImageSelection)
        }
        .task(id: supabaseSession.user?.id) {
            guard let userId = supabaseSession.user?.id else { return }
            await coloringService.fetchJobs(for: userId)
        }
        .alert("Error", isPresented: .constant(supabaseSession.errorMessage != nil || coloringService.errorMessage != nil)) {
            Button("OK", role: .cancel) {
                supabaseSession.errorMessage = nil
                coloringService.errorMessage = nil
            }
        } message: {
            Text(supabaseSession.errorMessage ?? coloringService.errorMessage ?? "Unknown error")
        }
    }

    private var authView: some View {
        VStack(spacing: 16) {
            Text("Sign in to access your coloring pages")
                .font(.headline)

            TextField("Email", text: $email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .textInputAutocapitalization(.never)

            SecureField("Password", text: $password)

            Button(action: { Task { await supabaseSession.signIn(email: email, password: password) } }) {
                if supabaseSession.isLoading {
                    ProgressView()
                } else {
                    Text("Sign In")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)

            Button("Create Account") {
                Task { await supabaseSession.signUp(email: email, password: password) }
            }
            .disabled(supabaseSession.isLoading)
        }
        .padding()
    }

    private func jobsView(for user: User) -> some View {
        VStack(spacing: 16) {
            if coloringService.isLoading {
                ProgressView("Refreshing jobs...")
            }

            if coloringService.jobs.isEmpty {
                ContentUnavailableView("No coloring pages yet", systemImage: "photo.on.rectangle", description: Text("Upload a photo to get started."))
            } else {
                List(coloringService.jobs) { job in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(job.name)
                            .font(.headline)
                        Text(job.status.rawValue.capitalized)
                            .font(.subheadline)
                            .foregroundStyle(job.isCompleted ? .green : .secondary)
                        if let coloringURL = job.coloringPageURL, job.isCompleted {
                            Link("Open coloring page", destination: coloringURL)
                        }
                        if let error = job.errorMessage {
                            Text(error)
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }
                    }
                }
                .refreshable {
                    await coloringService.fetchJobs(for: user.id)
                }
            }

            Button(action: { isPresentingImagePicker = true }) {
                Label("Upload photo", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .padding(.horizontal)
        }
    }

    private func signOut() {
        Task { await supabaseSession.signOut() }
    }

    private func handleImageSelection(_ result: Result<URL, Error>) {
        isPresentingImagePicker = false

        guard case .success(let url) = result else {
            if case .failure(let error) = result { coloringService.errorMessage = error.localizedDescription }
            return
        }

        Task {
            do {
                let job = try await uploadImage(url)
                try Task.checkCancellation()
                coloringService.insert(job: job)
                await coloringService.requestGeneration(for: job)
                guard let userId = supabaseSession.user?.id else { return }
                await coloringService.fetchJobs(for: userId)
            } catch {
                coloringService.errorMessage = error.localizedDescription
            }
        }
    }

    private func uploadImage(_ url: URL) async throws -> ImageJob {
        guard let userId = supabaseSession.user?.id else { throw UploadError.missingSession }

        let uploadURL = AppConfig.apiBaseURL.appendingPathComponent("/api/mobile/upload")
        var request = URLRequest(url: uploadURL)
        request.httpMethod = "POST"

        let boundary = UUID().uuidString
        request.addValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        let formData = try MultipartFormData(boundary: boundary)
            .appendingField(name: "userId", value: userId.uuidString)
            .appendingFile(url: url, name: "file", fileName: url.lastPathComponent, mimeType: "image/jpeg")
            .build()

        request.httpBody = formData.body
        request.addValue("\(formData.contentLength)", forHTTPHeaderField: "Content-Length")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200..<300).contains(httpResponse.statusCode) else {
            throw UploadError.failed
        }

        let payload = try JSONDecoder().decode(ImageJobUploadResponse.self, from: data)
        guard let job = payload.data else {
            throw UploadError.failed
        }

        return job
    }
}

private enum UploadError: LocalizedError {
    case missingSession
    case failed

    var errorDescription: String? {
        switch self {
        case .missingSession:
            return "You must sign in before uploading."
        case .failed:
            return "Upload failed. Please try again."
        }
    }
}

private struct ImageJobUploadResponse: Decodable {
    let data: ImageJob?
}
