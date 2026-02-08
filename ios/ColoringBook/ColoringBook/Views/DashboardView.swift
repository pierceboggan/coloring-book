//
//  DashboardView.swift
//  ColoringBook
//
//  Main dashboard showing user's coloring pages
//

import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedDetailItem: GalleryDisplayItem?
    @State private var canvasSelection: CanvasSelection?
    @State private var pendingDeleteImage: ColoringImage?

    /// Total count including variants
    private var totalPageCount: Int {
        viewModel.images.reduce(0) { count, image in
            count + 1 + (image.variantUrls?.count ?? 0)
        }
    }

    private var galleryItems: [GalleryDisplayItem] {
        viewModel.images.flatMap { image in
            var items = [
                GalleryDisplayItem(
                    id: "\(image.id ?? UUID().uuidString)-main",
                    parentImage: image,
                    displayURL: image.coloringPageUrl ?? image.originalUrl,
                    displayName: image.name,
                    isVariant: false
                )
            ]

            if let variants = image.variantUrls {
                items.append(
                    contentsOf: variants.enumerated().map { index, url in
                        GalleryDisplayItem(
                            id: "\(image.id ?? UUID().uuidString)-variant-\(index)",
                            parentImage: image,
                            displayURL: url,
                            displayName: image.name,
                            isVariant: true
                        )
                    }
                )
            }

            return items
        }
    }

    private func refreshGallery() {
        Task {
            await viewModel.loadImages()
        }
    }

    private func requestDelete(_ image: ColoringImage) {
        pendingDeleteImage = image
    }

    private func confirmDelete() {
        guard let image = pendingDeleteImage else { return }
        Task {
            await viewModel.deleteImage(image)
            pendingDeleteImage = nil
        }
    }

    private func openDetail(_ item: GalleryDisplayItem) {
        selectedDetailItem = item
    }

    private func startColoring(with image: ColoringImage) {
        canvasSelection = CanvasSelection(image: image)
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
                                ForEach(galleryItems) { item in
                                    SwipeableGalleryCard(
                                        imageUrl: item.displayURL,
                                        name: item.displayName,
                                        variantBadge: item.isVariant,
                                        onTap: { openDetail(item) },
                                        onDelete: { requestDelete(item.parentImage) }
                                    )
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
        .sheet(item: $selectedDetailItem) { item in
            ColoringImageDetailView(
                image: item.parentImage,
                displayURL: item.displayURL,
                onColor: { image in
                    startColoring(with: image)
                },
                onDelete: { image in
                    requestDelete(image)
                }
            )
        }
        .fullScreenCover(item: $canvasSelection) { selection in
            ColoringCanvasView(image: selection.image)
        }
        .alert("Delete this image?", isPresented: Binding(
            get: { pendingDeleteImage != nil },
            set: { newValue in
                if !newValue {
                    pendingDeleteImage = nil
                }
            }
        )) {
            Button("Cancel", role: .cancel) {
                pendingDeleteImage = nil
            }
            Button("Delete", role: .destructive) {
                confirmDelete()
            }
        } message: {
            Text("This will remove the image and its generated variants.")
        }
    }
}

private struct GalleryDisplayItem: Identifiable {
    let id: String
    let parentImage: ColoringImage
    let displayURL: String
    let displayName: String
    let isVariant: Bool
}

private struct CanvasSelection: Identifiable {
    let id = UUID()
    let image: ColoringImage
}

// MARK: - Swipeable Card

private struct SwipeableGalleryCard: View {
    let imageUrl: String
    let name: String
    let variantBadge: Bool
    let onTap: () -> Void
    let onDelete: () -> Void

    @State private var horizontalOffset: CGFloat = 0
    private let revealWidth: CGFloat = 86

    var body: some View {
        ZStack(alignment: .trailing) {
            Button(role: .destructive) {
                horizontalOffset = 0
                onDelete()
            } label: {
                Image(systemName: "trash")
                    .font(.title3.weight(.semibold))
                    .foregroundColor(.white)
                    .frame(width: revealWidth)
                    .frame(maxHeight: .infinity)
                    .background(Color.red)
            }
            .clipShape(RoundedRectangle(cornerRadius: 14))

            GalleryCard(
                imageUrl: imageUrl,
                name: name,
                variantBadge: variantBadge
            )
            .offset(x: horizontalOffset)
            .contentShape(Rectangle())
            .onTapGesture {
                if horizontalOffset != 0 {
                    horizontalOffset = 0
                } else {
                    onTap()
                }
            }
            .gesture(
                DragGesture(minimumDistance: 15)
                    .onChanged { value in
                        if value.translation.width < 0 {
                            horizontalOffset = max(-revealWidth, value.translation.width)
                        } else if value.translation.width > 0 {
                            horizontalOffset = min(0, -revealWidth + value.translation.width)
                        }
                    }
                    .onEnded { value in
                        let shouldOpen = value.translation.width < -(revealWidth / 2)
                        horizontalOffset = shouldOpen ? -revealWidth : 0
                    }
            )
            .animation(.spring(response: 0.25, dampingFraction: 0.85), value: horizontalOffset)
        }
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - Unified Gallery Card

struct GalleryCard: View {
    let imageUrl: String
    let name: String
    let variantBadge: Bool

    var body: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .topTrailing) {
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
                .frame(maxWidth: .infinity)
                .clipped()

                if variantBadge {
                    Text("Variant")
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(hex: "6C63FF"))
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                        .padding(8)
                }
            }

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
