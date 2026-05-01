//
//  ColorHexTests.swift
//  ColoringBookTests
//
//  Tests for the Color(hex:) / UIColor(hex:) helpers used throughout the UI.
//

import XCTest
import SwiftUI
@testable import ColoringBook

final class ColorHexTests: XCTestCase {

    private func components(_ color: UIColor) -> (CGFloat, CGFloat, CGFloat, CGFloat) {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        color.getRed(&r, green: &g, blue: &b, alpha: &a)
        return (r, g, b, a)
    }

    private func assertClose(
        _ value: CGFloat,
        _ expected: CGFloat,
        accuracy: CGFloat = 0.005,
        file: StaticString = #file,
        line: UInt = #line
    ) {
        XCTAssertEqual(value, expected, accuracy: accuracy, file: file, line: line)
    }

    func testParsesSixDigitHex() {
        let (r, g, b, a) = components(UIColor(hex: "FF6F91"))

        assertClose(r, 1.0)
        assertClose(g, 111.0 / 255.0)
        assertClose(b, 145.0 / 255.0)
        assertClose(a, 1.0)
    }

    func testParsesSixDigitHexWithLeadingHash() {
        let (r, g, b, a) = components(UIColor(hex: "#00FF80"))

        assertClose(r, 0.0)
        assertClose(g, 1.0)
        assertClose(b, 128.0 / 255.0)
        assertClose(a, 1.0)
    }

    func testParsesThreeDigitHex() {
        // F0A expands to FF00AA
        let (r, g, b, a) = components(UIColor(hex: "F0A"))

        assertClose(r, 1.0)
        assertClose(g, 0.0)
        assertClose(b, 170.0 / 255.0)
        assertClose(a, 1.0)
    }

    func testParsesEightDigitArgbHex() {
        // 80FF0000 = 50% alpha red
        let (r, g, b, a) = components(UIColor(hex: "80FF0000"))

        assertClose(r, 1.0)
        assertClose(g, 0.0)
        assertClose(b, 0.0)
        assertClose(a, 128.0 / 255.0)
    }

    func testInvalidHexDoesNotCrash() {
        // Unsupported lengths fall back to a safe default rather than crashing.
        let color = UIColor(hex: "ZZZ-not-hex")
        let (_, _, _, a) = components(color)
        XCTAssertGreaterThanOrEqual(a, 0)
        XCTAssertLessThanOrEqual(a, 1)
    }

    func testSwiftUIColorInitializerProducesEquivalentColor() {
        // Render both into a UIColor for a stable comparison.
        let swiftUI = UIColor(Color(hex: "112233"))
        let uikit = UIColor(hex: "112233")

        let (r1, g1, b1, _) = components(swiftUI)
        let (r2, g2, b2, _) = components(uikit)

        assertClose(r1, r2, accuracy: 0.01)
        assertClose(g1, g2, accuracy: 0.01)
        assertClose(b1, b2, accuracy: 0.01)
    }
}
