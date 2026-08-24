import { Button, Popover, Slider, Space } from 'antd'
import { ZoomInRounded } from '@material-ui/icons'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { useEmenuViewport } from '@/context/EmenuViewportContext'

const useStyles = makeStyles({
  trigger: {
    minWidth: 44,
    height: 44,
    border: 0,
    borderRadius: 22,
    fontWeight: 600,
  },
  panel: {
    width: 284,
    padding: 8,
  },
  value: {
    marginBottom: 8,
    color: '#333',
    fontWeight: 600,
  },
  presets: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 8,
  },
  reset: {
    width: '100%',
    marginTop: 8,
  },
})

function DisplaySizeControl() {
  const classes = useStyles()
  const { t } = useTranslation()
  const viewport = useEmenuViewport()
  if (!viewport.defaults?.allowGuestResize) return null

  const percent = Math.round(viewport.scale * 100)
  const content = (
    <div className={classes.panel}>
      <div className={classes.value} aria-live="polite">
        {t('TopBar.displaySize', { defaultValue: 'Display size' })} · {percent}%
      </div>
      <div className={classes.presets}>
        {[
          [0.85, t('TopBar.displaySmall', { defaultValue: 'Small' })],
          [1, t('TopBar.displayStandard', { defaultValue: 'Standard' })],
          [1.2, t('TopBar.displayLarge', { defaultValue: 'Large' })],
        ].map(([scale, label]) => (
          <Button
            key={scale}
            type={viewport.scale === scale ? 'primary' : 'default'}
            onClick={() => viewport.setPreset(scale)}
          >
            {label}
          </Button>
        ))}
      </div>
      <Slider
        min={75}
        max={140}
        step={5}
        value={percent}
        aria-valuetext={`${percent}%`}
        onChange={(value) => viewport.setScale(value / 100, 'preset')}
      />
      <Button
        className={classes.reset}
        onClick={viewport.resetToStoreDefault}
      >
        {t('TopBar.displayReset', { defaultValue: 'Restore store default' })}
      </Button>
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <Button
        className={classes.trigger}
        aria-label={`${t('TopBar.displaySize', {
          defaultValue: 'Display size',
        })} ${percent}%`}
      >
        <Space size={4}>
          <ZoomInRounded fontSize="small" />
          {percent}%
        </Space>
      </Button>
    </Popover>
  )
}

export default DisplaySizeControl
