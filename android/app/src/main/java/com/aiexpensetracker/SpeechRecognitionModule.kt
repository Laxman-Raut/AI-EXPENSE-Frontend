package com.aiexpensetracker

import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

class SpeechRecognitionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener, RecognitionListener {

    private var speechRecognizer: SpeechRecognizer? = null

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String {
        return "SpeechRecognitionModule"
    }

    private fun getSpeechRecognizer(): SpeechRecognizer {
        if (speechRecognizer == null) {
            var useGoogleService = false
            try {
                val pm = reactContext.packageManager
                val intent = Intent("android.speech.RecognitionService")
                val services = pm.queryIntentServices(intent, 0)
                for (ri in services) {
                    if (ri.serviceInfo.packageName == "com.google.android.googlequicksearchbox") {
                        useGoogleService = true
                        break
                    }
                }
            } catch (e: Exception) {
                // Fail-safe
            }

            if (useGoogleService) {
                try {
                    val serviceComponent = ComponentName(
                        "com.google.android.googlequicksearchbox",
                        "com.google.android.voicesearch.service.SpeechRecognitionService"
                    )
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext, serviceComponent)
                } catch (e: Exception) {
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                }
            } else {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
            }
            speechRecognizer?.setRecognitionListener(this)
        }
        return speechRecognizer!!
    }

    @ReactMethod
    fun startListening() {
        UiThreadUtil.runOnUiThread {
            try {
                speechRecognizer?.cancel()
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toString())
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                }
                getSpeechRecognizer().startListening(intent)
            } catch (e: Exception) {
                sendEvent("onSpeechError", Arguments.createMap().apply {
                    putString("message", e.message ?: "Unknown error starting listening")
                })
            }
        }
    }

    @ReactMethod
    fun stopListening() {
        UiThreadUtil.runOnUiThread {
            try {
                speechRecognizer?.stopListening()
            } catch (e: Exception) {
                sendEvent("onSpeechError", Arguments.createMap().apply {
                    putString("message", e.message ?: "Unknown error stopping listening")
                })
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RCTDeviceEventEmitter compatibility in NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // Required for RCTDeviceEventEmitter compatibility in NativeEventEmitter
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (reactContext.hasActiveReactInstance()) {
            try {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)
            } catch (e: Exception) {
                // Fail-safe if JS is not ready to receive events
            }
        }
    }

    // LifecycleEventListener implementation
    override fun onHostResume() {
        // No-op
    }

    override fun onHostPause() {
        UiThreadUtil.runOnUiThread {
            speechRecognizer?.cancel()
        }
    }

    override fun onHostDestroy() {
        UiThreadUtil.runOnUiThread {
            speechRecognizer?.let {
                it.destroy()
                speechRecognizer = null
            }
        }
        reactContext.removeLifecycleEventListener(this)
    }

    // RecognitionListener implementation
    override fun onReadyForSpeech(params: Bundle?) {}

    override fun onBeginningOfSpeech() {
        sendEvent("onSpeechStart", null)
    }

    override fun onRmsChanged(rmsdB: Float) {
        // Option to send audio level changes for visual feedback
    }

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        sendEvent("onSpeechEnd", null)
    }

    override fun onError(error: Int) {
        val errorMessage = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech match found"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognition service is busy"
            SpeechRecognizer.ERROR_SERVER -> "Server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input detected"
            else -> "Unknown error"
        }
        val params = Arguments.createMap().apply {
            putInt("code", error)
            putString("message", errorMessage)
        }
        sendEvent("onSpeechError", params)
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val params = Arguments.createMap().apply {
                putString("text", matches[0])
            }
            sendEvent("onSpeechResults", params)
        }
    }

    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val params = Arguments.createMap().apply {
                putString("text", matches[0])
            }
            sendEvent("onSpeechPartialResults", params)
        }
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}
}
