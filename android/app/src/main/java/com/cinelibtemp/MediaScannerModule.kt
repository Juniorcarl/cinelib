package com.cinelibtemp

import android.content.ContentUris
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MediaScannerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MediaScanner"
    }

    @ReactMethod
    fun scanVideos(promise: Promise) {
        try {
            val videoList = Arguments.createArray()
            
            val projection = arrayOf(
                MediaStore.Video.Media._ID,
                MediaStore.Video.Media.DISPLAY_NAME,
                MediaStore.Video.Media.SIZE,
                MediaStore.Video.Media.DURATION,
                MediaStore.Video.Media.DATA, // Full file path
                MediaStore.Video.Media.BUCKET_DISPLAY_NAME // Folder name
            )

            val collection = MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            val sortOrder = "${MediaStore.Video.Media.DATE_ADDED} DESC"

            val cursor = reactApplicationContext.contentResolver.query(
                collection,
                projection,
                null,
                null,
                sortOrder
            )

            cursor?.use {
                val idColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media._ID)
                val nameColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME)
                val sizeColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE)
                val durationColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.DURATION)
                val pathColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.DATA)
                val folderColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.BUCKET_DISPLAY_NAME)

                while (it.moveToNext()) {
                    val id = it.getLong(idColumn)
                    val name = it.getString(nameColumn) ?: ""
                    val size = it.getLong(sizeColumn)
                    val duration = it.getLong(durationColumn)
                    val path = it.getString(pathColumn) ?: ""
                    val folder = it.getString(folderColumn) ?: ""

                    val videoMap = Arguments.createMap().apply {
                        putInt("id", id.toInt())
                        putString("filename", name)
                        putDouble("sizeBytes", size.toDouble())
                        putDouble("durationMs", duration.toDouble())
                        putString("path", path)
                        putString("folder", folder) // <-- We added folder name!
                    }
                    videoList.pushMap(videoMap)
                }
            }
            
            promise.resolve(videoList)
        } catch (e: Exception) {
            promise.reject("SCAN_ERROR", e)
        }
    }
}