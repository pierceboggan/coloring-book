package com.coloringbook.ai.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.coloringbook.ai.data.local.entity.CachedImageEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CachedImageDao {
    @Query("SELECT * FROM cached_images WHERE user_id = :userId ORDER BY created_at DESC")
    fun getImagesByUser(userId: String): Flow<List<CachedImageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(images: List<CachedImageEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(image: CachedImageEntity)

    @Query("DELETE FROM cached_images WHERE id = :imageId")
    suspend fun delete(imageId: String)

    @Query("DELETE FROM cached_images WHERE user_id = :userId")
    suspend fun deleteAllForUser(userId: String)
}
