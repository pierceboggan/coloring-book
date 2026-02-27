package com.coloringbook.ai.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class ImageStatus {
    @SerialName("uploading") UPLOADING,
    @SerialName("processing") PROCESSING,
    @SerialName("completed") COMPLETED,
    @SerialName("error") ERROR
}

@Serializable
data class ColoringImage(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("original_url") val originalUrl: String,
    @SerialName("coloring_page_url") val coloringPageUrl: String? = null,
    val name: String,
    val status: ImageStatus = ImageStatus.UPLOADING,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
    @SerialName("error_message") val errorMessage: String? = null,
    @SerialName("variant_urls") val variantUrls: List<String>? = null,
    @SerialName("variant_prompts") val variantPrompts: List<String>? = null,
    @SerialName("is_favorite") val isFavorite: Boolean = false,
    @SerialName("archived_at") val archivedAt: String? = null,
)

@Serializable
data class UserProfile(
    val id: String,
    val email: String,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("photo_url") val photoUrl: String? = null,
    @SerialName("is_kid_mode_enabled") val isKidModeEnabled: Boolean = false,
)

@Serializable
data class FamilyAlbum(
    val id: String,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("created_by") val createdBy: String? = null,
    val name: String,
    val title: String? = null,
    @SerialName("share_code") val shareCode: String,
    @SerialName("image_ids") val imageIds: List<String> = emptyList(),
    @SerialName("comments_enabled") val commentsEnabled: Boolean = true,
    @SerialName("downloads_enabled") val downloadsEnabled: Boolean = true,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
)

@Serializable
data class ColoredArtwork(
    val id: String,
    @SerialName("image_id") val imageId: String,
    @SerialName("user_id") val userId: String,
    @SerialName("artwork_url") val artworkUrl: String,
    @SerialName("thumbnail_url") val thumbnailUrl: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

data class KidModeSettings(
    val isEnabled: Boolean = false,
    val parentCode: String = "1234",
    val allowedImageIds: List<String> = emptyList(),
    val maxColoringTimeMinutes: Int? = null,
)

@Serializable
data class GenerateColoringPageRequest(
    val imageId: String,
    val imageUrl: String,
    val age: Int? = null,
    val provider: String? = null,
)

@Serializable
data class GenerateColoringPageResponse(
    val success: Boolean,
    val coloringPageUrl: String? = null,
    val error: String? = null,
)
