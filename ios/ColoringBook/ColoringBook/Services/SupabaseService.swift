//
//  SupabaseService.swift
//  ColoringBook
//
//  Service layer for Supabase operations (Auth, Database, Storage)
//

import Foundation
import Supabase
import Combine

@MainActor
class SupabaseService: ObservableObject {
    static let shared = SupabaseService()

    @Published var currentUser: User?
    @Published var isAuthenticated = false

    let client: SupabaseClient

    private var cancellables = Set<AnyCancellable>()

    private init() {
        // Initialize Supabase client
        // These values should match your web app's configuration
        guard let supabaseURL = ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let supabaseAnonKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String else {
            fatalError("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY")
        }

        client = SupabaseClient(
            supabaseURL: URL(string: supabaseURL)!,
            supabaseKey: supabaseAnonKey
        )

        setupAuthStateListener()
    }

    // MARK: - Authentication

    private func setupAuthStateListener() {
        Task {
            for await state in client.auth.authStateChanges {
                await MainActor.run {
                    switch state {
                    case .signedIn(let session):
                        self.currentUser = session.user
                        self.isAuthenticated = true
                        print("✅ User signed in: \(session.user.id)")
                    case .signedOut:
                        self.currentUser = nil
                        self.isAuthenticated = false
                        print("✅ User signed out")
                    case .initialSession(let session):
                        if let session = session {
                            self.currentUser = session.user
                            self.isAuthenticated = true
                            print("✅ Initial session loaded: \(session.user.id)")
                        }
                    default:
                        break
                    }
                }
            }
        }
    }

    func signIn(email: String, password: String) async throws {
        let session = try await client.auth.signIn(email: email, password: password)
        currentUser = session.user
        isAuthenticated = true
        print("✅ Sign in successful")
    }

    func signUp(email: String, password: String) async throws {
        let session = try await client.auth.signUp(email: email, password: password)
        currentUser = session.user
        isAuthenticated = true
        print("✅ Sign up successful")
    }

    func signOut() async throws {
        try await client.auth.signOut()
        currentUser = nil
        isAuthenticated = false
        print("✅ Sign out successful")
    }

    func resetPassword(email: String) async throws {
        try await client.auth.resetPasswordForEmail(email)
        print("✅ Password reset email sent")
    }

    // MARK: - Image Operations

    func uploadImage(_ imageData: Data, fileName: String) async throws -> String {
        let filePath = "images/\(UUID().uuidString)-\(fileName)"

        try await client.storage
            .from("images")
            .upload(path: filePath, file: imageData, options: FileOptions(contentType: "image/jpeg"))

        let url = try client.storage
            .from("images")
            .getPublicURL(path: filePath)

        print("✅ Image uploaded: \(url)")
        return url.absoluteString
    }

    func createImageRecord(_ image: ColoringImage) async throws -> String {
        let response = try await client.database
            .from("images")
            .insert(image)
            .select()
            .single()
            .execute()

        guard let imageData = response.data,
              let json = try? JSONSerialization.jsonObject(with: imageData) as? [String: Any],
              let id = json["id"] as? String else {
            throw SupabaseError.invalidResponse
        }

        print("✅ Image record created: \(id)")
        return id
    }

    func fetchImages(userId: String) async throws -> [ColoringImage] {
        let response = try await client.database
            .from("images")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .execute()

        let images = try JSONDecoder().decode([ColoringImage].self, from: response.data)
        print("✅ Fetched \(images.count) images")
        return images
    }

    func fetchImage(imageId: String) async throws -> ColoringImage {
        let response = try await client.database
            .from("images")
            .select()
            .eq("id", value: imageId)
            .single()
            .execute()

        let image = try JSONDecoder().decode(ColoringImage.self, from: response.data)
        return image
    }

    func updateImageStatus(imageId: String, status: ImageStatus, coloringPageUrl: String? = nil) async throws {
        var updates: [String: Any] = [
            "status": status.rawValue,
            "updated_at": ISO8601DateFormatter().string(from: Date())
        ]

        if let url = coloringPageUrl {
            updates["coloring_page_url"] = url
        }

        try await client.database
            .from("images")
            .update(updates)
            .eq("id", value: imageId)
            .execute()

        print("✅ Image status updated: \(status.rawValue)")
    }

    func deleteImage(imageId: String) async throws {
        // First, get the image to find URLs for deletion
        let image = try await fetchImage(imageId: imageId)

        // Delete from Storage
        if let originalPath = extractStoragePath(from: image.originalUrl) {
            try? await client.storage
                .from("images")
                .remove(paths: [originalPath])
        }

        if let coloringUrl = image.coloringPageUrl,
           let coloringPath = extractStoragePath(from: coloringUrl) {
            try? await client.storage
                .from("images")
                .remove(paths: [coloringPath])
        }

        // Delete from database
        try await client.database
            .from("images")
            .delete()
            .eq("id", value: imageId)
            .execute()

        print("✅ Image deleted: \(imageId)")
    }

    private func extractStoragePath(from url: String) -> String? {
        // Extract the path from Supabase storage URL
        // Format: https://{project}.supabase.co/storage/v1/object/public/images/{path}
        guard let urlComponents = URLComponents(string: url),
              let path = urlComponents.path.split(separator: "/").last else {
            return nil
        }
        return String(path)
    }

    // MARK: - Real-time Subscriptions

    func subscribeToImages(userId: String, onChange: @escaping ([ColoringImage]) -> Void) async throws -> RealtimeChannel {
        let channel = client.realtime.channel("images_\(userId)")

        let insertTask = channel.onPostgresChange(
            InsertAction.self,
            schema: "public",
            table: "images",
            filter: "user_id=eq.\(userId)"
        ) { action in
            print("🔄 Image inserted")
            Task {
                let images = try? await self.fetchImages(userId: userId)
                if let images = images {
                    onChange(images)
                }
            }
        }

        let updateTask = channel.onPostgresChange(
            UpdateAction.self,
            schema: "public",
            table: "images",
            filter: "user_id=eq.\(userId)"
        ) { action in
            print("🔄 Image updated")
            Task {
                let images = try? await self.fetchImages(userId: userId)
                if let images = images {
                    onChange(images)
                }
            }
        }

        let deleteTask = channel.onPostgresChange(
            DeleteAction.self,
            schema: "public",
            table: "images",
            filter: "user_id=eq.\(userId)"
        ) { action in
            print("🔄 Image deleted")
            Task {
                let images = try? await self.fetchImages(userId: userId)
                if let images = images {
                    onChange(images)
                }
            }
        }

        await channel.subscribe()
        return channel
    }

    // MARK: - Family Albums

    func createFamilyAlbum(title: String, imageIds: [String], userId: String) async throws -> String {
        let shareCode = generateShareCode()
        let album: [String: Any] = [
            "user_id": userId,
            "title": title,
            "share_code": shareCode,
            "created_at": ISO8601DateFormatter().string(from: Date())
        ]

        let response = try await client.database
            .from("family_albums")
            .insert(album)
            .select()
            .single()
            .execute()

        guard let albumData = response.data,
              let json = try? JSONSerialization.jsonObject(with: albumData) as? [String: Any],
              let albumId = json["id"] as? String else {
            throw SupabaseError.invalidResponse
        }

        // Insert album images
        for imageId in imageIds {
            let albumImage: [String: String] = [
                "album_id": albumId,
                "image_id": imageId
            ]
            try? await client.database
                .from("album_images")
                .insert(albumImage)
                .execute()
        }

        print("✅ Family album created: \(albumId)")
        return albumId
    }

    func fetchFamilyAlbum(shareCode: String) async throws -> FamilyAlbum? {
        let response = try await client.database
            .from("family_albums")
            .select()
            .eq("share_code", value: shareCode)
            .limit(1)
            .execute()

        let albums = try? JSONDecoder().decode([FamilyAlbum].self, from: response.data)
        return albums?.first
    }

    private func generateShareCode() -> String {
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<8).compactMap { _ in characters.randomElement() })
    }

    // MARK: - Colored Artwork

    func saveColoredArtwork(imageId: String, artworkData: Data) async throws -> String {
        let userId = currentUser?.id.uuidString ?? "anonymous"
        let fileName = "\(UUID().uuidString).png"
        let filePath = "artworks/\(fileName)"

        // Upload to Storage
        try await client.storage
            .from("images")
            .upload(path: filePath, file: artworkData, options: FileOptions(contentType: "image/png"))

        let artworkUrl = try client.storage
            .from("images")
            .getPublicURL(path: filePath)

        // Create record (if you have a colored_artworks table)
        // For now, just return the URL
        print("✅ Colored artwork saved: \(artworkUrl)")
        return artworkUrl.absoluteString
    }
}

enum SupabaseError: LocalizedError {
    case invalidResponse
    case invalidData
    case notAuthenticated

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from Supabase"
        case .invalidData:
            return "Invalid data received"
        case .notAuthenticated:
            return "User not authenticated"
        }
    }
}
