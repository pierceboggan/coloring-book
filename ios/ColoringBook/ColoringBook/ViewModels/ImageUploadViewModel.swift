//
//  ImageUploadViewModel.swift
//  ColoringBook
//
//  View model for image upload and processing
//

import Foundation
import UIKit

@MainActor
class ImageUploadViewModel: ObservableObject {
    @Published var selectedImage: UIImage?
    @Published var isProcessing = false
    @Published var processingStatus = "Preparing..."
    @Published var uploadProgress: Double = 0.0
    @Published var errorMessage: String?

    func uploadAndProcess() async {
        guard let image = selectedImage else { return }

        isProcessing = true
        errorMessage = nil
        processingStatus = "Preparing image..."
        uploadProgress = 0.0

        do {
            // Compress image
            guard let imageData = image.jpegData(compressionQuality: 0.8) else {
                throw UploadError.compressionFailed
            }

            let userId = SupabaseService.shared.currentUser?.uid ?? "anonymous"
            let fileName = "photo-\(Date().timeIntervalSince1970).jpg"

            // Upload to Firebase Storage
            processingStatus = "Uploading..."
            uploadProgress = 0.3
            let originalUrl = try await SupabaseService.shared.uploadImage(imageData, fileName: fileName)

            // Create image record
            processingStatus = "Creating record..."
            uploadProgress = 0.5
            let coloringImage = ColoringImage(
                userId: userId,
                originalUrl: originalUrl,
                name: fileName,
                status: .processing
            )

            let imageId = try await SupabaseService.shared.createImageRecord(coloringImage)

            // Generate coloring page
            processingStatus = "AI is creating your coloring page..."
            uploadProgress = 0.7
            let coloringPageData = try await OpenAIService.shared.generateColoringPage(from: imageData)

            // Upload coloring page
            processingStatus = "Finalizing..."
            uploadProgress = 0.9
            let coloringPageUrl = try await SupabaseService.shared.uploadImage(
                coloringPageData,
                fileName: "coloring-\(fileName)"
            )

            // Update image record
            try await SupabaseService.shared.updateImageStatus(imageId: imageId, status: .completed)

            processingStatus = "Complete!"
            uploadProgress = 1.0

            // Reset after success
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
            isProcessing = false
            selectedImage = nil

            print("✅ Image processed successfully")
        } catch {
            errorMessage = error.localizedDescription
            isProcessing = false
            uploadProgress = 0
            print("❌ Upload failed: \(error.localizedDescription)")
        }
    }
}

enum UploadError: LocalizedError {
    case compressionFailed
    case uploadFailed
    case processingFailed

    var errorDescription: String? {
        switch self {
        case .compressionFailed:
            return "Failed to compress image"
        case .uploadFailed:
            return "Failed to upload image"
        case .processingFailed:
            return "Failed to process image"
        }
    }
}
