import { makeStyles } from '@material-ui/core'
import { useEmenuProThemeAdapter } from './EmenuProTheme'

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wrapper: {
    '& *': {
      pointerEvents: 'auto',
    },
  },
}))

const GlobalComponentsWrapper = ({ children }) => {
  const classes = useStyles()
  const themeStyles = useEmenuProThemeAdapter({ width: '100%', height: '100%' })

  return (
    <div className={classes.root}>
      <div
        className={classes.wrapper}
        style={{ ...themeStyles, position: 'relative', flex: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

export default GlobalComponentsWrapper
