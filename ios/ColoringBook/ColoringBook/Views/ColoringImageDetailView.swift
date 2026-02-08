//
//  ColoringImageDetailView.swift
//  ColoringBook
//
//  Full-screen gallery detail viewer with share/save/color/delete actions.
//

import SwiftUI
import UIKit

struct ColoringImageDetailView: View {
    let image: ColoringImage
    let displayURL: String
    let onColor: (ColoringImage) -> Void
    let onDelete: (ColoringImage) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var isSavingToPhotos = false
    @State private var saveMessage: String?
    @State private var showDeleteConfirmation = false

    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "FFF5D6"), Color(hex: "FFE6EB"), Color(hex: "E0F7FA")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        imagePreview

                        VStack(spacing: 12) {
                            Button {
                                dismiss()
                                onColor(canvasImage)
                            } label: {
                                Label("Start Coloring!", systemImage: "paintpalette.fill")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(PrimaryActionButtonStyle())

                            actionGrid

                            Button(role: .destructive) {
                                showDeleteConfirmation = true
                            } label: {
                                Label("Delete", systemImage: "trash")
                                    .font(.subheadline.weight(.semibold))
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(SecondaryActionButtonStyle(background: Color.red.opacity(0.14), foreground: .red, border: Color(hex: "FFB3BA")))
                        }
                        .padding(.horizontal)

                        if let saveMessage {
                            Text(saveMessage)
                                .font(.caption.weight(.bold))
                                .foregroundColor(Color(hex: "3A2E39"))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(Color.white.opacity(0.85))
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule()
                                        .stroke(Color(hex: "A0E7E5"), lineWidth: 2)
                                )
                                .padding(.horizontal)
                        }
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Art Playground ✨")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
            .alert("Delete this image?", isPresented: $showDeleteConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    onDelete(image)
                    dismiss()
                }
            } message: {
                Text("This removes the coloring page and all associated variants.")
            }
        }
    }

    private var imagePreview: some View {
        AsyncImage(url: URL(string: displayURL)) { phase in
            switch phase {
            case .success(let img):
                img
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            case .failure:
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white.opacity(0.8))
                    .overlay {
                        VStack(spacing: 8) {
                            Image(systemName: "photo")
                                .font(.largeTitle)
                                .foregroundColor(Color(hex: "A0E7E5"))
                            Text("Unable to load image")
                                .font(.caption)
                                .foregroundColor(Color(hex: "594144"))
                        }
                    }
            case .empty:
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white.opacity(0.8))
                    .overlay {
                        ProgressView()
                    }
            @unknown default:
                EmptyView()
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 420)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(
                    LinearGradient(
                        colors: [Color(hex: "FFB3BA"), Color(hex: "A0E7E5")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 4
                )
        )
        .shadow(color: Color(hex: "FFB3BA").opacity(0.35), radius: 8, x: 4, y: 4)
        .padding(.horizontal)
    }

    private var actionGrid: some View {
        HStack(spacing: 12) {
            if let shareURL = URL(string: displayURL) {
                ShareLink(item: shareURL) {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(SecondaryActionButtonStyle(background: Color.white.opacity(0.95), foreground: Color(hex: "3A2E39"), border: Color(hex: "FFD166")))
            }

            Button {
                Task {
                    await saveToPhotos()
                }
            } label: {
                if isSavingToPhotos {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else {
                    Label("Save", systemImage: "arrow.down.to.line")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(SecondaryActionButtonStyle(background: Color.white.opacity(0.95), foreground: Color(hex: "3A2E39"), border: Color(hex: "A0E7E5")))
            .disabled(isSavingToPhotos)
        }
    }

    private var canvasImage: ColoringImage {
        var copy = image
        copy.coloringPageUrl = displayURL
        return copy
    }

    private func saveToPhotos() async {
        guard let url = URL(string: displayURL) else {
            saveMessage = "Invalid image URL"
            return
        }

        isSavingToPhotos = true
        defer { isSavingToPhotos = false }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let uiImage = UIImage(data: data) else {
                saveMessage = "Failed to decode image"
                return
            }

            UIImageWriteToSavedPhotosAlbum(uiImage, nil, nil, nil)
            saveMessage = "Saved to Photos 🎉"
        } catch {
            saveMessage = "Could not save image"
        }
    }
}

private struct PrimaryActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.vertical, 14)
            .background(Color(hex: "FF6F91"))
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color(hex: "FFB3BA"), lineWidth: 3)
            )
            .shadow(color: Color(hex: "FFB3BA").opacity(0.4), radius: 5, x: 3, y: 3)
            .opacity(configuration.isPressed ? 0.9 : 1)
    }
}

private struct SecondaryActionButtonStyle: ButtonStyle {
    var background: Color = Color.white.opacity(0.95)
    var foreground: Color = Color(hex: "3A2E39")
    var border: Color = Color(hex: "E0E0E0")

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.vertical, 12)
            .padding(.horizontal, 10)
            .background(background)
            .foregroundColor(foreground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(border, lineWidth: 2)
            )
            .opacity(configuration.isPressed ? 0.9 : 1)
    }
}
