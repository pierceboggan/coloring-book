//
//  FirebaseService.swift
//  ColoringBook
//
//  Service layer for Firebase operations
//

import Foundation
import FirebaseAuth
import FirebaseFirestore
import FirebaseStorage
import Combine

@MainActor
class FirebaseService: ObservableObject {
    static let shared = FirebaseService()

    @Published var currentUser: FirebaseAuth.User?
    @Published var isAuthenticated = false

    private let db = Firestore.firestore()
    private let storage = Storage.storage()
    private let auth = Auth.auth()

    private var authStateListener: AuthStateDidChangeListenerHandle?
    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupAuthStateListener()
    }

    // MARK: - Authentication

    private func setupAuthStateListener() {
        authStateListener = auth.addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in
                self?.currentUser = user
                self?.isAuthenticated = user != nil
            }
        }
    }

    func signIn(email: String, password: String) async throws {
        let result = try await auth.signIn(withEmail: email, password: password)
        currentUser = result.user
        isAuthenticated = true
    }

    func signUp(email: String, password: String) async throws {
        let result = try await auth.createUser(withEmail: email, password: password)
        currentUser = result.user
        isAuthenticated = true

        // Create user document in Firestore
        try await createUserDocument(userId: result.user.uid, email: email)
    }

    func signOut() throws {
        try auth.signOut()
        currentUser = nil
        isAuthenticated = false
    }

    func resetPassword(email: String) async throws {
        try await auth.sendPasswordReset(withEmail: email)
    }

    // MARK: - User Management

    private func createUserDocument(userId: String, email: String) async throws {
        let user = User(
            id: userId,
            email: email,
            createdAt: Date(),
            isKidModeEnabled: false
        )

        try db.collection("users").document(userId).setData(from: user)
    }

    func fetchUser(userId: String) async throws -> User {
        let document = try await db.collection("users").document(userId).getDocument()
        return try document.data(as: User.self)
    }

    // MARK: - Image Operations

    func uploadImage(_ imageData: Data, fileName: String) async throws -> String {
        let storageRef = storage.reference().child("images/\(UUID().uuidString)-\(fileName)")
        let metadata = StorageMetadata()
        metadata.contentType = "image/jpeg"

        _ = try await storageRef.putDataAsync(imageData, metadata: metadata)
        let downloadURL = try await storageRef.downloadURL()
        return downloadURL.absoluteString
    }

    func createImageRecord(_ image: ColoringImage) async throws -> String {
        let docRef = try db.collection("images").addDocument(from: image)
        return docRef.documentID
    }

    func fetchImages(userId: String) async throws -> [ColoringImage] {
        let snapshot = try await db.collection("images")
            .whereField("user_id", isEqualTo: userId)
            .order(by: "created_at", descending: true)
            .getDocuments()

        return snapshot.documents.compactMap { document in
            try? document.data(as: ColoringImage.self)
        }
    }

    func fetchImage(imageId: String) async throws -> ColoringImage {
        let document = try await db.collection("images").document(imageId).getDocument()
        return try document.data(as: ColoringImage.self)
    }

    func updateImageStatus(imageId: String, status: ImageStatus) async throws {
        try await db.collection("images").document(imageId).updateData([
            "status": status.rawValue,
            "updated_at": FieldValue.serverTimestamp()
        ])
    }

    func deleteImage(imageId: String) async throws {
        // First, get the image to find URLs for deletion
        let image = try await fetchImage(imageId: imageId)

        // Delete from Storage
        if let originalUrl = URL(string: image.originalUrl) {
            try? await storage.reference(forURL: originalUrl.absoluteString).delete()
        }

        if let coloringUrl = image.coloringPageUrl, let url = URL(string: coloringUrl) {
            try? await storage.reference(forURL: url.absoluteString).delete()
        }

        // Delete from Firestore
        try await db.collection("images").document(imageId).delete()
    }

    // MARK: - Real-time Listeners

    func listenToImages(userId: String, completion: @escaping ([ColoringImage]) -> Void) -> ListenerRegistration {
        return db.collection("images")
            .whereField("user_id", isEqualTo: userId)
            .order(by: "created_at", descending: true)
            .addSnapshotListener { snapshot, error in
                guard let documents = snapshot?.documents else {
                    print("❌ Error fetching images: \(error?.localizedDescription ?? "Unknown error")")
                    return
                }

                let images = documents.compactMap { document in
                    try? document.data(as: ColoringImage.self)
                }
                completion(images)
            }
    }

    // MARK: - Family Albums

    func createFamilyAlbum(name: String, imageIds: [String], userId: String) async throws -> String {
        let shareCode = generateShareCode()
        let album = FamilyAlbum(
            name: name,
            shareCode: shareCode,
            imageIds: imageIds,
            createdBy: userId,
            createdAt: Date()
        )

        let docRef = try db.collection("family_albums").addDocument(from: album)
        return docRef.documentID
    }

    func fetchFamilyAlbum(shareCode: String) async throws -> FamilyAlbum? {
        let snapshot = try await db.collection("family_albums")
            .whereField("share_code", isEqualTo: shareCode)
            .limit(to: 1)
            .getDocuments()

        return snapshot.documents.first.flatMap { try? $0.data(as: FamilyAlbum.self) }
    }

    private func generateShareCode() -> String {
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<8).compactMap { _ in characters.randomElement() })
    }

    // MARK: - Colored Artwork

    func saveColoredArtwork(imageId: String, artworkData: Data) async throws -> String {
        let userId = currentUser?.uid ?? "anonymous"
        let fileName = "\(UUID().uuidString).png"

        // Upload to Storage
        let artworkUrl = try await uploadImage(artworkData, fileName: fileName)

        // Create record in Firestore
        let artwork = ColoredArtwork(
            imageId: imageId,
            userId: userId,
            artworkUrl: artworkUrl,
            createdAt: Date(),
            updatedAt: Date()
        )

        let docRef = try db.collection("colored_artworks").addDocument(from: artwork)
        return docRef.documentID
    }

    func fetchColoredArtworks(imageId: String) async throws -> [ColoredArtwork] {
        let snapshot = try await db.collection("colored_artworks")
            .whereField("image_id", isEqualTo: imageId)
            .order(by: "created_at", descending: true)
            .getDocuments()

        return snapshot.documents.compactMap { document in
            try? document.data(as: ColoredArtwork.self)
        }
    }
}
