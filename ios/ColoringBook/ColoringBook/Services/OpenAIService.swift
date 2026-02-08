//
//  OpenAIService.swift
//  ColoringBook
//
//  Service for AI image-to-coloring-page conversion
//

import Foundation
import UIKit

class OpenAIService {
    static let shared = OpenAIService()

    private let apiKey: String
    private let apiURL = "https://api.openai.com/v1/images/generations"

    private init() {
        // In production, this should come from a secure configuration
        self.apiKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? ""
    }

    /// Generate a coloring page from an image
    func generateColoringPage(
        from imageData: Data,
        customPrompt: String? = nil,
        targetAge: Int = 6,
        detailLevel: String = "moderate"
    ) async throws -> Data {
        // Convert image to base64
        let base64Image = imageData.base64EncodedString()

        // Build the prompt
        let prompt = customPrompt ?? buildDefaultPrompt(targetAge: targetAge, detailLevel: detailLevel)

        let requestBody: [String: Any] = [
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024",
            "response_format": "b64_json"
        ]

        var request = URLRequest(url: URL(string: apiURL)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw OpenAIError.invalidResponse
        }

        // Parse response
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let dataArray = json["data"] as? [[String: Any]],
              let firstResult = dataArray.first,
              let b64Json = firstResult["b64_json"] as? String,
              let imageData = Data(base64Encoded: b64Json) else {
            throw OpenAIError.invalidData
        }

        // Add watermark
        return try await addWatermark(to: imageData)
    }

    private func buildDefaultPrompt(targetAge: Int, detailLevel: String) -> String {
        return """
        Create a black and white coloring book page suitable for a \(targetAge)-year-old child.
        The image should have:
        - Clear, bold outlines
        - \(detailLevel) level of detail
        - No shading or gradients
        - Large areas for coloring
        - Simple, recognizable shapes
        - A fun and engaging composition
        Make it suitable for printing and coloring with crayons or markers.
        """
    }

    private func addWatermark(to imageData: Data) async throws -> Data {
        guard let image = UIImage(data: imageData) else {
            throw OpenAIError.invalidData
        }

        let renderer = UIGraphicsImageRenderer(size: image.size)
        let watermarkedImage = renderer.image { context in
            // Draw original image
            image.draw(at: .zero)

            // Add watermark text
            let watermarkText = "ColoringBook.AI"
            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 24, weight: .semibold),
                .foregroundColor: UIColor.gray.withAlphaComponent(0.3)
            ]

            let textSize = watermarkText.size(withAttributes: attributes)
            let textRect = CGRect(
                x: image.size.width - textSize.width - 20,
                y: image.size.height - textSize.height - 20,
                width: textSize.width,
                height: textSize.height
            )

            watermarkText.draw(in: textRect, withAttributes: attributes)
        }

        guard let pngData = watermarkedImage.pngData() else {
            throw OpenAIError.invalidData
        }

        return pngData
    }
}

enum OpenAIError: LocalizedError {
    case invalidResponse
    case invalidData
    case apiKeyMissing

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from OpenAI API"
        case .invalidData:
            return "Invalid image data received"
        case .apiKeyMissing:
            return "OpenAI API key is missing"
        }
    }
}
