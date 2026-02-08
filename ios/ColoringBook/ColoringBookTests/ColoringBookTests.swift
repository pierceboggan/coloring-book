//
//  ColoringBookTests.swift
//  ColoringBookTests
//
//  Unit tests for ColoringBook app
//

import XCTest
@testable import ColoringBook

final class ColoringBookTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here
    }

    override func tearDownWithError() throws {
        // Put teardown code here
    }

    // MARK: - Model Tests

    func testColoringImageInitialization() throws {
        let image = ColoringImage(
            userId: "test-user",
            originalUrl: "https://example.com/original.jpg",
            name: "Test Image",
            status: .uploading
        )

        XCTAssertEqual(image.userId, "test-user")
        XCTAssertEqual(image.name, "Test Image")
        XCTAssertEqual(image.status, .uploading)
        XCTAssertNil(image.coloringPageUrl)
    }

    func testImageStatusTransitions() throws {
        var image = ColoringImage(
            userId: "test-user",
            originalUrl: "https://example.com/original.jpg",
            name: "Test Image",
            status: .uploading
        )

        // Test status progression
        image.status = .processing
        XCTAssertEqual(image.status, .processing)

        image.status = .completed
        XCTAssertEqual(image.status, .completed)
    }

    // MARK: - AppState Tests

    @MainActor
    func testAppStateStartsUnresolvedWhenObserversDisabled() throws {
        let appState = AppState(enableServiceObservers: false, enableNetworkMonitoring: false)

        XCTAssertFalse(appState.isAuthResolved)
        XCTAssertFalse(appState.isAuthenticated)
    }

    @MainActor
    func testAppStateAuthBootstrapTransition() throws {
        let appState = AppState(enableServiceObservers: false, enableNetworkMonitoring: false)

        XCTAssertFalse(appState.isAuthResolved)
        XCTAssertFalse(appState.isAuthenticated)

        appState.isAuthenticated = true
        appState.isAuthResolved = true

        XCTAssertTrue(appState.isAuthResolved)
        XCTAssertTrue(appState.isAuthenticated)
    }

    @MainActor
    func testAppStateKidModeToggle() throws {
        let appState = AppState(enableServiceObservers: false, enableNetworkMonitoring: false)

        XCTAssertFalse(appState.isKidModeActive)

        appState.enableKidMode()
        XCTAssertTrue(appState.isKidModeActive)

        let success = appState.disableKidMode(withCode: "1234")
        XCTAssertTrue(success)
        XCTAssertFalse(appState.isKidModeActive)
    }

    @MainActor
    func testAppStateInvalidKidModeCode() throws {
        let appState = AppState(enableServiceObservers: false, enableNetworkMonitoring: false)
        appState.enableKidMode()

        let success = appState.disableKidMode(withCode: "wrong")
        XCTAssertFalse(success)
        XCTAssertTrue(appState.isKidModeActive)
    }

    // MARK: - Performance Tests

    func testColoringImageCodingPerformance() throws {
        let image = ColoringImage(
            userId: "test-user",
            originalUrl: "https://example.com/original.jpg",
            coloringPageUrl: "https://example.com/coloring.jpg",
            name: "Test Image",
            status: .completed
        )

        measure {
            do {
                let encoder = JSONEncoder()
                let data = try encoder.encode(image)
                let decoder = JSONDecoder()
                _ = try decoder.decode(ColoringImage.self, from: data)
            } catch {
                XCTFail("Encoding/decoding failed: \(error)")
            }
        }
    }
}
