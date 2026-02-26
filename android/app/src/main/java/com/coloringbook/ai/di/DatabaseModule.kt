package com.coloringbook.ai.di

import android.content.Context
import androidx.room.Room
import com.coloringbook.ai.data.local.AppDatabase
import com.coloringbook.ai.data.local.dao.CachedImageDao
import com.coloringbook.ai.data.local.dao.PendingOperationDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "coloringbook-db",
        ).build()
    }

    @Provides
    fun provideCachedImageDao(database: AppDatabase): CachedImageDao {
        return database.cachedImageDao()
    }

    @Provides
    fun providePendingOperationDao(database: AppDatabase): PendingOperationDao {
        return database.pendingOperationDao()
    }
}
