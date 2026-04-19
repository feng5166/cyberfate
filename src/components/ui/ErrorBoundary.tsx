'use client'
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-[#1C1A16] rounded-full" />
            <p className="text-sm text-[#6B7280]">页面加载出错，请刷新重试</p>
          </div>
        )
      )
    }
    return this.props.children
  }
}

export function SuspenseFallback({ fallback }: { fallback?: React.ReactNode }) {
  return (
    <>
      {fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-[#1C1A16] rounded-full" />
        </div>
      )}
    </>
  )
}
