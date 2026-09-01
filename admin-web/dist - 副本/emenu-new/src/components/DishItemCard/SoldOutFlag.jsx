import { Box } from '@material-ui/core'
import { alpha, withStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'

const brandTextStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  textAlign: 'center',
}

const brandTagStyle = {
  padding: '0 8px',
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '8px',
}

const SoldOutFlag = withStyles((theme) => ({
  mask: ({ size, isBuffetView }) => ({
    position: 'absolute',
    width: '100%',
    height: size === 'small' ? 132 : '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius:
      size === 'small'
        ? 'none'
        : size === 'tiny'
          ? '50%'
          : theme.shape.borderRadius * 2,
    backgroundColor: isBuffetView
      ? 'transparent'
      : alpha(theme.palette.common.black, 0.5),
  }),
  flag: ({ size }) => ({
    marginTop: size === 'large' ? -50 : 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 600,
    borderWidth: size === 'tiny' ? 4 : 6,
    borderStyle: 'solid',
    borderRadius: '50%',
    transform: 'rotate(-20deg)',
    color: alpha(theme.palette.common.white, 0.8),
  }),
  text: {
    padding: '2px 6px',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    color: theme.palette.common.white,
    backgroundColor: '#828282',
    borderRadius: theme.shape.borderRadius * 0.5,
  },
  maskText: {
    color: alpha(theme.palette.common.white, 0.8),
    fontWeight: 600,
  },
}))(({
  variant = 'circle',
  size,
  classes,
  content = 'sold_out',
  isBuffetView = false,
}) => {
  const { t } = useTranslation()
  const width = size === 'tiny' ? 80 : size === 'small' ? 100 : 140
  const fontSize = size === 'tiny' ? 15 : size === 'small' ? 18 : 28
  const renderContent = (
    <div style={isBuffetView ? brandTextStyle : null}>
      {!isBuffetView ? (
        <span> {t(`Order.${content}`)}</span>
      ) : (
        <span style={brandTagStyle}>{content}</span>
      )}
    </div>
  )
  const variantRender = {
    text: <Box className={classes.text}>{renderContent}</Box>,
    circle: (
      <Box className={classes.mask}>
        <Box
          width={width}
          height={width}
          fontSize={fontSize}
          className={classes.flag}
        >
          {renderContent}
        </Box>
      </Box>
    ),
    maskText: (
      <Box className={classes.mask}>
        <Box className={classes.maskText}>{renderContent}</Box>
      </Box>
    ),
  }
  return variantRender[variant]
})

export default memo(SoldOutFlag)
