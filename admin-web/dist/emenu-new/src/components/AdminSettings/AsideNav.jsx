import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse,
  makeStyles,
  alpha,
} from '@material-ui/core'
import {
  ExpandLess,
  ExpandMore,
  // SettingsOutlined
} from '@material-ui/icons'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBoolean } from 'ahooks'
import { TableIcon } from '../common/SvgIcons'

const useStyles = makeStyles((theme) => ({
  aside: {
    gridArea: 'aside',
    backgroundColor: '#1A2241',
    padding: theme.spacing(4, 3),
    height: 'calc(100vh - 72px)',
    overflow: 'auto',
  },
  asideLogo: {
    width: '100%',
    // height: '100%',
    marginBottom: theme.spacing(1),
    // marginRight: theme.spacing(1),
    // borderRadius: '50%',
  },
  divider: {
    height: 2,
    margin: theme.spacing(2, 0),
    borderRadius: 2,
    background: alpha(theme.palette.common.white, 0.05),
  },
  tab: {
    margin: theme.spacing(0, 0, 2, 0),
    padding: theme.spacing(0, 0, 0, 1),
    minHeight: 38,
    color: theme.palette.common.white,
    opacity: 0.5,
    '&$tabSelected': {
      opacity: 1,
      backgroundColor: 'transparent',
    },
    '&$tabSelected:hover': {
      backgroundColor: 'transparent',
    },
  },
  tabSelected: {},
  tabText: {
    margin: theme.spacing(0, 0, 0, 1),
    fontSize: 18,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  tabWrapper: {
    padding: theme.spacing(0, 0, 1, 3),
  },
  tabNest: {
    margin: theme.spacing(0, 0, 1, 0),
    padding: theme.spacing(0, 0, 0, 1.5),
    minHeight: 35,
    fontWeight: 600,
    opacity: 0.5,
    color: theme.palette.common.white,
    borderRadius: 2,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: 'transparent',
    '&$tabNestSelected': {
      opacity: 1,
      borderLeftColor: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.common.white, 0.05),
    },
    '&$tabNestSelected:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.05),
    },
  },
  tabNestSelected: {},
}))

function AsideNav({
  areas,
  activeArea,
  setActiveArea,
  // activeSetting,
  setActiveSetting,
}) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [openArea, { toggle: toggleArea }] = useBoolean(true)
  // const [openSetting, { toggle: toggleSetting }] = useBoolean(true)

  // 左侧菜单选择
  const selectTab = (t, v) => () => {
    if (t === 'table') {
      setActiveSetting(-1)
      setActiveArea(v)
    } else if (t === 'setting') {
      setActiveArea(-1)
      setActiveSetting(v)
    }
  }

  return (
    <Box component="aside" className={classes.aside}>
      <Box>
        {/*<img*/}
        {/*  src={logo ? serverUrl + logo : ''}*/}
        {/*  alt=""*/}
        {/*  className={classes.asideLogo}*/}
        {/*/>*/}
        <Box color="common.white">
          {/* <Typography
              variant="subtitle2"
              color="inherit"
              style={{ fontSize: 16 }}
            >
              {name}
            </Typography> */}
          {/*<Typography variant="body2" color="inherit" style={{ fontSize: 12 }}>*/}
          {/*  {[city, state].filter(Boolean).join(', ')}*/}
          {/*</Typography>*/}
        </Box>
      </Box>
      <Divider className={classes.divider} />

      <List component="nav" className={classes.tabs}>
        <ListItem
          button
          classes={{
            root: classes.tab,
            selected: classes.tabSelected,
          }}
          onClick={toggleArea}
          selected={openArea}
        >
          <TableIcon />
          <ListItemText
            classes={{
              primary: classes.tabText,
            }}
            primary={t('AdminSetting.left_table')}
          />
          {openArea ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={openArea}>
          <List className={classes.tabWrapper}>
            {areas.map((e, i) => (
              <ListItem
                key={e.id}
                button
                classes={{
                  root: classes.tabNest,
                  selected: classes.tabNestSelected,
                }}
                selected={i === activeArea}
                onClick={selectTab('table', i)}
              >
                <ListItemText primary={e.name} />
              </ListItem>
            ))}
          </List>
        </Collapse>
        {/* <ListItem
          button
          classes={{
            root: classes.tab,
            selected: classes.tabSelected,
          }}
          onClick={toggleSetting}
          selected={openSetting}
        >
          <SettingsOutlined />
          <ListItemText
            classes={{
              primary: classes.tabText,
            }}
            primary={t('AdminSetting.left_setting')}
          />
          {openSetting ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={openSetting}>
          <List className={classes.tabWrapper}>
            <ListItem
              button
              classes={{
                root: classes.tabNest,
                selected: classes.tabNestSelected,
              }}
              selected={0 === activeSetting}
              onClick={selectTab('setting', 0)}
            >
              <ListItemText primary={t('AdminSetting.setting_menu_display')} />
            </ListItem>
            <ListItem
              button
              classes={{
                root: classes.tabNest,
                selected: classes.tabNestSelected,
              }}
              selected={1 === activeSetting}
              onClick={selectTab('setting', 1)}
            >
              <ListItemText primary={t('AdminSetting.setting_order_limit')} />
            </ListItem>
          </List>
        </Collapse> */}
      </List>
    </Box>
  )
}

export default memo(AsideNav)
