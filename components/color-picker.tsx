"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  selectedColor: string
  onColorSelect: (color: string) => void
}

const colors = [
  { name: "yellow", class: "bg-yellow-200 border-yellow-300" },
  { name: "pink", class: "bg-pink-200 border-pink-300" },
  { name: "blue", class: "bg-blue-200 border-blue-300" },
  { name: "green", class: "bg-green-200 border-green-300" },
  { name: "orange", class: "bg-orange-200 border-orange-300" },
  { name: "purple", class: "bg-purple-200 border-purple-300" },
]

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-card rounded-lg border">
      <span className="text-xs md:text-sm font-medium text-muted-foreground mr-1 md:mr-2 flex items-center">
        Color:
      </span>
      <div className="flex gap-1 md:gap-2 flex-wrap">
        {colors.map((color) => (
          <Button
            key={color.name}
            variant="outline"
            size="sm"
            className={cn(
              "w-7 h-7 md:w-8 md:h-8 p-0 border-2 touch-manipulation",
              color.class,
              selectedColor === color.name && "ring-2 ring-accent",
            )}
            onClick={() => onColorSelect(color.name)}
          />
        ))}
      </div>
    </div>
  )
}
