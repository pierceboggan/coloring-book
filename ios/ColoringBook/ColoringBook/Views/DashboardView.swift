//
//  DashboardView.swift
//  ColoringBook
//
//  Main dashboard showing user's coloring pages
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedDetailItem: GalleryDisplayItem?
    @State private var canvasSelection: CanvasSelection?
    @State private var pendingDeleteImage: ColoringImage?
    @State private var galleryMode: GalleryMode = .color
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    enum GalleryMode: String, CaseIterable, Identifiable {
        case color
        case manage

        var id: String { rawValue }
    }

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

    private func startColoring(from tappedItem: GalleryDisplayItem) {
        let pages = galleryItems.map { $0.canvasImage }
        guard !pages.isEmpty else { return }

        let selectedIndex = galleryItems.firstIndex(where: { $0.id == tappedItem.id }) ?? 0
        canvasSelection = CanvasSelection(images: pages, startIndex: selectedIndex)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "FFF5D6"), Color(hex: "FFE6EB"), Color(hex: "E0F7FA")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Header
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                HStack(spacing: 8) {
                                    Text("Your Gallery")
                                        .font(.largeTitle.bold())
                                        .foregroundColor(Color(hex: "3A2E39"))
                                    Text("🎨")
                                        .font(.title)
                                }

                                Spacer()

                                Button {
                                    appState.enableKidMode()
                                } label: {
                                    Label("Kid Mode", systemImage: "sparkles")
                                        .font(.caption.bold())
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(Color(hex: "FF6F91"))
                                        .foregroundColor(.white)
                                        .clipShape(Capsule())
                                }
                            }

                            Text("\(totalPageCount) pages ready for fun!")
                                .font(.subheadline.bold())
                                .foregroundColor(Color(hex: "594144"))

                            Picker("Gallery Mode", selection: $galleryMode) {
                                Text("Color").tag(GalleryMode.color)
                                Text("Manage").tag(GalleryMode.manage)
                            }
                            .pickerStyle(.segmented)
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
                                columns: Array(
                                    repeating: GridItem(.flexible(), spacing: 16),
                                    count: horizontalSizeClass == .regular ? 3 : 2
                                ),
                                spacing: 20
                            ) {
                                ForEach(galleryItems) { item in
                                    SwipeableGalleryCard(
                                        imageUrl: item.displayURL,
                                        isDeleteEnabled: galleryMode == .manage,
                                        onTap: {
                                            if galleryMode == .color {
                                                startColoring(from: item)
                                            } else {
                                                openDetail(item)
                                            }
                                        },
                                        onDelete: { requestDelete(item.parentImage) }
                                    )
                                }
                            }
                            .padding(.horizontal, 6)
                        }

                        Spacer(minLength: 132)
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
                onDelete: { image in
                    requestDelete(image)
                }
            )
        }
        .fullScreenCover(item: $canvasSelection) { selection in
            ColoringCanvasView(
                image: selection.images[selection.startIndex],
                galleryImages: selection.images,
                initialIndex: selection.startIndex
            )
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
    let isVariant: Bool

    var canvasImage: ColoringImage {
        var copy = parentImage
        copy.coloringPageUrl = displayURL
        return copy
    }
}

private struct CanvasSelection: Identifiable {
    let id = UUID()
    let images: [ColoringImage]
    let startIndex: Int
}

// MARK: - Swipeable Card

private struct SwipeableGalleryCard: View {
    let imageUrl: String
    let isDeleteEnabled: Bool
    let onTap: () -> Void
    let onDelete: () -> Void

    @State private var horizontalOffset: CGFloat = 0
    @State private var hasResolvedDirection = false
    @State private var isHorizontalDrag = false
    private let revealWidth: CGFloat = 92

    var body: some View {
        ZStack(alignment: .trailing) {
            if isDeleteEnabled {
                Button(role: .destructive) {
                    horizontalOffset = 0
                    onDelete()
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: "trash")
                            .font(.title3.weight(.semibold))
                        Text("Delete")
                            .font(.caption2.bold())
                    }
                    .foregroundColor(.white)
                    .frame(width: revealWidth)
                    .frame(maxHeight: .infinity)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "FF6B6B"), Color(hex: "FF3D71")],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }

            GalleryCard(imageUrl: imageUrl)
                .offset(x: horizontalOffset)
                .contentShape(Rectangle())
                .onTapGesture {
                    if horizontalOffset != 0 {
                        horizontalOffset = 0
                    } else {
                        onTap()
                    }
                }
                .simultaneousGesture(
                    DragGesture(minimumDistance: 12)
                        .onChanged { value in
                            guard isDeleteEnabled else { return }

                            let dx = value.translation.width
                            let dy = value.translation.height

                            if !hasResolvedDirection {
                                if abs(dx) < 8, abs(dy) < 8 {
                                    return
                                }

                                hasResolvedDirection = true
                                isHorizontalDrag = abs(dx) > abs(dy) * 1.15
                            }

                            guard isHorizontalDrag else {
                                return
                            }

                            if dx < 0 {
                                horizontalOffset = max(-revealWidth, dx)
                            } else if dx > 0 {
                                horizontalOffset = min(0, -revealWidth + dx)
                            }
                        }
                        .onEnded { value in
                            defer {
                                hasResolvedDirection = false
                                isHorizontalDrag = false
                            }

                            guard isDeleteEnabled, isHorizontalDrag else {
                                return
                            }

                            let projectedWidth = value.predictedEndTranslation.width
                            let shouldOpen = projectedWidth < -(revealWidth * 0.45)
                            horizontalOffset = shouldOpen ? -revealWidth : 0
                        }
                )
                .onChange(of: isDeleteEnabled) { enabled in
                    if !enabled {
                        horizontalOffset = 0
                    }
                }
                .animation(.spring(response: 0.25, dampingFraction: 0.85), value: horizontalOffset)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

// MARK: - Unified Gallery Card

struct GalleryCard: View {
    let imageUrl: String

    var body: some View {
        ZStack(alignment: .topTrailing) {
            AsyncImage(url: URL(string: imageUrl)) { phase in
                switch phase {
                case .success(let img):
                    img
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                case .failure:
                    ZStack {
                        Color.white.opacity(0.9)
                        Image(systemName: "photo")
                            .font(.largeTitle)
                            .foregroundColor(Color(hex: "A0E7E5"))
                    }
                case .empty:
                    ZStack {
                        Color.white.opacity(0.9)
                        ProgressView()
                            .tint(Color(hex: "FF6F91"))
                    }
                @unknown default:
                    EmptyView()
                }
            }
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.9))
        }
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [Color(hex: "FFB3BA"), Color(hex: "A0E7E5")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 4
                )
        )
        .shadow(color: Color(hex: "FFB3BA").opacity(0.28), radius: 6, x: 3, y: 3)
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
