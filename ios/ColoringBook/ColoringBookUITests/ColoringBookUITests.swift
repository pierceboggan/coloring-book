//
//  ColoringBookUITests.swift
//  ColoringBookUITests
//
//  Launch-state UI tests that exercise app routing without hitting the network.
//  All flows are gated by the `--uitest-*` launch arguments handled in AppState.
//

import XCTest

final class ColoringBookUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func launch(_ argument: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [argument]
        app.launch()
        return app
    }

    // MARK: - Launch / loading state

    func testAuthBootstrapLoadingScreenAppears() {
        let app = launch("--uitest-auth-loading")

        XCTAssertTrue(
            app.staticTexts["Loading your coloring studio..."].waitForExistence(timeout: 5),
            "Launch loading screen should appear before auth resolves"
        )
    }

    // MARK: - Unauthenticated flow

    func testWelcomeScreenAppearsForUnauthenticatedUsers() {
        let app = launch("--uitest-unauthenticated")

        XCTAssertTrue(app.staticTexts["ColoringBook.AI"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Create a Coloring Page"].exists)
        XCTAssertTrue(app.buttons["Sign In"].exists)
    }

    func testTappingSignInOpensAuthSheet() {
        let app = launch("--uitest-unauthenticated")

        XCTAssertTrue(app.buttons["Sign In"].waitForExistence(timeout: 5))
        app.buttons["Sign In"].tap()

        XCTAssertTrue(app.staticTexts["Welcome Back"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.textFields["your@email.com"].exists)
        XCTAssertTrue(app.secureTextFields["••••••••"].exists)
    }

    // MARK: - Authenticated flow

    func testAuthenticatedLaunchShowsMainTabs() {
        let app = launch("--uitest-authenticated")

        let gallery = app.tabBars.buttons["Gallery"]
        XCTAssertTrue(gallery.waitForExistence(timeout: 5))
        XCTAssertTrue(app.tabBars.buttons["Create"].exists)
        XCTAssertTrue(app.tabBars.buttons["Albums"].exists)
        XCTAssertTrue(app.tabBars.buttons["Settings"].exists)
    }

    func testCreateTabShowsUploadScreen() {
        let app = launch("--uitest-authenticated")

        XCTAssertTrue(app.tabBars.buttons["Create"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Create"].tap()

        XCTAssertTrue(
            app.staticTexts["Upload Your Photo"].waitForExistence(timeout: 5),
            "Create tab should land on the upload screen"
        )
    }

    func testSettingsTabIsReachable() {
        let app = launch("--uitest-authenticated")

        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()

        // Settings is selected; the tab bar still shows Gallery as a sibling.
        XCTAssertTrue(app.tabBars.buttons["Gallery"].exists)
    }
}
