//
//  DashboardViewModel.swift
//  ColoringBook
//
//  View model for the dashboard
//

import Foundation

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var images: [ColoringImage] = []
    @Published var isLoading = false
    @Published var error: String?

    func loadImages() async {
        isLoading = true
        error = nil

        guard let userId = SupabaseService.shared.currentUserId else {
            isLoading = false
            return
        }

        do {
            images = try await SupabaseService.shared.fetchImages(userId: userId)
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            print("❌ Failed to load images: \(error.localizedDescription)")
        }
    }

    func deleteImage(_ image: ColoringImage) async {
        guard let imageId = image.id else { return }

        do {
            try await SupabaseService.shared.deleteImage(imageId: imageId)
            images.removeAll { $0.id == imageId }
        } catch {
            self.error = error.localizedDescription
            print("❌ Failed to delete image: \(error.localizedDescription)")
        }
    }
}
