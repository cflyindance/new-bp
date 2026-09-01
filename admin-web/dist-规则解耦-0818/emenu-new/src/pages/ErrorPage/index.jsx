import { useRouteError } from 'react-router-dom'
import { Container, Typography } from '@material-ui/core'

function ErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <Container maxWidth="lg">
      <Typography variant="h3">{error.statusText}</Typography>
      <Typography variant="body1">{error.message}</Typography>
    </Container>
  )
}

export default ErrorPage
