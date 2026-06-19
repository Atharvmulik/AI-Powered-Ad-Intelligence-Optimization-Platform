import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-surface-container border border-error/20 rounded-xl text-center gap-4">
          <span className="material-symbols-outlined text-error text-4xl animate-pulse">gpp_bad</span>
          <div>
            <h3 className="font-title-lg text-title-lg text-on-surface">Component Crashed</h3>
            <p className="text-sm text-on-surface-variant font-mono mt-1 max-w-md overflow-hidden text-ellipsis">
              {this.state.error?.message || 'A rendering error occurred'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20"
          >
            Reload Component
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
