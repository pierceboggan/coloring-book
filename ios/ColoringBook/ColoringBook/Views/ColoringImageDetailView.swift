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

                        managementPanel

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
            .navigationTitle("Manage Page")
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

    private var managementPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Management")
                .font(.headline)
                .foregroundColor(Color(hex: "3A2E39"))

            if let shareURL = URL(string: displayURL) {
                ShareLink(item: shareURL) {
                    ManagementRow(icon: "square.and.arrow.up", title: "Share page", subtitle: "Send this page to family and friends")
                }
                .buttonStyle(.plain)
            }

            Button {
                Task {
                    await saveToPhotos()
                }
            } label: {
                if isSavingToPhotos {
                    HStack {
                        ProgressView()
                        Text("Saving to Photos...")
                            .font(.subheadline.weight(.semibold))
                            .foregroundColor(Color(hex: "3A2E39"))
                        Spacer()
                    }
                    .padding(14)
                    .background(Color.white.opacity(0.95))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                } else {
                    ManagementRow(icon: "arrow.down.to.line", title: "Save to Photos", subtitle: "Download this coloring page to your library")
                }
            }
            .buttonStyle(.plain)

            Button(role: .destructive) {
                showDeleteConfirmation = true
            } label: {
                ManagementRow(icon: "trash", title: "Delete page", subtitle: "Remove this page and related variants", foreground: .red, border: Color(hex: "FFB3BA"))
            }
            .buttonStyle(.plain)
        }
        .padding(14)
        .background(Color.white.opacity(0.75))
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color(hex: "FFD166"), lineWidth: 2)
        )
        .padding(.horizontal)
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

private struct ManagementRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var foreground: Color = Color(hex: "3A2E39")
    var border: Color = Color(hex: "A0E7E5")

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundColor(foreground)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.bold())
                    .foregroundColor(foreground)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(foreground.opacity(0.75))
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.bold())
                .foregroundColor(foreground.opacity(0.65))
        }
        .padding(14)
        .background(Color.white.opacity(0.95))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(border, lineWidth: 2)
        )
    }
}
