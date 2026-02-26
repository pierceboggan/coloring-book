package com.coloringbook.ai.service

import android.util.Log
import com.coloringbook.ai.data.model.ColoredArtwork
import com.coloringbook.ai.data.model.ColoringImage
import com.coloringbook.ai.data.model.FamilyAlbum
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseService @Inject constructor(
    private val client: SupabaseClient,
) {
    private val TAG = "SupabaseService"

    val auth: Auth get() = client.auth

    // ── Auth ──────────────────────────────────────────────

    val currentUserId: String?
        get() = client.auth.currentUserOrNull()?.id

    suspend fun signIn(email: String, password: String) {
        Log.d(TAG, "🚀 Signing in user: $email")
        client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
        Log.d(TAG, "✅ Sign in successful")
    }

    suspend fun signUp(email: String, password: String) {
        Log.d(TAG, "🚀 Signing up user: $email")
        client.auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
        Log.d(TAG, "✅ Sign up successful")
    }

    suspend fun signOut() {
        Log.d(TAG, "🚀 Signing out")
        client.auth.signOut()
        Log.d(TAG, "✅ Signed out")
    }

    suspend fun resetPassword(email: String) {
        Log.d(TAG, "🚀 Sending password reset to $email")
        client.auth.resetPasswordForEmail(email)
    }

    // ── Images ────────────────────────────────────────────

    suspend fun fetchImages(): List<ColoringImage> {
        val userId = currentUserId ?: throw IllegalStateException("Not authenticated")
        Log.d(TAG, "🚀 Fetching images for user: $userId")
        val images = client.postgrest.from("images")
            .select {
                filter { eq("user_id", userId) }
                order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
            }
            .decodeList<ColoringImage>()
        Log.d(TAG, "✅ Fetched ${images.size} images")
        return images
    }

    suspend fun fetchImage(imageId: String): ColoringImage {
        Log.d(TAG, "🚀 Fetching image: $imageId")
        return client.postgrest.from("images")
            .select { filter { eq("id", imageId) } }
            .decodeSingle()
    }

    suspend fun createImageRecord(image: ColoringImage): ColoringImage {
        Log.d(TAG, "🚀 Creating image record: ${image.name}")
        return client.postgrest.from("images")
            .insert(image) { select() }
            .decodeSingle()
    }

    suspend fun deleteImage(imageId: String) {
        Log.d(TAG, "🚀 Deleting image: $imageId")
        client.postgrest.from("images")
            .delete { filter { eq("id", imageId) } }
        Log.d(TAG, "✅ Deleted image")
    }

    suspend fun toggleFavorite(imageId: String, isFavorite: Boolean) {
        Log.d(TAG, "🚀 Setting favorite=$isFavorite for image: $imageId")
        client.postgrest.from("images")
            .update({ set("is_favorite", isFavorite) }) {
                filter { eq("id", imageId) }
            }
    }

    // ── Storage ───────────────────────────────────────────

    suspend fun uploadImage(bucket: String, path: String, data: ByteArray): String {
        Log.d(TAG, "🚀 Uploading to $bucket/$path (${data.size} bytes)")
        client.storage.from(bucket).upload(path, data)
        val url = client.storage.from(bucket).publicUrl(path)
        Log.d(TAG, "✅ Uploaded: $url")
        return url
    }

    // ── Albums ────────────────────────────────────────────

    suspend fun fetchAlbums(): List<FamilyAlbum> {
        val userId = currentUserId ?: throw IllegalStateException("Not authenticated")
        Log.d(TAG, "🚀 Fetching albums for user: $userId")
        val albums = client.postgrest.from("family_albums")
            .select {
                filter { eq("created_by", userId) }
                order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
            }
            .decodeList<FamilyAlbum>()
        Log.d(TAG, "✅ Fetched ${albums.size} albums")
        return albums
    }

    suspend fun createAlbum(album: FamilyAlbum): FamilyAlbum {
        Log.d(TAG, "🚀 Creating album: ${album.name}")
        return client.postgrest.from("family_albums")
            .insert(album) { select() }
            .decodeSingle()
    }

    suspend fun fetchAlbumByShareCode(shareCode: String): FamilyAlbum {
        Log.d(TAG, "🚀 Fetching album by share code: $shareCode")
        return client.postgrest.from("family_albums")
            .select { filter { eq("share_code", shareCode) } }
            .decodeSingle()
    }

    // ── Artwork ───────────────────────────────────────────

    suspend fun saveColoredArtwork(artwork: ColoredArtwork): ColoredArtwork {
        Log.d(TAG, "🚀 Saving artwork for image: ${artwork.imageId}")
        return client.postgrest.from("colored_artworks")
            .insert(artwork) { select() }
            .decodeSingle()
    }

    suspend fun fetchArtworks(imageId: String): List<ColoredArtwork> {
        Log.d(TAG, "🚀 Fetching artworks for image: $imageId")
        return client.postgrest.from("colored_artworks")
            .select { filter { eq("image_id", imageId) } }
            .decodeList()
    }
}
