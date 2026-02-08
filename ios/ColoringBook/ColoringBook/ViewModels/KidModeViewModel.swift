//
//  KidModeViewModel.swift
//  ColoringBook
//
//  View model for Kid Mode
//

import Foundation

@MainActor
class KidModeViewModel: ObservableObject {
    @Published var availableImages: [ColoringImage] = []
    @Published var selectedImage: ColoringImage?
    @Published var isLoading = false

    func loadImages() async {
        isLoading = true

        guard let userId = SupabaseService.shared.currentUser?.uid else {
            isLoading = false
            return
        }

        do {
            let allImages = try await SupabaseService.shared.fetchImages(userId: userId)
            // Only show completed coloring pages
            availableImages = allImages.filter { $0.status == .completed && $0.coloringPageUrl != nil }
            isLoading = false
        } catch {
            print("❌ Failed to load images for Kid Mode: \(error.localizedDescription)")
            isLoading = false
        }
    }
}
