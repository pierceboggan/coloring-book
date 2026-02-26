package com.coloringbook.ai.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.coloringbook.ai.data.local.dao.CachedImageDao
import com.coloringbook.ai.data.local.dao.PendingOperationDao
import com.coloringbook.ai.data.local.entity.CachedImageEntity
import com.coloringbook.ai.data.local.entity.PendingOperationEntity

@Database(
    entities = [CachedImageEntity::class, PendingOperationEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun cachedImageDao(): CachedImageDao
    abstract fun pendingOperationDao(): PendingOperationDao
}
