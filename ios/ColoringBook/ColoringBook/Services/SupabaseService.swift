//
//  SupabaseService.swift
//  ColoringBook
//
//  Service layer for Supabase operations (Auth, Database, Storage)
//  Shared backend with the web app.
//

import Foundation
import Supabase

@MainActor
class SupabaseService: ObservableObject {
    static let shared = SupabaseService()

    @Published var currentUser: User?
    @Published var isAuthenticated = false

    let client: SupabaseClient

    private init() {
        let url = ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String
            ?? ""
        let key = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
            ?? ""

        client = SupabaseClient(
            supabaseURL: URL(string: url) ?? URL(string: "https://placeholder.supabase.co")!,
            supabaseKey: key
        )

        Task {
            await checkSession()
        }
    }

    // MARK: - Auth

    private func checkSession() async {
        do {
            let session = try await client.auth.session
            currentUser = session.user
            isAuthenticated = true
            print("✅ Existing Supabase session found")
        } catch {
            currentUser = nil
            isAuthenticated = false
            print("ℹ️ No existing session")
        }
    }

    func signIn(email: String, password: String) async throws {
        let session = try await client.auth.signIn(email: email, password: password)
        currentUser = session.user
        isAuthenticated = true
        print("✅ Signed in: \(email)")
    }

    func signUp(email: String, password: String) async throws {
        let session = try await client.auth.signUp(email: email, password: password)
        currentUser = session.user
        isAuthenticated = true
        print("✅ Signed up: \(email)")
    }

    func signOut() throws {
        Task {
            try await client.auth.signOut()
        }
        currentUser = nil
        isAuthenticated = false
        print("✅ Signed out")
    }

    func resetPassword(email: String) async throws {
        try await client.auth.resetPasswordForEmail(email)
        print("✅ Password reset email sent")
    }

    // MARK: - Images

    func uploadImage(_ imageData: Data, fileName: String) async throws -> String {
        let path = "images/\(UUID().uuidString)-\(fileName)"

        try await client.storage.from("images").upload(
            path,
            data: imageData,
            options: .init(contentType: "image/jpeg")
        )

        let publicURL = try client.storage.from("images").getPublicURL(path: path)
        return publicURL.absoluteString
    }

    func createImageRecord(_ image: ColoringImage) async throws -> String {
        let insertData: [String: AnyJSON] = [
            "user_id": .string(image.userId),
            "original_url": .string(image.originalUrl),
            "name": .string(image.name),
            "status": .string(image.status.rawValue)
        ]

        let response: [ColoringImage] = try await client.from("images")
            .insert(insertData)
            .select()
            .execute()
            .value

        guard let id = response.first?.id else {
            throw SupabaseServiceError.insertFailed
        }
        print("✅ Image record created: \(id)")
        return id
    }

    func fetchImages(userId: String) async throws -> [ColoringImage] {
        let images: [ColoringImage] = try await client.from("images")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .execute()
            .value
        return images
    }

    func fetchImage(imageId: String) async throws -> ColoringImage {
        let image: ColoringImage = try await client.from("images")
            .select()
            .eq("id", value: imageId)
            .single()
            .execute()
            .value
        return image
    }

    func updateImageStatus(imageId: String, status: ImageStatus) async throws {
        try await client.from("images")
            .update(["status": status.rawValue, "updated_at": ISO8601DateFormatter().string(from: Date())])
            .eq("id", value: imageId)
            .execute()
        print("✅ Image status updated to \(status.rawValue)")
    }

    func deleteImage(imageId: String) async throws {
        try await client.from("images")
            .delete()
            .eq("id", value: imageId)
            .execute()
        print("✅ Image deleted: \(imageId)")
    }

    // MARK: - Real-time (polling fallback)

    /// Fetches images periodically. For real-time, use Supabase Realtime channels.
    func listenToImages(userId: String, completion: @escaping ([ColoringImage]) -> Void) {
        // Initial fetch
        Task {
            do {
                let images = try await fetchImages(userId: userId)
                completion(images)
            } catch {
                print("❌ Error fetching images: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Family Albums

    func createFamilyAlbum(name: String, imageIds: [String], userId: String) async throws -> String {
        let shareCode = generateShareCode()
        let insertData: [String: AnyJSON] = [
            "user_id": .string(userId),
            "title": .string(name),
            "share_code": .string(shareCode),
            "comments_enabled": .bool(true),
            "downloads_enabled": .bool(true)
        ]

        let response: [FamilyAlbum] = try await client.from("family_albums")
            .insert(insertData)
            .select()
            .execute()
            .value

        guard let albumId = response.first?.id else {
            throw SupabaseServiceError.insertFailed
        }

        // Insert album_images join records
        for imageId in imageIds {
            let joinData: [String: AnyJSON] = [
                "album_id": .string(albumId),
                "image_id": .string(imageId)
            ]
            try await client.from("album_images")
                .insert(joinData)
                .execute()
        }

        print("✅ Family album created: \(albumId)")
        return albumId
    }

    func fetchFamilyAlbum(shareCode: String) async throws -> FamilyAlbum? {
        let albums: [FamilyAlbum] = try await client.from("family_albums")
            .select()
            .eq("share_code", value: shareCode)
            .limit(1)
            .execute()
            .value
        return albums.first
    }

    private func generateShareCode() -> String {
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<8).compactMap { _ in characters.randomElement() })
    }

    // MARK: - Colored Artwork

    func saveColoredArtwork(imageId: String, artworkData: Data) async throws -> String {
        let userId = currentUser?.id.uuidString ?? "anonymous"
        let fileName = "\(UUID().uuidString).png"

        // Upload artwork image
        let artworkUrl = try await uploadImage(artworkData, fileName: fileName)

        // Insert record
        let insertData: [String: AnyJSON] = [
            "image_id": .string(imageId),
            "user_id": .string(userId),
            "artwork_url": .string(artworkUrl)
        ]

        let response: [ColoredArtwork] = try await client.from("colored_artworks")
            .insert(insertData)
            .select()
            .execute()
            .value

        guard let id = response.first?.id else {
            throw SupabaseServiceError.insertFailed
        }
        print("✅ Colored artwork saved: \(id)")
        return id
    }

    func fetchColoredArtworks(imageId: String) async throws -> [ColoredArtwork] {
        let artworks: [ColoredArtwork] = try await client.from("colored_artworks")
            .select()
            .eq("image_id", value: imageId)
            .order("created_at", ascending: false)
            .execute()
            .value
        return artworks
    }
}

// MARK: - Errors

enum SupabaseServiceError: LocalizedError {
    case insertFailed
    case notAuthenticated

    var errorDescription: String? {
        switch self {
        case .insertFailed:
            return "Failed to insert record"
        case .notAuthenticated:
            return "User is not authenticated"
        }
    }
}
