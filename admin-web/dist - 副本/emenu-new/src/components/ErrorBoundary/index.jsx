import { Button, Typography } from '@material-ui/core'
import LoadingOverlay from '../common/LoadingOverlay'

const loadResource = (src, onError, onSuccess) => {
  if (src.endsWith('.js')) {
    const script = document.createElement('script')
    script.async = true
    script.src = src
    script.onerror = () => {
      onError?.()
    }
    script.onload = () => {
      onSuccess?.()
    }
    document.head.appendChild(script)
  } else if (src.endsWith('.css')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = src
    link.onerror = () => {
      onError?.()
    }
    link.onload = () => {
      onSuccess?.()
    }
    document.head.appendChild(link)
  }
}

const ErrorBoundary = (props) => {
  const { error } = props
  console.error(error)
  if (
    error instanceof Error &&
    (error.message.includes('Unable to preload CSS for') ||
      error.message.includes('Failed to fetch dynamically imported module'))
  ) {
    const match = error.message.match(
      /https?:\/\/[^\s'"]+|\/[^ \n'"]+\.(css|js)/
    )
    const src = match?.[0] || null
    if (src) {
      const onRefreshPage = () => {
        window.location.replace('/kpos/emenu')
      }
      let tryTime = 0
      const onRefreshResource = () => {
        setTimeout(() => {
          if (tryTime < 2) {
            tryTime++
            loadResource(src, onRefreshResource, onRefreshPage)
          } else {
            onRefreshPage()
          }
        }, 10 * 1000)
      }
      onRefreshResource()
      return (
        <LoadingOverlay loading={true}>
          <div
            style={{
              paddingTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Typography>
              The system is currently updating. Please wait a moment.
            </Typography>
            <Button
              variant="contained"
              style={{
                textTransform: 'none',
                backgroundColor: '#96272F',
                color: '#fff',
              }}
              onClick={onRefreshPage}
            >
              Refresh now
            </Button>
          </div>
        </LoadingOverlay>
      )
    }
  }

  return (
    <div
      role="alert"
      style={{
        padding: 16,
      }}
    >
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}

export default ErrorBoundary
