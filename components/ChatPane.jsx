"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from "react"
import { Pencil, RefreshCw, Check, X, Square, User } from "lucide-react"
import { MarkdownRenderer } from "./chat/markdown-renderer"
import { AnimatedOrb } from "./chat/animated-orb"
import { TypingIndicator } from "./chat/typing-indicator"
import Composer from "./Composer"
import { cls, timeAgo } from "./utils"
import Image from "next/image"

function MessageBubble({ message, isStreaming = false, onEdit, onResend }) {
  const isUser = message.role === "user"

  return (
    <div className={cls("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 shrink-0">
          <AnimatedOrb size={28} />
        </div>
      )}
      <div className={cls("flex flex-col", isUser ? "items-end" : "items-start", "max-w-[80%]")}>
        <div
          className={cls(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
            isUser
              ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 user-message-enter"
              : "bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800",
          )}
        >
          {message.imageData && (
            <div className="mb-2 overflow-hidden rounded-lg">
              <img
                src={message.imageData}
                alt="Uploaded"
                className="max-h-48 w-auto rounded-lg"
              />
            </div>
          )}
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
          <span>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
          {isUser && onEdit && (
            <>
              <button className="inline-flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300" onClick={() => onEdit(message)}>
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button className="inline-flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300" onClick={() => onResend(message.id)}>
                <RefreshCw className="h-3 w-3" /> Resend
              </button>
            </>
          )}
        </div>
      </div>
      {isUser && (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
          JD
        </div>
      )}
    </div>
  )
}

const ChatPane = forwardRef(function ChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking, selectedModel, onModelChange },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const composerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const rafRef = useRef(null)
  const lastScrollRef = useRef(0)

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
    }),
    [],
  )

  // Auto-scroll on new messages
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    container.scrollTop = container.scrollHeight
    setAutoScroll(true)
  }, [conversation?.messages?.length])

  // Smooth scroll during streaming
  useEffect(() => {
    if (!isThinking || !autoScroll || !containerRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const container = containerRef.current
    lastScrollRef.current = container.scrollTop

    const smoothScroll = () => {
      if (!container) return
      const { scrollHeight, clientHeight } = container
      const targetScroll = scrollHeight - clientHeight
      const currentScroll = lastScrollRef.current
      const diff = targetScroll - currentScroll
      if (diff > 0.5) {
        const newScroll = currentScroll + diff * 0.03
        lastScrollRef.current = newScroll
        container.scrollTop = newScroll
      }
      rafRef.current = requestAnimationFrame(smoothScroll)
    }

    rafRef.current = requestAnimationFrame(smoothScroll)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isThinking, autoScroll])

  const handleScroll = () => {
    if (!containerRef.current || isThinking) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150
    setAutoScroll(isAtBottom)
  }

  if (!conversation) return null

  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

  const lastMessage = messages[messages.length - 1]
  const showTypingIndicator =
    isThinking &&
    (messages.length === 0 ||
      lastMessage?.role === "user" ||
      (lastMessage?.role === "assistant" && lastMessage?.content === ""))

  // Determine if the last assistant message is currently being streamed
  const streamingMessageId =
    isThinking && lastMessage?.role === "assistant" && lastMessage?.content !== ""
      ? lastMessage.id
      : null

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 && !isThinking ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6">
            <div className="orb-intro">
              <AnimatedOrb size={80} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {conversation.title === "New Chat" ? "Hi, how can I help?" : conversation.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Send a message to start chatting with the AI assistant
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2">
              <span className="block text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{conversation.title}</span>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Updated {timeAgo(conversation.updatedAt)} -- {count} messages
              </div>
            </div>

            {messages
              .filter((message) => {
                if (isThinking && message.role === "assistant" && message === lastMessage && message.content === "") {
                  return false
                }
                return true
              })
              .map((m) => (
                <div key={m.id} className="space-y-2">
                  {editingId === m.id ? (
                    <div className={cls("rounded-2xl border p-2", "border-zinc-200 dark:border-zinc-800")}>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                        rows={3}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={saveAndResend}
                          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MessageBubble
                      message={m}
                      isStreaming={m.id === streamingMessageId}
                      onEdit={m.role === "user" ? startEdit : undefined}
                      onResend={m.role === "user" ? (id) => onResendMessage?.(id) : undefined}
                    />
                  )}
                </div>
              ))}

            {showTypingIndicator && <TypingIndicator />}

            {isThinking && onPauseThinking && (
              <div className="flex justify-center">
                <button
                  onClick={onPauseThinking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <Square className="h-3 w-3" /> Stop generating
                </button>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      <Composer
        ref={composerRef}
        onSend={async (text, imageData) => {
          if (!text.trim() && !imageData) return
          await onSend?.(text, imageData)
        }}
        busy={isThinking}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    </div>
  )
})

export default ChatPane
