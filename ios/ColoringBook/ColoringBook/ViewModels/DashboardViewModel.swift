//
//  DashboardViewModel.swift
//  ColoringBook
//
//  View model for the dashboard
//

import Foundation
import FirebaseFirestore

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var images: [ColoringImage] = []
    @Published var isLoading = false
    @Published var error: String?

    private var listener: ListenerRegistration?

    func loadImages() async {
        isLoading = true
        error = nil

        guard let userId = SupabaseService.shared.currentUser?.uid else {
            isLoading = false
            return
        }

        do {
            // Start listening to real-time updates
            listener = SupabaseService.shared.listenToImages(userId: userId) { [weak self] images in
                self?.images = images
                self?.isLoading = false
            }
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

    deinit {
        listener?.remove()
    }
}
