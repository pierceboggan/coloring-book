// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ColoringBook",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "ColoringBook",
            targets: ["ColoringBook"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    ],
    targets: [
        .target(
            name: "ColoringBook",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
            ]
        ),
        .testTarget(
            name: "ColoringBookTests",
            dependencies: ["ColoringBook"]
        )
    ]
)
