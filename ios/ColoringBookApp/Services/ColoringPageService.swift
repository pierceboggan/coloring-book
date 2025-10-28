import Foundation

@MainActor
final class ColoringPageService: ObservableObject {
    @Published private(set) var jobs: [ImageJob] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let session: URLSession
    private let decoder: JSONDecoder

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
    }

    func fetchJobs(for userId: UUID) async {
        await performRequest {
            let url = AppConfig.apiBaseURL.appendingPathComponent("/api/mobile/images")
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.queryItems = [URLQueryItem(name: "userId", value: userId.uuidString)]

            guard let requestURL = components?.url else { throw APIError.invalidURL }

            var request = URLRequest(url: requestURL)
            request.httpMethod = "GET"

            let (data, response) = try await session.data(for: request)
            try Self.validate(response: response)

            let payload = try decoder.decode(ImageJobListResponse.self, from: data)
            let jobs = payload.data
            self.jobs = jobs.sorted(by: { $0.updatedAt > $1.updatedAt })
        }
    }

    func requestGeneration(for job: ImageJob) async {
        await performRequest(trackLoading: false) {
            let url = AppConfig.apiBaseURL.appendingPathComponent("/api/generate-coloring-page")
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.addValue("application/json", forHTTPHeaderField: "Content-Type")

            let body: [String: String] = [
                "imageId": job.id.uuidString,
                "imageUrl": job.originalURL.absoluteString
            ]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)

            let (_, response) = try await session.data(for: request)
            try Self.validate(response: response)
        }
    }

    func insert(job: ImageJob) {
        jobs.removeAll { $0.id == job.id }
        jobs.insert(job, at: 0)
    }

    private func performRequest(trackLoading: Bool = true, _ action: @escaping () async throws -> Void) async {
        if trackLoading {
            isLoading = true
        }
        errorMessage = nil

        do {
            try await action()
        } catch {
            errorMessage = error.localizedDescription
        }

        if trackLoading {
            isLoading = false
        }
    }

    private static func validate(response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.serverError(statusCode: httpResponse.statusCode)
        }
    }

}

private struct ImageJobListResponse: Decodable {
    let data: [ImageJob]
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid request URL"
        case .invalidResponse:
            return "Received an unexpected response from the server"
        case .serverError(let statusCode):
            return "Server responded with status code \(statusCode)"
        }
    }
}
