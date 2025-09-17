"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react"
import type { Note } from "@/hooks/use-realtime-notes"

interface ViewportNavigatorProps {
    notes: Note[]
    onViewportChange: (transform: { scale: number; translateX: number; translateY: number }) => void
}

export function ViewportNavigator({ notes, onViewportChange }: ViewportNavigatorProps) {
    const [scale, setScale] = useState(1)
    const [translateX, setTranslateX] = useState(0)
    const [translateY, setTranslateY] = useState(0)

    useEffect(() => {
        onViewportChange({ scale, translateX, translateY })
    }, [scale, translateX, translateY, onViewportChange])

    const handleZoomIn = () => {
        const newScale = Math.min(scale * 1.2, 3)
        setScale(newScale)
    }

    const handleZoomOut = () => {
        const newScale = Math.max(scale / 1.2, 0.3)
        setScale(newScale)
    }

    const handleReset = () => {
        setScale(1)
        setTranslateX(0)
        setTranslateY(0)
    }

    const handleFitAll = useCallback(() => {
        if (notes.length === 0) return

        const padding = 50
        const noteWidth = window.innerWidth < 768 ? 160 : 192
        const noteHeight = window.innerWidth < 768 ? 160 : 192

        // Calculate bounding box of all notes
        const minX = Math.min(...notes.map(note => note.x)) - padding
        const maxX = Math.max(...notes.map(note => note.x + noteWidth)) + padding
        const minY = Math.min(...notes.map(note => note.y)) - padding
        const maxY = Math.max(...notes.map(note => note.y + noteHeight)) + padding

        const contentWidth = maxX - minX
        const contentHeight = maxY - minY

        // Calculate scale to fit all notes
        const scaleX = window.innerWidth / contentWidth
        const scaleY = window.innerHeight / contentHeight
        const newScale = Math.min(scaleX, scaleY, 1) * 0.9 // 90% to add some margin

        // Calculate translation to center the content
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        const viewportCenterX = window.innerWidth / 2
        const viewportCenterY = window.innerHeight / 2

        const newTranslateX = (viewportCenterX - centerX * newScale)
        const newTranslateY = (viewportCenterY - centerY * newScale)

        setScale(newScale)
        setTranslateX(newTranslateX)
        setTranslateY(newTranslateY)
    }, [notes])

    // Listen for fit all event from keyboard shortcut
    useEffect(() => {
        const handleFitAllEvent = () => {
            handleFitAll()
        }

        window.addEventListener('fitAllNotes', handleFitAllEvent)
        return () => window.removeEventListener('fitAllNotes', handleFitAllEvent)
    }, [handleFitAll])



    return (
        <div className="fixed bottom-2 left-2 md:bottom-4 md:left-4 z-40 flex flex-col gap-2">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg border p-2 shadow-lg">
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                        <Button
                            onClick={handleZoomIn}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Zoom in"
                            disabled={scale >= 3}
                        >
                            <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button
                            onClick={handleZoomOut}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Zoom out"
                            disabled={scale <= 0.3}
                        >
                            <ZoomOut className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="flex gap-1">
                        <Button
                            onClick={handleFitAll}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Fit all notes"
                            disabled={notes.length === 0}
                        >
                            <Maximize2 className="h-3 w-3" />
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Reset view"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-card/95 backdrop-blur-sm rounded-lg border p-2 shadow-lg">
                <div className="text-xs text-muted-foreground text-center">
                    <div>Zoom: {Math.round(scale * 100)}%</div>
                    <div className="text-xs mt-1">
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Scroll</kbd> to zoom
                    </div>
                </div>
            </div>
        </div>
    )
}