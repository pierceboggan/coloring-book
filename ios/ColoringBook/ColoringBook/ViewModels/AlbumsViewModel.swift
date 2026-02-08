//
//  AlbumsViewModel.swift
//  ColoringBook
//
//  View model for albums management
//

import Foundation

@MainActor
class AlbumsViewModel: ObservableObject {
    @Published var albums: [FamilyAlbum] = []
    @Published var isLoading = false

    func createAlbum(name: String, imageIds: [String]) async {
        guard let userId = SupabaseService.shared.currentUser?.uid else { return }

        do {
            _ = try await SupabaseService.shared.createFamilyAlbum(
                name: name,
                imageIds: imageIds,
                userId: userId
            )
            print("✅ Album created successfully")
        } catch {
            print("❌ Failed to create album: \(error.localizedDescription)")
        }
    }

    func fetchAlbum(shareCode: String) async -> FamilyAlbum? {
        do {
            return try await SupabaseService.shared.fetchFamilyAlbum(shareCode: shareCode)
        } catch {
            print("❌ Failed to fetch album: \(error.localizedDescription)")
            return nil
        }
    }
}
