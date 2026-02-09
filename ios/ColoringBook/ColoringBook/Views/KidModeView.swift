//
//  KidModeView.swift
//  ColoringBook
//
//  Kid-friendly locked mode with only coloring functionality
//

import SwiftUI

struct KidModeView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = KidModeViewModel()
    @State private var showUnlockPrompt = false
    @State private var unlockCode = ""
    @State private var unlockError = false
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    private func selectedIndex(for image: ColoringImage) -> Int {
        guard let selectedId = image.id,
              let index = viewModel.availableImages.firstIndex(where: { $0.id == selectedId }) else {
            return 0
        }
        return index
    }

    var body: some View {
        ZStack {
            // Soft pastel background
            Color(hex: "FFF8F0")
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Coloring Time")
                            .font(.title.bold())
                            .foregroundColor(Color(hex: "3A2E39"))

                        Text("\(viewModel.availableImages.count) pages to color")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "594144").opacity(0.7))
                    }

                    Spacer()

                    // Subtle lock icon for parent exit
                    Button {
                        showUnlockPrompt = true
                    } label: {
                        Image(systemName: "lock.fill")
                            .font(.body)
                            .foregroundColor(Color(hex: "594144").opacity(0.25))
                            .padding(10)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 12)

                // Content
                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                        .tint(Color(hex: "FF6F91"))
                        .scaleEffect(1.2)
                    Spacer()
                } else if viewModel.availableImages.isEmpty {
                    Spacer()
                    EmptyKidModeView()
                    Spacer()
                } else {
                    ScrollView(showsIndicators: false) {
                        LazyVGrid(
                            columns: Array(
                                repeating: GridItem(.flexible(), spacing: 14),
                                count: horizontalSizeClass == .regular ? 3 : 2
                            ),
                            spacing: 14
                        ) {
                            ForEach(viewModel.availableImages) { image in
                                KidModeImageCard(image: image) {
                                    viewModel.selectedImage = image
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 30)
                    }
                }
            }

            // Parent unlock overlay
            if showUnlockPrompt {
                ParentUnlockPrompt(
                    unlockCode: $unlockCode,
                    showError: $unlockError,
                    onUnlock: {
                        if appState.disableKidMode(withCode: unlockCode) {
                            showUnlockPrompt = false
                            unlockCode = ""
                            unlockError = false
                        } else {
                            unlockError = true
                            unlockCode = ""
                        }
                    },
                    onCancel: {
                        showUnlockPrompt = false
                        unlockCode = ""
                        unlockError = false
                    }
                )
            }
        }
        .fullScreenCover(item: $viewModel.selectedImage) { image in
            ColoringCanvasView(
                image: image,
                galleryImages: viewModel.availableImages,
                initialIndex: selectedIndex(for: image)
            )
        }
        .task {
            await viewModel.loadImages()
        }
    }
}

// MARK: - Kid Mode Image Card

struct KidModeImageCard: View {
    let image: ColoringImage
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 0) {
                AsyncImage(url: URL(string: image.coloringPageUrl ?? image.originalUrl)) { phase in
                    switch phase {
                    case .success(let img):
                        img
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    case .failure:
                        RoundedRectangle(cornerRadius: 0)
                            .fill(Color(hex: "F0F0F0"))
                            .overlay(
                                Image(systemName: "photo")
                                    .font(.largeTitle)
                                    .foregroundColor(Color(hex: "D0D0D0"))
                            )
                    case .empty:
                        RoundedRectangle(cornerRadius: 0)
                            .fill(Color(hex: "F8F8F8"))
                            .overlay(
                                ProgressView()
                                    .tint(Color(hex: "FF6F91"))
                            )
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(maxWidth: .infinity)
                .background(Color(hex: "F8F8F8"))
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color(hex: "E8E8E8"), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 3)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Empty State

struct EmptyKidModeView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "paintpalette.fill")
                .font(.system(size: 60))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color(hex: "FF6F91"), Color(hex: "FFD166")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Text("No Coloring Pages Yet")
                .font(.title3.bold())
                .foregroundColor(Color(hex: "3A2E39"))

            Text("Ask a parent to add some\npictures to color!")
                .font(.subheadline)
                .foregroundColor(Color(hex: "594144").opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }
}

// MARK: - Parent Unlock Prompt

struct ParentUnlockPrompt: View {
    @Binding var unlockCode: String
    @Binding var showError: Bool
    let onUnlock: () -> Void
    let onCancel: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .onTapGesture { onCancel() }

            VStack(spacing: 20) {
                Image(systemName: "lock.open.fill")
                    .font(.system(size: 28))
                    .foregroundColor(Color(hex: "FF6F91"))

                Text("Exit Kid Mode")
                    .font(.title3.bold())
                    .foregroundColor(Color(hex: "3A2E39"))

                Text("Enter your parent code")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "594144").opacity(0.7))

                SecureField("Code", text: $unlockCode)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .font(.title2.monospaced())
                    .padding()
                    .background(Color(hex: "F5F5F5"))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(showError ? Color.red.opacity(0.5) : Color(hex: "E0E0E0"), lineWidth: 1)
                    )
                    .padding(.horizontal, 8)

                if showError {
                    Text("Incorrect code")
                        .font(.caption)
                        .foregroundColor(.red)
                }

                HStack(spacing: 12) {
                    Button {
                        onCancel()
                    } label: {
                        Text("Cancel")
                            .font(.subheadline.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(hex: "F0F0F0"))
                            .foregroundColor(Color(hex: "594144"))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        onUnlock()
                    } label: {
                        Text("Unlock")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(hex: "FF6F91"))
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .padding(24)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.15), radius: 20, x: 0, y: 10)
            .padding(.horizontal, 40)
        }
    }
}

#Preview {
    KidModeView()
        .environmentObject(AppState())
}
