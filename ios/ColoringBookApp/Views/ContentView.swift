import SwiftUI
import Supabase

struct ContentView: View {
    @EnvironmentObject private var supabaseSession: SupabaseSession
    @EnvironmentObject private var coloringService: ColoringPageService
    @State private var email = ""
    @State private var password = ""
    @State private var isPresentingImagePicker = false
    @State private var selectedImageURL: URL?
    @Environment(\.openURL) private var openURL

    var body: some View {
        NavigationStack {
            ZStack {
                PlayfulBackground()

                Group {
                    if let user = supabaseSession.user {
                        jobsView(for: user)
                    } else {
                        authView
                    }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
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
        ScrollView {
            VStack(spacing: 32) {
                headerView(userEmail: nil)

                VStack(spacing: 24) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Turn photos into coloring adventures")
                            .font(.title2.weight(.heavy))
                            .foregroundStyle(Color.accentNavy)
                        Text("Sign in or create an account to transform your favorite memories into playful, printable art.")
                            .font(.callout)
                            .foregroundStyle(Color.accentPlum)
                    }

                    VStack(spacing: 18) {
                        styledTextField(
                            title: "Email",
                            text: $email,
                            systemImage: "envelope.fill",
                            isSecure: false
                        )

                        styledTextField(
                            title: "Password",
                            text: $password,
                            systemImage: "lock.fill",
                            isSecure: true
                        )

                        Button(action: { Task { await supabaseSession.signIn(email: email, password: password) } }) {
                            if supabaseSession.isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(
                            PlayfulButtonStyle(
                                background: .accentPink,
                                foreground: .white,
                                border: .accentCoral,
                                shadowColor: .accentCoral
                            )
                        )
                        .disabled(supabaseSession.isLoading)
                        .opacity(supabaseSession.isLoading ? 0.6 : 1)

                        Button("Create Account") {
                            Task { await supabaseSession.signUp(email: email, password: password) }
                        }
                        .buttonStyle(
                            PlayfulButtonStyle(
                                background: .white.opacity(0.92),
                                foreground: .accentPink,
                                border: .accentPink,
                                shadowColor: .accentPeach
                            )
                        )
                        .disabled(supabaseSession.isLoading)
                        .opacity(supabaseSession.isLoading ? 0.6 : 1)
                    }
                }
                .padding(28)
                .background(
                    RoundedRectangle(cornerRadius: 36, style: .continuous)
                        .fill(Color.white.opacity(0.92))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 36, style: .continuous)
                        .strokeBorder(
                            AngularGradient(
                                gradient: Gradient(colors: [.accentPink, .accentYellow, .accentTeal, .accentPink]),
                                center: .center
                            ),
                            lineWidth: 5
                        )
                )
                .shadow(color: Color.accentPeach.opacity(0.45), radius: 0, x: 10, y: 12)
                .shadow(color: Color.black.opacity(0.05), radius: 18, x: 0, y: 12)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 48)
        }
        .scrollIndicators(.hidden)
    }

    private func jobsView(for user: User) -> some View {
        ScrollView {
            VStack(spacing: 32) {
                headerView(userEmail: user.email) {
                    Button(action: signOut) {
                        Label("Sign Out", systemImage: "sparkles")
                            .font(.callout.bold())
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(
                                Capsule()
                                    .fill(Color.white.opacity(0.92))
                            )
                            .overlay(
                                Capsule()
                                    .stroke(Color.accentTeal, lineWidth: 3)
                            )
                            .shadow(color: Color.accentTeal.opacity(0.35), radius: 0, x: 6, y: 6)
                    }
                    .tint(.accentTeal)
                }

                VStack(spacing: 18) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your magical coloring pages")
                            .font(.title2.weight(.heavy))
                            .foregroundStyle(Color.accentNavy)
                        Text("Check the status of each transformation and download your printable art when it’s ready.")
                            .font(.callout)
                            .foregroundStyle(Color.accentPlum)
                    }

                    if coloringService.isLoading {
                        ProgressView("Refreshing jobs...")
                            .progressViewStyle(.circular)
                            .tint(.accentPink)
                            .padding(.vertical, 16)
                    }

                    if coloringService.jobs.isEmpty {
                        ContentUnavailableView(
                            "No coloring pages yet",
                            systemImage: "paintbrush.fill",
                            description: Text("Upload a photo to get started.")
                        )
                    } else {
                        LazyVStack(spacing: 18) {
                            ForEach(coloringService.jobs) { job in
                                jobCard(for: job)
                            }
                        }
                    }
                }
                .padding(28)
                .background(
                    RoundedRectangle(cornerRadius: 36, style: .continuous)
                        .fill(Color.white.opacity(0.94))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 36, style: .continuous)
                        .strokeBorder(Color.accentTeal, lineWidth: 4)
                )
                .shadow(color: Color.accentMint.opacity(0.5), radius: 0, x: 12, y: 12)
                .shadow(color: Color.black.opacity(0.05), radius: 20, x: 0, y: 12)

                Button(action: { isPresentingImagePicker = true }) {
                    Label("Upload photo", systemImage: "sparkles")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(
                    PlayfulButtonStyle(
                        background: .accentTeal,
                        foreground: .white,
                        border: .accentMint,
                        shadowColor: .accentTeal
                    )
                )
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 48)
        }
        .scrollIndicators(.hidden)
        .refreshable {
            await coloringService.fetchJobs(for: user.id)
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

private struct PlayfulBackground: View {
    var body: some View {
        Color.backgroundCream
            .ignoresSafeArea()
            .overlay(alignment: .topLeading) {
                Circle()
                    .fill(Color.accentCoral.opacity(0.55))
                    .frame(width: 220)
                    .offset(x: -80, y: -60)
                    .blur(radius: 8)
            }
            .overlay(alignment: .topTrailing) {
                Circle()
                    .fill(Color.accentYellow.opacity(0.55))
                    .frame(width: 260)
                    .offset(x: 70, y: -40)
                    .blur(radius: 12)
            }
            .overlay(alignment: .bottomLeading) {
                Circle()
                    .fill(Color.accentMint.opacity(0.6))
                    .frame(width: 280)
                    .offset(x: -60, y: 140)
                    .blur(radius: 12)
            }
            .overlay(alignment: .bottomTrailing) {
                Circle()
                    .fill(Color.accentTeal.opacity(0.5))
                    .frame(width: 230)
                    .offset(x: 40, y: 180)
                    .blur(radius: 10)
            }
            .overlay {
                GeometryReader { proxy in
                    let size = proxy.size
                    Canvas { context, _ in
                        let spacing: CGFloat = 100
                        for x in stride(from: 0, to: size.width + spacing, by: spacing) {
                            for y in stride(from: 0, to: size.height + spacing, by: spacing) {
                                var symbol = context.resolveSymbol(id: 0)!
                                symbol.position = CGPoint(x: x, y: y)
                                context.draw(symbol)
                            }
                        }
                    } symbols: {
                        Circle()
                            .fill(Color.white.opacity(0.25))
                            .frame(width: 12)
                            .tag(0)
                    }
                }
                .allowsHitTesting(false)
                .opacity(0.5)
            }
    }
}

private struct PlayfulButtonStyle: ButtonStyle {
    var background: Color
    var foreground: Color
    var border: Color
    var shadowColor: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .fontWeight(.semibold)
            .padding(.horizontal, 24)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(background.opacity(configuration.isPressed ? 0.92 : 1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(border, lineWidth: 4)
            )
            .foregroundStyle(foreground)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .shadow(color: shadowColor.opacity(configuration.isPressed ? 0.2 : 0.45), radius: 0, x: 10, y: 12)
            .shadow(color: Color.black.opacity(0.08), radius: 18, x: 0, y: 10)
    }
}

private extension ContentView {
    @ViewBuilder
    func headerView<Content: View>(userEmail: String?, @ViewBuilder trailingAction: () -> Content = { EmptyView() }) -> some View {
        VStack(spacing: 20) {
            HStack(alignment: .center, spacing: 18) {
                ZStack {
                    Circle()
                        .fill(Color.accentPink)
                        .frame(width: 70, height: 70)
                        .shadow(color: Color.accentCoral.opacity(0.45), radius: 0, x: 8, y: 10)
                    Image(systemName: "paintpalette.fill")
                        .font(.system(size: 28, weight: .black))
                        .foregroundStyle(Color.white)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Coloring fun")
                        .textCase(.uppercase)
                        .font(.caption.weight(.bold))
                        .kerning(2)
                        .foregroundStyle(Color.accentPink)
                    Text("ColoringBook.AI")
                        .font(.title.bold())
                        .foregroundStyle(Color.accentNavy)
                    if let userEmail {
                        Text(userEmail)
                            .font(.footnote.weight(.semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(
                                Capsule()
                                    .fill(Color.accentYellow.opacity(0.35))
                            )
                            .overlay(
                                Capsule()
                                    .stroke(Color.accentYellow, lineWidth: 2)
                            )
                    }
                }

                Spacer()

                trailingAction()
            }
        }
    }

    @ViewBuilder
    func styledTextField(title: String, text: Binding<String>, systemImage: String, isSecure: Bool) -> some View {
        let label = Label(title, systemImage: systemImage)
            .labelStyle(.titleAndIcon)
            .font(.callout.weight(.semibold))
            .foregroundStyle(Color.accentNavy)

        VStack(alignment: .leading, spacing: 8) {
            label

            Group {
                if isSecure {
                    SecureField(title, text: text)
                        .textContentType(.password)
                } else {
                    TextField(title, text: text)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.white.opacity(0.95))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(Color.accentYellow, lineWidth: 3)
            )
            .shadow(color: Color.accentYellow.opacity(0.45), radius: 0, x: 6, y: 8)
        }
    }

    @ViewBuilder
    func jobCard(for job: ImageJob) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(job.name)
                .font(.headline.weight(.heavy))
                .foregroundStyle(Color.accentNavy)

            statusBadge(for: job)

            if let coloringURL = job.coloringPageURL, job.isCompleted {
                Button {
                    openURL(coloringURL)
                } label: {
                    Label("Open coloring page", systemImage: "arrow.down.doc")
                        .font(.subheadline.bold())
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(
                    PlayfulButtonStyle(
                        background: .white,
                        foreground: .accentTeal,
                        border: .accentTeal,
                        shadowColor: .accentMint
                    )
                )
            }

            if let error = job.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Color.red)
            }

            Text("Updated \(job.updatedAt, style: .relative)")
                .font(.footnote.weight(.medium))
                .foregroundStyle(Color.accentPlum)
        }
        .padding(22)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(Color.white.opacity(0.92))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .strokeBorder(Color.accentPink.opacity(0.6), lineWidth: 3)
        )
        .shadow(color: Color.accentPeach.opacity(0.45), radius: 0, x: 8, y: 10)
    }

    @ViewBuilder
    func statusBadge(for job: ImageJob) -> some View {
        let (text, color, icon, textColor): (String, Color, String, Color)

        switch job.status {
        case .completed:
            text = "Ready to color"
            color = .accentMint
            icon = "checkmark.seal.fill"
            textColor = .accentNavy
        case .processing, .uploading:
            text = "Working magic"
            color = .accentYellow
            icon = "hourglass"
            textColor = .accentNavy
        case .error:
            text = "Needs attention"
            color = .red
            icon = "exclamationmark.triangle.fill"
            textColor = .white
        }

        Label(text, systemImage: icon)
            .font(.caption.bold())
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(job.status == .error ? color.opacity(0.85) : color.opacity(0.28))
            )
            .overlay(
                Capsule()
                    .stroke(color, lineWidth: 2)
            )
            .foregroundStyle(textColor)
    }
}

private extension Color {
    static let backgroundCream = Color(red: 1.0, green: 0.96, blue: 0.84)
    static let accentPink = Color(red: 1.0, green: 0.44, blue: 0.57)
    static let accentCoral = Color(red: 1.0, green: 0.54, blue: 0.5)
    static let accentPeach = Color(red: 1.0, green: 0.63, blue: 0.55)
    static let accentYellow = Color(red: 1.0, green: 0.82, blue: 0.4)
    static let accentMint = Color(red: 0.71, green: 0.94, blue: 0.8)
    static let accentTeal = Color(red: 0.33, green: 0.78, blue: 0.75)
    static let accentNavy = Color(red: 0.23, green: 0.18, blue: 0.22)
    static let accentPlum = Color(red: 0.35, green: 0.25, blue: 0.27)
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
