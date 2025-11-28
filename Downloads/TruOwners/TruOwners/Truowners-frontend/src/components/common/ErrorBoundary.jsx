import React from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // You can also log the error to an error reporting service here
    // logErrorToMyService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">😔</div>
            <h2>Oops! Something went wrong</h2>
            <p>We encountered an unexpected error. Don't worry, it's not your fault!</p>
            
            <div className="error-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                  if (this.props.onRetry) {
                    this.props.onRetry()
                  }
                }}
              >
                🔄 Try Again
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
              >
                🔃 Reload Page
              </button>
              
              <button 
                className="btn btn-link"
                onClick={() => window.location.href = '/'}
              >
                🏠 Go Home
              </button>
            </div>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
