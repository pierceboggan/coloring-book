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

    var body: some View {
        NavigationView {
            ZStack {
                // Background
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

                            Text("\(viewModel.images.count) coloring pages")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "594144"))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        .padding(.top)

                        // Images grid
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
                                    ImageCard(image: image) {
                                        selectedImage = image
                                        showColoringCanvas = true
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
    }
}

struct ImageCard: View {
    let image: ColoringImage
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 0) {
                // Image
                AsyncImage(url: URL(string: image.coloringPageUrl ?? image.originalUrl)) { phase in
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
                .frame(height: 180)
                .clipped()

                // Info
                VStack(alignment: .leading, spacing: 6) {
                    Text(image.name)
                        .font(.subheadline.bold())
                        .foregroundColor(Color(hex: "3A2E39"))
                        .lineLimit(1)

                    HStack {
                        StatusBadge(status: image.status)
                        Spacer()
                        Image(systemName: "paintbrush.fill")
                            .font(.caption)
                            .foregroundColor(Color(hex: "FF6F91"))
                    }
                }
                .padding(12)
                .background(Color.white.opacity(0.95))
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color(hex: "A0E7E5"), lineWidth: 3)
            )
            .shadow(color: Color(hex: "55C6C0").opacity(0.3), radius: 5, x: 3, y: 3)
        }
    }
}

struct StatusBadge: View {
    let status: ImageStatus

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 6, height: 6)

            Text(statusText)
                .font(.caption2)
                .foregroundColor(Color(hex: "594144"))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(hex: "FFF3BF").opacity(0.8))
        .clipShape(Capsule())
    }

    private var statusColor: Color {
        switch status {
        case .uploading, .processing:
            return Color.orange
        case .completed:
            return Color.green
        case .error:
            return Color.red
        }
    }

    private var statusText: String {
        switch status {
        case .uploading:
            return "Uploading"
        case .processing:
            return "Processing"
        case .completed:
            return "Ready"
        case .error:
            return "Error"
        }
    }
}

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
