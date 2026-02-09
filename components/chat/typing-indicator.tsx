"use client"

import { AnimatedOrb } from "./animated-orb"

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="mt-0.5">
        <AnimatedOrb size={28} />
      </div>

      <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
        </div>
      </div>
    </div>
  )
}
