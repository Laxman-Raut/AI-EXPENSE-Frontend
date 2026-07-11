package com.frontend

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ShareIntentModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        companionReactContext = reactContext
    }

    override fun getName(): String {
        return "ShareIntentModule"
    }

    @ReactMethod
    fun getInitialShare(promise: Promise) {
        promise.resolve(sharedUri)
        sharedUri = null // Clear it once consumed
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RCTDeviceEventEmitter compatibility in NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // Required for RCTDeviceEventEmitter compatibility in NativeEventEmitter
    }

    companion object {
        private var companionReactContext: ReactApplicationContext? = null
        private var sharedUri: String? = null

        fun sendShareIntent(uri: String) {
            sharedUri = uri
            val context = companionReactContext
            if (context != null && context.hasActiveReactInstance()) {
                try {
                    context
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onShareIntent", uri)
                } catch (e: Exception) {
                    // Fail-safe if React Context is not fully ready to emit events
                }
            }
        }
    }
}
