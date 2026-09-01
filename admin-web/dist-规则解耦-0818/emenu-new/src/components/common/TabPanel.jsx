import { forwardRef } from 'react'
import { Box } from '@material-ui/core'

const TabPanel = forwardRef((props, ref) => {
  const { children, value, index, ...other } = props
  return (
    <Box
      ref={ref}
      role="tabpanel"
      height="100%"
      hidden={value !== index}
      {...other}
    >
      {children}
    </Box>
  )
})
TabPanel.displayName = 'TabPanel'

export default TabPanel
