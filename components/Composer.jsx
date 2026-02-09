"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect, useCallback } from "react"
import { Send, Loader2, Plus, Mic, MicOff, Square, Paperclip, X, Brain } from "lucide-react"
import ComposerActionsPopover from "./ComposerActionsPopover"
import { AnimatedOrb } from "./chat/animated-orb"
import { AudioWaveform } from "./chat/audio-waveform"
import { cls } from "./utils"
import Image from "next/image"

const AI_MODELS = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini", icon: null },
  { id: "openai/gpt-4o", name: "GPT-4o", icon: null },
  { id: "anthropic/claude-sonnet-4", name: "Claude", icon: null },
]

const Composer = forwardRef(function Composer({ onSend, busy, selectedModel, onModelChange }, ref) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [mediaStream, setMediaStream] = useState(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const baseTextRef = useRef("")
  const finalTranscriptsRef = useRef("")
  const modelPickerRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 24
      const minHeight = 24

      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight

      if (scrollHeight <= 12 * lineHeight) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${12 * lineHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event) => {
          let newFinalText = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const transcript = event.results[i][0].transcript
              newFinalText += transcript + " "
            }
          }
          if (newFinalText) {
            finalTranscriptsRef.current += newFinalText
            setValue(baseTextRef.current + finalTranscriptsRef.current)
          }
        }

        recognitionRef.current.onerror = () => {
          setIsRecording(false)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Click outside model picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelPickerRef.current && !modelPickerRef.current.contains(event.target)) {
        setShowModelPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
        setMediaStream(null)
      }
    } else {
      baseTextRef.current = value
      finalTranscriptsRef.current = ""
      recognitionRef.current.start()
      setIsRecording(true)

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setMediaStream(stream)
        })
        .catch(() => {})
    }
  }, [isRecording, value, mediaStream])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
          setTimeout(() => {
            inputRef.current?.focus()
            const length = newValue.length
            inputRef.current?.setSelectionRange(length, length)
          }, 0)
          return newValue
        })
      },
      focus: () => {
        inputRef.current?.focus()
      },
    }),
    [],
  )

  async function handleSend() {
    if ((!value.trim() && !uploadedImage) || sending || busy) return
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
    setSending(true)
    try {
      await onSend?.(value || "Describe this image", uploadedImage || undefined)
      setValue("")
      setUploadedImage(null)
      baseTextRef.current = ""
      finalTranscriptsRef.current = ""
      inputRef.current?.focus()
      if (inputRef.current) {
        inputRef.current.style.height = "auto"
      }
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }, [])

  const removeImage = useCallback(() => {
    setUploadedImage(null)
  }, [])

  const hasContent = value.trim().length > 0 || uploadedImage
  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0]

  return (
    <div className="border-t border-zinc-200/60 p-4 dark:border-zinc-800">
      <div
        className={cls(
          "composer-intro mx-auto flex flex-col rounded-3xl border bg-zinc-50 shadow-sm dark:bg-zinc-950 transition-all duration-200",
          "max-w-3xl border-zinc-200 dark:border-zinc-800",
        )}
      >
        {/* Image preview */}
        {uploadedImage && (
          <div className="px-4 pt-3">
            <div className="relative inline-block image-bounce">
              <img
                src={uploadedImage}
                alt="Upload preview"
                className="h-20 w-auto rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
              <button
                onClick={removeImage}
                className="absolute -right-2 -top-2 rounded-full bg-zinc-900 p-0.5 text-zinc-100 shadow-md hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Textarea area */}
        <div className="flex-1 px-4 pt-4 pb-2">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isRecording ? "Listening..." : "How can I help you today?"}
            rows={1}
            disabled={busy}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 transition-all duration-200",
              "min-h-[24px] text-left leading-6",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
        </div>

        {/* Recording waveform */}
        {isRecording && (
          <div className="px-4 pb-2">
            <AudioWaveform isRecording={isRecording} stream={mediaStream} />
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <ComposerActionsPopover>
              <button
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Add attachment"
              >
                <Plus className="h-5 w-5" />
              </button>
            </ComposerActionsPopover>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
              title="Attach image"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Model picker */}
            <div className="relative" ref={modelPickerRef}>
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Select AI model"
              >
                <Brain className="h-4 w-4" />
                {currentModel.name}
              </button>
              {showModelPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-zinc-200 bg-zinc-50 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50 overflow-hidden">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange?.(model.id)
                        setShowModelPicker(false)
                      }}
                      className={cls(
                        "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selectedModel === model.id && "bg-zinc-100 dark:bg-zinc-800 font-medium",
                      )}
                    >
                      <Brain className="h-4 w-4 text-zinc-400" />
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleRecording}
              className={cls(
                "inline-flex items-center justify-center rounded-full p-2 transition-colors",
                isRecording
                  ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
              )}
              title="Voice input"
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {busy ? (
              <button
                onClick={() => {
                  // Stop is handled by parent
                }}
                className="relative h-10 w-10 shrink-0 transition-all rounded-full flex items-center justify-center cursor-pointer hover:scale-105"
                aria-label="Stop generating"
              >
                <AnimatedOrb size={40} variant="red" className="absolute inset-0" />
                <Square className="h-4 w-4 relative z-10 text-red-600" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={sending || busy || !hasContent}
                className={cls(
                  "inline-flex shrink-0 items-center justify-center rounded-full p-2.5 transition-colors",
                  hasContent
                    ? "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed",
                )}
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 max-w-3xl px-1 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        AI can make mistakes. Check important info.
      </div>
    </div>
  )
})

export default Composer
