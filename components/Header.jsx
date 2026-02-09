"use client"
import { Asterisk, MoreHorizontal, Menu, ChevronDown, Brain } from "lucide-react"
import { useState } from "react"
import GhostIconButton from "./GhostIconButton"
import { AnimatedOrb } from "./chat/animated-orb"

const AI_MODELS = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "anthropic/claude-sonnet-4", name: "Claude" },
]

export default function Header({ createNewChat, sidebarCollapsed, setSidebarOpen, selectedModel, onModelChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0]

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-zinc-200/60 bg-zinc-50/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="hidden md:flex relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold tracking-tight hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          <AnimatedOrb size={20} />
          {currentModel.name}
          <ChevronDown className="h-4 w-4" />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-zinc-200 bg-zinc-50 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50 overflow-hidden">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange?.(model.id)
                  setIsDropdownOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  selectedModel === model.id ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : ""
                }`}
              >
                <Brain className="h-4 w-4 text-zinc-400" />
                {model.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  )
}
