//
//  ColoringImageTests.swift
//  ColoringBookTests
//
//  Tests for the ColoringImage model — Codable mapping with the web app's
//  snake_case schema and the derived `allImageUrls` / `variantCount` helpers.
//

import XCTest
@testable import ColoringBook

final class ColoringImageTests: XCTestCase {

    // MARK: - Initialization

    func testDefaultInitializerLeavesOptionalsNil() {
        let image = ColoringImage(
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            name: "Snapshot"
        )

        XCTAssertNil(image.id)
        XCTAssertNil(image.coloringPageUrl)
        XCTAssertNil(image.variantUrls)
        XCTAssertNil(image.errorMessage)
        XCTAssertEqual(image.status, .uploading)
    }

    // MARK: - Derived helpers

    func testAllImageUrlsEmptyWhenNoColoringPageOrVariants() {
        let image = ColoringImage(
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            name: "Snapshot"
        )

        XCTAssertEqual(image.allImageUrls, [])
        XCTAssertEqual(image.variantCount, 0)
    }

    func testAllImageUrlsCombinesMainAndVariantsInOrder() {
        let image = ColoringImage(
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            coloringPageUrl: "https://example.com/main.png",
            name: "Snapshot",
            status: .completed,
            variantUrls: ["https://example.com/v1.png", "https://example.com/v2.png"]
        )

        XCTAssertEqual(image.allImageUrls, [
            "https://example.com/main.png",
            "https://example.com/v1.png",
            "https://example.com/v2.png"
        ])
        XCTAssertEqual(image.variantCount, 2)
    }

    func testVariantCountIgnoresMainColoringPage() {
        let image = ColoringImage(
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            coloringPageUrl: "https://example.com/main.png",
            name: "Snapshot",
            status: .completed
        )

        XCTAssertEqual(image.variantCount, 0)
        XCTAssertEqual(image.allImageUrls, ["https://example.com/main.png"])
    }

    // MARK: - Codable / snake_case mapping

    func testDecodesSnakeCasePayloadFromSupabase() throws {
        let json = """
        {
            "id": "abc-123",
            "user_id": "user-42",
            "original_url": "https://example.com/o.jpg",
            "coloring_page_url": "https://example.com/c.png",
            "name": "Birthday",
            "status": "completed",
            "created_at": "2025-01-02T03:04:05Z",
            "updated_at": "2025-01-02T03:04:05Z",
            "variant_urls": ["https://example.com/v1.png"],
            "variant_prompts": ["pencil sketch"],
            "is_favorite": true,
            "archived_at": null
        }
        """.data(using: .utf8)!

        let image = try JSONDecoder().decode(ColoringImage.self, from: json)

        XCTAssertEqual(image.id, "abc-123")
        XCTAssertEqual(image.userId, "user-42")
        XCTAssertEqual(image.originalUrl, "https://example.com/o.jpg")
        XCTAssertEqual(image.coloringPageUrl, "https://example.com/c.png")
        XCTAssertEqual(image.status, .completed)
        XCTAssertEqual(image.variantUrls, ["https://example.com/v1.png"])
        XCTAssertEqual(image.variantPrompts, ["pencil sketch"])
        XCTAssertEqual(image.isFavorite, true)
        XCTAssertNil(image.archivedAt)
    }

    func testEncodesUsingSnakeCaseKeys() throws {
        let image = ColoringImage(
            id: "abc-123",
            userId: "user-42",
            originalUrl: "https://example.com/o.jpg",
            coloringPageUrl: "https://example.com/c.png",
            name: "Birthday",
            status: .processing,
            variantUrls: ["https://example.com/v1.png"]
        )

        let data = try JSONEncoder().encode(image)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertNotNil(object)
        XCTAssertEqual(object?["user_id"] as? String, "user-42")
        XCTAssertEqual(object?["original_url"] as? String, "https://example.com/o.jpg")
        XCTAssertEqual(object?["coloring_page_url"] as? String, "https://example.com/c.png")
        XCTAssertEqual(object?["status"] as? String, "processing")
        XCTAssertEqual(object?["variant_urls"] as? [String], ["https://example.com/v1.png"])
    }

    func testStatusRawValuesMatchWebSchema() {
        XCTAssertEqual(ImageStatus.uploading.rawValue, "uploading")
        XCTAssertEqual(ImageStatus.processing.rawValue, "processing")
        XCTAssertEqual(ImageStatus.completed.rawValue, "completed")
        XCTAssertEqual(ImageStatus.error.rawValue, "error")
    }

    func testCodableRoundTripPreservesEquality() throws {
        let original = ColoringImage(
            id: "id-1",
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            coloringPageUrl: "https://example.com/c.png",
            name: "Round Trip",
            status: .completed,
            variantUrls: ["https://example.com/v.png"],
            isFavorite: false
        )

        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(ColoringImage.self, from: data)

        XCTAssertEqual(decoded, original)
    }
}
