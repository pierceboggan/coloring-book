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

    var body: some View {
        ZStack {
            // Fun colorful background
            LinearGradient(
                colors: [
                    Color(hex: "FFB3BA"),
                    Color(hex: "FFD166"),
                    Color(hex: "9BF6FF"),
                    Color(hex: "C3F584")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Kid-friendly header
                HStack {
                    Text("🎨 Coloring Fun! 🖍️")
                        .font(.title.bold())
                        .foregroundColor(.white)

                    Spacer()

                    // Hidden unlock button (parent access)
                    Button {
                        showUnlockPrompt = true
                    } label: {
                        Image(systemName: "lock.circle.fill")
                            .font(.title2)
                            .foregroundColor(.white.opacity(0.3))
                    }
                }
                .padding()
                .background(Color(hex: "FF6F91"))

                // Coloring pages grid
                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                        .tint(.white)
                    Spacer()
                } else if viewModel.availableImages.isEmpty {
                    EmptyKidModeView()
                } else {
                    ScrollView {
                        LazyVGrid(
                            columns: [
                                GridItem(.flexible(), spacing: 20),
                                GridItem(.flexible(), spacing: 20)
                            ],
                            spacing: 20
                        ) {
                            ForEach(viewModel.availableImages) { image in
                                KidModeImageCard(image: image) {
                                    viewModel.selectedImage = image
                                }
                            }
                        }
                        .padding()
                    }
                }
            }

            // Parent unlock prompt
            if showUnlockPrompt {
                ParentUnlockPrompt(
                    unlockCode: $unlockCode,
                    onUnlock: {
                        if appState.disableKidMode(withCode: unlockCode) {
                            showUnlockPrompt = false
                            unlockCode = ""
                        } else {
                            // Show error - wrong code
                            unlockCode = ""
                        }
                    },
                    onCancel: {
                        showUnlockPrompt = false
                        unlockCode = ""
                    }
                )
            }
        }
        .fullScreenCover(item: $viewModel.selectedImage) { image in
            ColoringCanvasView(image: image)
        }
        .task {
            await viewModel.loadImages()
        }
    }
}

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
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        Image(systemName: "photo")
                            .font(.system(size: 50))
                            .foregroundColor(.white)
                    case .empty:
                        ProgressView()
                            .tint(.white)
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(height: 200)
                .clipped()

                Text("🎨 Color Me! 🖍️")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .background(Color(hex: "FF6F91"))
            }
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white, lineWidth: 4)
            )
            .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        }
    }
}

struct EmptyKidModeView: View {
    var body: some View {
        VStack(spacing: 20) {
            Text("🎨")
                .font(.system(size: 100))

            Text("No Coloring Pages Yet!")
                .font(.title.bold())
                .foregroundColor(.white)

            Text("Ask a parent to add some pictures to color!")
                .font(.title3)
                .foregroundColor(.white.opacity(0.9))
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }
}

struct ParentUnlockPrompt: View {
    @Binding var unlockCode: String
    let onUnlock: () -> Void
    let onCancel: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.7)
                .ignoresSafeArea()
                .onTapGesture {
                    onCancel()
                }

            VStack(spacing: 20) {
                Text("Parent Access")
                    .font(.title2.bold())
                    .foregroundColor(Color(hex: "3A2E39"))

                Text("Enter the parent code to exit Kid Mode")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "594144"))
                    .multilineTextAlignment(.center)

                SecureField("Parent Code", text: $unlockCode)
                    .textFieldStyle(CustomTextFieldStyle())
                    .keyboardType(.numberPad)
                    .padding(.horizontal)

                HStack(spacing: 12) {
                    Button("Cancel") {
                        onCancel()
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .foregroundColor(Color(hex: "594144"))
                    .clipShape(RoundedRectangle(cornerRadius: 15))

                    Button("Unlock") {
                        onUnlock()
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: "FF6F91"))
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 15))
                }
                .padding(.horizontal)
            }
            .padding(30)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 25))
            .overlay(
                RoundedRectangle(cornerRadius: 25)
                    .stroke(Color(hex: "FFB3BA"), lineWidth: 4)
            )
            .padding(40)
        }
    }
}

#Preview {
    KidModeView()
        .environmentObject(AppState())
}
