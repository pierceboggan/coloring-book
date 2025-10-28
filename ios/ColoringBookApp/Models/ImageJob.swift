import Foundation

struct ImageJob: Identifiable, Hashable, Decodable {
    enum Status: String, Codable, Hashable {
        case uploading
        case processing
        case completed
        case error
    }

    let id: UUID
    let userId: UUID
    let name: String
    let originalURL: URL
    let coloringPageURL: URL?
    let status: Status
    let createdAt: Date
    let updatedAt: Date
    let errorMessage: String?
}

extension ImageJob {
    var isProcessing: Bool { status == .uploading || status == .processing }
    var isCompleted: Bool { status == .completed }
}

extension ImageJob {
    private enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case originalURL = "original_url"
        case coloringPageURL = "coloring_page_url"
        case status
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case errorMessage = "error_message"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        let idString = try container.decode(String.self, forKey: .id)
        let userIdString = try container.decode(String.self, forKey: .userId)
        guard let id = UUID(uuidString: idString), let userId = UUID(uuidString: userIdString) else {
            throw DecodingError.dataCorrupted(.init(codingPath: [CodingKeys.id], debugDescription: "Invalid UUID values"))
        }

        let originalURLString = try container.decode(String.self, forKey: .originalURL)
        guard let originalURL = URL(string: originalURLString) else {
            throw DecodingError.dataCorrupted(.init(codingPath: [CodingKeys.originalURL], debugDescription: "Invalid URL string"))
        }

        let coloringURLString = try container.decodeIfPresent(String.self, forKey: .coloringPageURL)
        let coloringURL = coloringURLString.flatMap(URL.init(string:))

        let status = try container.decode(Status.self, forKey: .status)

        let createdAtString = try container.decode(String.self, forKey: .createdAt)
        let updatedAtString = try container.decode(String.self, forKey: .updatedAt)
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let createdAt = formatter.date(from: createdAtString) ?? Date()
        let updatedAt = formatter.date(from: updatedAtString) ?? createdAt

        self.init(
            id: id,
            userId: userId,
            name: try container.decode(String.self, forKey: .name),
            originalURL: originalURL,
            coloringPageURL: coloringURL,
            status: status,
            createdAt: createdAt,
            updatedAt: updatedAt,
            errorMessage: try container.decodeIfPresent(String.self, forKey: .errorMessage)
        )
    }
}
