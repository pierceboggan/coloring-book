//
//  KidModePageTests.swift
//  ColoringBookTests
//
//  Tests for KidModeViewModel.KidModePage — verifies that swapping the
//  display URL produces a canvas-ready ColoringImage without mutating the
//  base model. This logic backs the kid-safe coloring picker.
//

import XCTest
@testable import ColoringBook

@MainActor
final class KidModePageTests: XCTestCase {

    func testCanvasImageOverridesColoringPageUrlWithDisplayUrl() {
        let base = ColoringImage(
            id: "img-1",
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            coloringPageUrl: "https://example.com/main.png",
            name: "Pet",
            status: .completed,
            variantUrls: ["https://example.com/v1.png"]
        )

        let page = KidModeViewModel.KidModePage(
            id: "img-1-page-1",
            baseImage: base,
            displayURL: "https://example.com/v1.png"
        )

        let canvasImage = page.canvasImage
        XCTAssertEqual(canvasImage.coloringPageUrl, "https://example.com/v1.png")
        // Other fields are preserved so the canvas can show the right metadata.
        XCTAssertEqual(canvasImage.id, base.id)
        XCTAssertEqual(canvasImage.userId, base.userId)
        XCTAssertEqual(canvasImage.name, base.name)
        XCTAssertEqual(canvasImage.variantUrls, base.variantUrls)
    }

    func testCanvasImageDoesNotMutateBaseImage() {
        let base = ColoringImage(
            id: "img-1",
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            coloringPageUrl: "https://example.com/main.png",
            name: "Pet",
            status: .completed
        )

        let page = KidModeViewModel.KidModePage(
            id: "img-1-page-0",
            baseImage: base,
            displayURL: "https://example.com/different.png"
        )

        _ = page.canvasImage

        XCTAssertEqual(page.baseImage.coloringPageUrl, "https://example.com/main.png",
                       "Base image should not be mutated when deriving canvasImage")
    }

    func testKidModePageEqualityIsValueBased() {
        let base = ColoringImage(
            userId: "user-1",
            originalUrl: "https://example.com/o.jpg",
            coloringPageUrl: "https://example.com/main.png",
            name: "Pet"
        )

        let page1 = KidModeViewModel.KidModePage(id: "p1", baseImage: base, displayURL: "https://example.com/main.png")
        let page2 = KidModeViewModel.KidModePage(id: "p1", baseImage: base, displayURL: "https://example.com/main.png")
        let page3 = KidModeViewModel.KidModePage(id: "p2", baseImage: base, displayURL: "https://example.com/main.png")

        XCTAssertEqual(page1, page2)
        XCTAssertNotEqual(page1, page3)
    }
}
