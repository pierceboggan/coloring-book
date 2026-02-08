//
//  ImageUploadView.swift
//  ColoringBook
//
//  View for uploading and processing images
//

import SwiftUI
import PhotosUI

struct ImageUploadView: View {
    @StateObject private var viewModel = ImageUploadViewModel()
    @State private var showImagePicker = false
    @State private var showCamera = false

    var body: some View {
        NavigationView {
            ZStack {
                // Background
                LinearGradient(
                    colors: [Color(hex: "FFF5D6"), Color(hex: "FFE6EB")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 30) {
                        // Header
                        VStack(spacing: 12) {
                            Image(systemName: "photo.badge.plus")
                                .font(.system(size: 60))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [Color(hex: "FF6F91"), Color(hex: "FFD166")],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )

                            Text("Upload Your Photo")
                                .font(.title.bold())
                                .foregroundColor(Color(hex: "3A2E39"))

                            Text("Choose a family snapshot, silly selfie, or your favorite pet!")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "594144"))
                                .multilineTextAlignment(.center)
                        }
                        .padding(.horizontal)
                        .padding(.top, 40)

                        // Action buttons
                        VStack(spacing: 16) {
                            UploadButton(
                                icon: "photo.on.rectangle",
                                title: "Choose from Library",
                                description: "Pick an existing photo",
                                color: Color(hex: "A0E7E5"),
                                action: { showImagePicker = true }
                            )

                            UploadButton(
                                icon: "camera.fill",
                                title: "Take a Photo",
                                description: "Capture a new moment",
                                color: Color(hex: "FFB3BA"),
                                action: { showCamera = true }
                            )
                        }
                        .padding(.horizontal, 30)

                        // Processing status
                        if viewModel.isProcessing {
                            ProcessingStatusView(
                                status: viewModel.processingStatus,
                                progress: viewModel.uploadProgress
                            )
                        }

                        // Error message
                        if let error = viewModel.errorMessage {
                            ErrorBanner(message: error)
                        }

                        // Tips
                        TipsSection()

                        Spacer(minLength: 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showImagePicker) {
                ImagePicker(image: $viewModel.selectedImage, sourceType: .photoLibrary)
            }
            .sheet(isPresented: $showCamera) {
                ImagePicker(image: $viewModel.selectedImage, sourceType: .camera)
            }
            .onChange(of: viewModel.selectedImage) { newImage in
                if newImage != nil {
                    Task {
                        await viewModel.uploadAndProcess()
                    }
                }
            }
        }
    }
}

struct UploadButton: View {
    let icon: String
    let title: String
    let description: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 20) {
                Image(systemName: icon)
                    .font(.system(size: 40))
                    .foregroundColor(color)
                    .frame(width: 60, height: 60)
                    .background(color.opacity(0.2))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(Color(hex: "3A2E39"))

                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "594144"))
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(color)
            }
            .padding(20)
            .background(Color.white.opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(color, lineWidth: 3)
            )
            .shadow(color: color.opacity(0.3), radius: 5, x: 3, y: 3)
        }
    }
}

struct ProcessingStatusView: View {
    let status: String
    let progress: Double

    var body: some View {
        VStack(spacing: 16) {
            ProgressView(value: progress, total: 1.0)
                .tint(Color(hex: "FF6F91"))

            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(Color(hex: "FFD166"))
                Text(status)
                    .font(.subheadline.bold())
                    .foregroundColor(Color(hex: "3A2E39"))
            }
        }
        .padding(20)
        .background(Color(hex: "FFF3BF").opacity(0.9))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(hex: "FFD166"), lineWidth: 3)
        )
        .padding(.horizontal, 30)
    }
}

struct ErrorBanner: View {
    let message: String

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
            Text(message)
                .font(.subheadline)
                .foregroundColor(Color(hex: "3A2E39"))
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal, 30)
    }
}

struct TipsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("💡 Tips for Great Results")
                .font(.headline)
                .foregroundColor(Color(hex: "3A2E39"))

            VStack(alignment: .leading, spacing: 8) {
                TipRow(text: "Use photos with clear subjects")
                TipRow(text: "Good lighting works best")
                TipRow(text: "Simple backgrounds are easier to color")
                TipRow(text: "Close-ups create detailed pages")
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.7))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(hex: "FFB3BA"), lineWidth: 2)
        )
        .padding(.horizontal, 30)
    }
}

struct TipRow: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(Color(hex: "FF6F91"))
                .frame(width: 6, height: 6)
                .padding(.top, 6)

            Text(text)
                .font(.subheadline)
                .foregroundColor(Color(hex: "594144"))
        }
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    let sourceType: UIImagePickerController.SourceType
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker

        init(_ parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    ImageUploadView()
}
