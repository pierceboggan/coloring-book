//
//  Models.swift
//  ColoringBook
//
//  Core data models matching the web app schema
//

import Foundation
import FirebaseFirestore

// MARK: - Image Status
enum ImageStatus: String, Codable {
    case uploading
    case processing
    case completed
    case error
}

// MARK: - ColoringImage
struct ColoringImage: Identifiable, Codable, Equatable {
    @DocumentID var id: String?
    var userId: String
    var originalUrl: String
    var coloringPageUrl: String?
    var name: String
    var status: ImageStatus
    var createdAt: Date
    var updatedAt: Date
    var errorMessage: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case originalUrl = "original_url"
        case coloringPageUrl = "coloring_page_url"
        case name
        case status
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case errorMessage = "error_message"
    }

    init(
        id: String? = nil,
        userId: String,
        originalUrl: String,
        coloringPageUrl: String? = nil,
        name: String,
        status: ImageStatus = .uploading,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        errorMessage: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.originalUrl = originalUrl
        self.coloringPageUrl = coloringPageUrl
        self.name = name
        self.status = status
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.errorMessage = errorMessage
    }
}

// MARK: - User
struct User: Identifiable, Codable {
    var id: String
    var email: String
    var displayName: String?
    var photoURL: String?
    var createdAt: Date
    var isKidModeEnabled: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case displayName = "display_name"
        case photoURL = "photo_url"
        case createdAt = "created_at"
        case isKidModeEnabled = "is_kid_mode_enabled"
    }
}

// MARK: - FamilyAlbum
struct FamilyAlbum: Identifiable, Codable {
    @DocumentID var id: String?
    var name: String
    var shareCode: String
    var imageIds: [String]
    var createdBy: String
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case shareCode = "share_code"
        case imageIds = "image_ids"
        case createdBy = "created_by"
        case createdAt = "created_at"
    }
}

// MARK: - Photobook
struct Photobook: Identifiable, Codable {
    @DocumentID var id: String?
    var name: String
    var imageIds: [String]
    var pdfUrl: String?
    var status: PhotobookStatus
    var createdBy: String
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case imageIds = "image_ids"
        case pdfUrl = "pdf_url"
        case status
        case createdBy = "created_by"
        case createdAt = "created_at"
    }
}

enum PhotobookStatus: String, Codable {
    case pending
    case processing
    case completed
    case failed
}

// MARK: - ColoredArtwork
/// Represents a user's colored version of a coloring page
struct ColoredArtwork: Identifiable, Codable {
    @DocumentID var id: String?
    var imageId: String
    var userId: String
    var artworkUrl: String
    var thumbnailUrl: String?
    var createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case imageId = "image_id"
        case userId = "user_id"
        case artworkUrl = "artwork_url"
        case thumbnailUrl = "thumbnail_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - KidModeSettings
struct KidModeSettings: Codable {
    var isEnabled: Bool
    var parentCode: String
    var allowedImageIds: [String]
    var maxColoringTime: Int? // in minutes

    enum CodingKeys: String, CodingKey {
        case isEnabled = "is_enabled"
        case parentCode = "parent_code"
        case allowedImageIds = "allowed_image_ids"
        case maxColoringTime = "max_coloring_time"
    }
}
