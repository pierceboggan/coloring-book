//
//  AlbumsView.swift
//  ColoringBook
//
//  View for managing family albums and photobooks
//

import SwiftUI

struct AlbumsView: View {
    @StateObject private var viewModel = AlbumsViewModel()
    @State private var showCreateAlbum = false
    @State private var showShareCodeInput = false

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
                    VStack(spacing: 24) {
                        // Header
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Family Albums")
                                .font(.largeTitle.bold())
                                .foregroundColor(Color(hex: "3A2E39"))

                            Text("Create and share collections of coloring pages")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "594144"))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)

                        // Action buttons
                        HStack(spacing: 12) {
                            ActionButton(
                                icon: "plus.circle.fill",
                                title: "Create Album",
                                color: Color(hex: "FF6F91"),
                                action: { showCreateAlbum = true }
                            )

                            ActionButton(
                                icon: "qrcode",
                                title: "Enter Code",
                                color: Color(hex: "A0E7E5"),
                                action: { showShareCodeInput = true }
                            )
                        }
                        .padding(.horizontal)

                        // Albums list placeholder
                        Text("Albums coming soon!")
                            .font(.headline)
                            .foregroundColor(Color(hex: "594144"))
                            .padding(40)

                        Spacer(minLength: 40)
                    }
                    .padding(.top)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showCreateAlbum) {
            CreateAlbumView()
        }
        .sheet(isPresented: $showShareCodeInput) {
            ShareCodeInputView()
        }
    }
}

struct ActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title)
                Text(title)
                    .font(.subheadline.bold())
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(color.opacity(0.2))
            .foregroundColor(color)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(color, lineWidth: 3)
            )
        }
    }
}

struct CreateAlbumView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var albumName = ""
    @State private var selectedImages: [ColoringImage] = []

    var body: some View {
        NavigationView {
            VStack {
                Text("Create Album Feature")
                    .font(.title)
                Text("Coming soon!")
                    .font(.subheadline)
            }
            .navigationTitle("Create Album")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct ShareCodeInputView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var shareCode = ""

    var body: some View {
        NavigationView {
            VStack {
                Text("Enter Share Code")
                    .font(.title)
                TextField("Enter code", text: $shareCode)
                    .textFieldStyle(.roundedBorder)
                    .padding()
            }
            .navigationTitle("Join Album")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    AlbumsView()
}
