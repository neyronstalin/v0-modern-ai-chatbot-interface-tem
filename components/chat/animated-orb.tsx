"use client"

import type React from "react"

export function AnimatedOrb({
  className,
  variant = "default",
  size = 32,
}: { className?: string; variant?: "default" | "red"; size?: number }) {
  const colors =
    variant === "red"
      ? {
          bg: "#fef2f2",
          circle1: "#ef4444",
          circle2: "#f87171",
          circle3: "#dc2626",
          circle4: "#fca5a5",
          circle5: "#fb7185",
        }
      : {
          bg: "#cff1f4",
          circle1: "#9e9fef",
          circle2: "#c471ec",
          circle3: "#9bc761",
          circle4: "#ccd4f2",
          circle5: "#f472b6",
        }

  const blurAmount = Math.max(6, size * 0.15)
  const circle1Size = size * 0.45
  const circle2Size = size * 0.35
  const circle3Size = size * 0.5
  const circle4Size = size * 0.25
  const circle5Size = size * 0.3

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        background: colors.bg,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `blur(${blurAmount}px)`,
        }}
      >
        <div
          className="orb-circle-1"
          style={{
            position: "absolute",
            width: circle1Size,
            height: circle1Size,
            borderRadius: "50%",
            background: colors.circle1,
            top: "20%",
            left: "15%",
          }}
        />
        <div
          className="orb-circle-2"
          style={{
            position: "absolute",
            width: circle2Size,
            height: circle2Size,
            borderRadius: "50%",
            background: colors.circle2,
            top: "10%",
            right: "20%",
          }}
        />
        <div
          className="orb-circle-3"
          style={{
            position: "absolute",
            width: circle3Size,
            height: circle3Size,
            borderRadius: "50%",
            background: colors.circle3,
            bottom: "15%",
            left: "25%",
          }}
        />
        <div
          className="orb-circle-4"
          style={{
            position: "absolute",
            width: circle4Size,
            height: circle4Size,
            borderRadius: "50%",
            background: colors.circle4,
            bottom: "25%",
            right: "15%",
          }}
        />
        <div
          className="orb-circle-2"
          style={{
            position: "absolute",
            width: circle5Size,
            height: circle5Size,
            borderRadius: "50%",
            background: colors.circle5,
            top: "40%",
            left: "40%",
          }}
        />
      </div>
    </div>
  )
}
