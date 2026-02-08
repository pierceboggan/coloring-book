//
//  ColoringBookUITests.swift
//  ColoringBookUITests
//
//  UI tests for ColoringBook app
//

import XCTest

final class ColoringBookUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    override func tearDownWithError() throws {
        // Put teardown code here
    }

    func testWelcomeScreenAppears() throws {
        let app = XCUIApplication()
        app.launch()

        // Verify welcome screen elements
        XCTAssertTrue(app.staticTexts["ColoringBook.AI"].exists)
        XCTAssertTrue(app.buttons["Create a Coloring Page"].exists)
        XCTAssertTrue(app.buttons["Sign In"].exists)
    }

    func testNavigationToSignIn() throws {
        let app = XCUIApplication()
        app.launch()

        // Tap sign in button
        app.buttons["Sign In"].tap()

        // Verify auth modal appears
        XCTAssertTrue(app.staticTexts["Welcome Back"].exists)
        XCTAssertTrue(app.textFields["your@email.com"].exists)
        XCTAssertTrue(app.secureTextFields["••••••••"].exists)
    }

    func testKidModeActivation() throws {
        // Note: This test would require authentication
        // In a real scenario, you'd set up test credentials
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()

        // This would test kid mode after authentication
        // Simplified for demonstration
    }

    func testColoringCanvasInteraction() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--authenticated"]
        app.launch()

        // Navigate to a coloring page
        // Tap on first image in gallery
        // Verify canvas appears
        // Test drawing interaction

        // This is a placeholder for the actual test implementation
    }

    func testLaunchPerformance() throws {
        if #available(iOS 13.0, *) {
            measure(metrics: [XCTApplicationLaunchMetric()]) {
                XCUIApplication().launch()
            }
        }
    }
}
