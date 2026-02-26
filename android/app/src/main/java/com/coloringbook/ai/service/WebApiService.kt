package com.coloringbook.ai.service

import android.util.Log
import com.coloringbook.ai.BuildConfig
import com.coloringbook.ai.data.model.GenerateColoringPageRequest
import com.coloringbook.ai.data.model.GenerateColoringPageResponse
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.headers
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebApiService @Inject constructor(
    private val supabaseClient: SupabaseClient,
) {
    private val TAG = "WebApiService"
    private val baseUrl = BuildConfig.WEB_API_BASE_URL

    private val httpClient = HttpClient(Android) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }

    private suspend fun getAccessToken(): String? {
        return supabaseClient.auth.currentAccessTokenOrNull()
    }

    suspend fun generateColoringPage(
        imageId: String,
        imageUrl: String,
        age: Int? = null,
    ): GenerateColoringPageResponse {
        Log.d(TAG, "🚀 Generating coloring page for image: $imageId")
        val token = getAccessToken()

        val response = httpClient.post("$baseUrl/api/generate-coloring-page") {
            contentType(ContentType.Application.Json)
            headers {
                token?.let { append("Authorization", "Bearer $it") }
            }
            setBody(GenerateColoringPageRequest(
                imageId = imageId,
                imageUrl = imageUrl,
                age = age,
            ))
        }

        val result = response.body<GenerateColoringPageResponse>()
        if (result.success) {
            Log.d(TAG, "✅ Coloring page generated: ${result.coloringPageUrl}")
        } else {
            Log.e(TAG, "❌ Generation failed: ${result.error}")
        }
        return result
    }
}
