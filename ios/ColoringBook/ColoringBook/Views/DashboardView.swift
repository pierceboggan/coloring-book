//
//  DashboardView.swift
//  ColoringBook
//
//  Main dashboard showing user's coloring pages
//

import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedImage: ColoringImage?
    @State private var showColoringCanvas = false

    /// Total count including variants
    private var totalPageCount: Int {
        viewModel.images.reduce(0) { count, image in
            count + 1 + (image.variantUrls?.count ?? 0)
        }
    }

    private func refreshGallery() {
        Task {
            await viewModel.loadImages()
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "FFF5D6"), Color(hex: "E0F7FA")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Header
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Your Gallery")
                                .font(.largeTitle.bold())
                                .foregroundColor(Color(hex: "3A2E39"))

                            Text("\(totalPageCount) coloring pages")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "594144"))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        .padding(.top)

                        if viewModel.isLoading {
                            ProgressView()
                                .padding(40)
                        } else if viewModel.images.isEmpty {
                            EmptyGalleryView()
                        } else {
                            LazyVGrid(
                                columns: [
                                    GridItem(.flexible(), spacing: 16),
                                    GridItem(.flexible(), spacing: 16)
                                ],
                                spacing: 16
                            ) {
                                ForEach(viewModel.images) { image in
                                    GalleryCard(
                                        imageUrl: image.coloringPageUrl ?? image.originalUrl,
                                        name: image.name
                                    ) {
                                        selectedImage = image
                                        showColoringCanvas = true
                                    }

                                    if let variants = image.variantUrls, !variants.isEmpty {
                                        ForEach(Array(variants.enumerated()), id: \.offset) { _, variantUrl in
                                            GalleryCard(
                                                imageUrl: variantUrl,
                                                name: image.name
                                            ) {
                                                selectedImage = image
                                                showColoringCanvas = true
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        Spacer(minLength: 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await viewModel.loadImages()
            }
            .fullScreenCover(isPresented: $showColoringCanvas) {
                if let image = selectedImage {
                    ColoringCanvasView(image: image)
                }
            }
        }
        .task {
            await viewModel.loadImages()
        }
        .onAppear {
            refreshGallery()
        }
        .onReceive(NotificationCenter.default.publisher(for: .galleryRefreshRequested)) { _ in
            refreshGallery()
        }
    }
}

// MARK: - Unified Gallery Card

struct GalleryCard: View {
    let imageUrl: String
    let name: String
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 0) {
                AsyncImage(url: URL(string: imageUrl)) { phase in
                    switch phase {
                    case .success(let img):
                        img
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        Image(systemName: "photo")
                            .font(.largeTitle)
                            .foregroundColor(Color(hex: "A0E7E5"))
                    case .empty:
                        ProgressView()
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(height: 200)
                .clipped()

                Text(name)
                    .font(.caption.weight(.medium))
                    .foregroundColor(Color(hex: "3A2E39"))
                    .lineLimit(1)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.95))
            }
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color(hex: "E0E0E0"), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
        }
    }
}

// MARK: - Empty State

struct EmptyGalleryView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 80))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color(hex: "FFB3BA"), Color(hex: "A0E7E5")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            VStack(spacing: 8) {
                Text("No Coloring Pages Yet")
                    .font(.title2.bold())
                    .foregroundColor(Color(hex: "3A2E39"))

                Text("Upload a photo to create your first coloring page!")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "594144"))
                    .multilineTextAlignment(.center)
            }
        }
        .padding(40)
    }
}

#Preview {
    DashboardView()
}
