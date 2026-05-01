//
//  AppStateTests.swift
//  ColoringBookTests
//
//  Tests for AppState — the global SwiftUI app state that drives routing
//  between launch, welcome, kid mode, and main tabs.
//

import XCTest
@testable import ColoringBook

@MainActor
final class AppStateTests: XCTestCase {

    private func makeAppState() -> AppState {
        AppState(enableServiceObservers: false, enableNetworkMonitoring: false)
    }

    // MARK: - Initial state

    func testInitialStateIsUnresolvedAndUnauthenticated() {
        let state = makeAppState()

        XCTAssertFalse(state.isAuthResolved, "App should start in 'unresolved' so launch screen is shown")
        XCTAssertFalse(state.isAuthenticated)
        XCTAssertNil(state.currentUser)
        XCTAssertFalse(state.isKidModeActive)
        XCTAssertFalse(state.isOffline)
    }

    // MARK: - Auth bootstrap

    func testAuthResolvedFlipsIndependentlyOfAuthentication() {
        let state = makeAppState()

        state.isAuthResolved = true

        XCTAssertTrue(state.isAuthResolved)
        XCTAssertFalse(state.isAuthenticated, "Resolving the session should not implicitly authenticate the user")
    }

    func testAuthenticatingTransitionsToAuthenticatedState() {
        let state = makeAppState()

        state.isAuthResolved = true
        state.isAuthenticated = true

        XCTAssertTrue(state.isAuthResolved)
        XCTAssertTrue(state.isAuthenticated)
    }

    // MARK: - Kid mode

    func testEnableKidModeActivatesIt() {
        let state = makeAppState()

        state.enableKidMode()

        XCTAssertTrue(state.isKidModeActive)
    }

    func testDisableKidModeWithDefaultCodeSucceeds() {
        let state = makeAppState()
        state.enableKidMode()

        let success = state.disableKidMode(withCode: "1234")

        XCTAssertTrue(success)
        XCTAssertFalse(state.isKidModeActive)
    }

    func testDisableKidModeWithWrongCodeFails() {
        let state = makeAppState()
        state.enableKidMode()

        let success = state.disableKidMode(withCode: "0000")

        XCTAssertFalse(success)
        XCTAssertTrue(state.isKidModeActive, "Kid mode must remain active when the parent code is incorrect")
    }

    func testDisableKidModeWithEmptyCodeFails() {
        let state = makeAppState()
        state.enableKidMode()

        XCTAssertFalse(state.disableKidMode(withCode: ""))
        XCTAssertTrue(state.isKidModeActive)
    }

    func testCustomParentCodePersistsAndUnlocks() {
        let suiteName = "AppStateTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        defaults.set("8675", forKey: "kidmode_parent_code")
        // The production AppState uses .standard; round-trip via standard for the test.
        UserDefaults.standard.set("8675", forKey: "kidmode_parent_code")
        defer { UserDefaults.standard.removeObject(forKey: "kidmode_parent_code") }

        let state = makeAppState()
        state.enableKidMode()

        XCTAssertFalse(state.disableKidMode(withCode: "1234"), "Default code should no longer unlock")
        XCTAssertTrue(state.disableKidMode(withCode: "8675"))
        XCTAssertFalse(state.isKidModeActive)
    }
}
