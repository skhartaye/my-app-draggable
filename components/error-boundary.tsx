"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo)
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined })
    }

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback
            return <FallbackComponent error={this.state.error} resetError={this.resetError} />
        }

        return this.props.children
    }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg border p-6 shadow-lg max-w-md w-full text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
                <p className="text-muted-foreground mb-4">
                    {error?.message || "An unexpected error occurred while loading your notes."}
                </p>
                <Button onClick={resetError} className="flex items-center gap-2 mx-auto">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            </div>
        </div>
    )
}