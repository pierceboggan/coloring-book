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
        .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "10.0.0"),
    ],
    targets: [
        .target(
            name: "ColoringBook",
            dependencies: [
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseStorage", package: "firebase-ios-sdk"),
                .product(name: "FirebaseAnalytics", package: "firebase-ios-sdk"),
            ]
        ),
        .testTarget(
            name: "ColoringBookTests",
            dependencies: ["ColoringBook"]
        )
    ]
)
