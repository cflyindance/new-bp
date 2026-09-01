import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 60,
    height: 60,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      borderTop: '60px solid #96272f',
      borderLeft: '60px solid transparent',
    },
  },
  text: {
    position: 'absolute',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    transform: 'rotate(45deg)',
    marginLeft: 20,
    marginTop: -20,
    whiteSpace: 'nowrap',
  },
}))

const CornerBadge = (props) => {
  const { text } = props
  const classes = useStyles()

  return (
    <div className={classes.root}>
      <div className={classes.text}>{text}</div>
    </div>
  )
}

export default CornerBadge
