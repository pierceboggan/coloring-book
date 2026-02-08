//
//  WebAPIService.swift
//  ColoringBook
//
//  Service for calling the shared Next.js API endpoints.
//

import Foundation

class WebAPIService {
    static let shared = WebAPIService()

    private let session: URLSession
    private let baseURL: URL

    private init(session: URLSession = .shared) {
        self.session = session

        let configuredBaseURL = ProcessInfo.processInfo.environment["WEB_API_BASE_URL"]
            ?? Bundle.main.object(forInfoDictionaryKey: "WEB_API_BASE_URL") as? String
            ?? "https://coloringbook.ai"

        let trimmed = configuredBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalized = trimmed.hasSuffix("/") ? String(trimmed.dropLast()) : trimmed

        self.baseURL = URL(string: normalized) ?? URL(string: "https://coloringbook.ai")!
    }

    func generateColoringPage(
        imageId: String,
        imageUrl: String,
        accessToken: String,
        age: Int? = nil,
        provider: String? = nil
    ) async throws -> String {
        let requestURL = baseURL.appendingPathComponent("api/generate-coloring-page")

        let payload = GenerateColoringPageRequest(
            imageId: imageId,
            imageUrl: imageUrl,
            age: age,
            provider: provider
        )

        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.timeoutInterval = 180
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw WebAPIServiceError.invalidResponse
        }

        let decoded = try JSONDecoder().decode(GenerateColoringPageResponse.self, from: data)

        guard (200...299).contains(httpResponse.statusCode) else {
            throw WebAPIServiceError.serverError(
                decoded.error ?? "Server returned status code \(httpResponse.statusCode)"
            )
        }

        if decoded.success == false {
            throw WebAPIServiceError.serverError(decoded.error ?? "Coloring page generation failed")
        }

        guard let coloringPageUrl = decoded.coloringPageUrl, !coloringPageUrl.isEmpty else {
            throw WebAPIServiceError.missingColoringPageURL
        }

        return coloringPageUrl
    }
}

private struct GenerateColoringPageRequest: Encodable {
    let imageId: String
    let imageUrl: String
    let age: Int?
    let provider: String?
}

private struct GenerateColoringPageResponse: Decodable {
    let success: Bool?
    let coloringPageUrl: String?
    let error: String?

    enum CodingKeys: String, CodingKey {
        case success
        case coloringPageUrl
        case error
    }
}

enum WebAPIServiceError: LocalizedError {
    case invalidResponse
    case serverError(String)
    case missingColoringPageURL

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from web API"
        case .serverError(let message):
            return message
        case .missingColoringPageURL:
            return "Coloring page URL was missing from the API response"
        }
    }
}
