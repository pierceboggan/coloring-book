package com.coloringbook.ai.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_images")
data class CachedImageEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "user_id") val userId: String,
    @ColumnInfo(name = "original_url") val originalUrl: String,
    @ColumnInfo(name = "coloring_page_url") val coloringPageUrl: String? = null,
    val name: String,
    val status: String,
    @ColumnInfo(name = "created_at") val createdAt: String? = null,
    @ColumnInfo(name = "is_favorite") val isFavorite: Boolean = false,
    @ColumnInfo(name = "local_image_path") val localImagePath: String? = null,
)

@Entity(tableName = "pending_operations")
data class PendingOperationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String, // "upload", "delete", "update", "save_artwork"
    val payload: String, // JSON payload
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis(),
    val retries: Int = 0,
)
