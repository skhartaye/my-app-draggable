"use client"

import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-muted rounded", className)} />
  )
}

export function NotesLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background canvas-grid relative overflow-hidden">
      {/* Header skeleton */}
      <div className="fixed top-2 left-2 md:top-4 md:left-4 z-50 flex flex-col gap-2 md:gap-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border p-3 md:p-4 shadow-lg max-w-[calc(100vw-1rem)] md:max-w-none">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <LoadingSkeleton className="h-6 w-32" />
            <div className="flex items-center gap-2">
              <LoadingSkeleton className="h-4 w-4 rounded-full" />
              <LoadingSkeleton className="h-4 w-12" />
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 p-2 bg-card rounded-lg border">
              <LoadingSkeleton className="h-4 w-12" />
              <div className="flex gap-1 md:gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="w-7 h-7 md:w-8 md:h-8 rounded" />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <LoadingSkeleton className="h-9 w-24 rounded-md" />
              <LoadingSkeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
        
        <div className="bg-muted/80 backdrop-blur-sm rounded-lg border p-3 md:p-4 max-w-[calc(100vw-1rem)] md:max-w-xs">
          <LoadingSkeleton className="h-4 w-full mb-2" />
          <LoadingSkeleton className="h-4 w-3/4 mb-2" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      {/* Sample note skeletons */}
      <div className="absolute inset-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-40 h-40 md:w-48 md:h-48 p-3 md:p-4 border-2 rounded-lg bg-yellow-200 border-yellow-300"
            style={{ 
              left: 100 + i * 220, 
              top: 150 + i * 50 
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <LoadingSkeleton className="h-6 w-6 rounded" />
              <LoadingSkeleton className="h-6 w-6 rounded" />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="h-3 w-full" />
              <LoadingSkeleton className="h-3 w-3/4" />
              <LoadingSkeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}