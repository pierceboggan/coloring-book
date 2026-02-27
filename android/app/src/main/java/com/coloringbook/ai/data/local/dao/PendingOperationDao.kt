package com.coloringbook.ai.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.coloringbook.ai.data.local.entity.PendingOperationEntity

@Dao
interface PendingOperationDao {
    @Query("SELECT * FROM pending_operations ORDER BY created_at ASC")
    suspend fun getAll(): List<PendingOperationEntity>

    @Insert
    suspend fun insert(operation: PendingOperationEntity)

    @Query("DELETE FROM pending_operations WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("UPDATE pending_operations SET retries = retries + 1 WHERE id = :id")
    suspend fun incrementRetries(id: Long)

    @Query("DELETE FROM pending_operations WHERE retries >= :maxRetries")
    suspend fun deleteFailedOperations(maxRetries: Int = 5)
}
