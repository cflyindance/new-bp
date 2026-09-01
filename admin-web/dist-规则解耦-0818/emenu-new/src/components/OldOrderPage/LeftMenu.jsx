import {
  Box,
  Collapse,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { ExpandLess, ExpandMore } from '@material-ui/icons'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import useSystemConfig from '@/hooks/useSystemConfig'

const useStyles = makeStyles((theme) => {
  const borderRadius = theme.shape.borderRadius
  return {
    LeftMenu: {
      position: 'absolute',
      width: 164,
      minWidth: 188,
      // marginRight: theme.spacing(3),
      [theme.breakpoints.down('xs')]: {
        position: 'static',
        width: '100%',
      },
    },
    menuWrapper: {
      overflowY: 'auto',
      backgroundColor: alpha(theme.palette.common.black, 0.4),
      borderRadius: borderRadius,
      [theme.breakpoints.down('xs')]: {
        height: 'auto',
      },
      '&::-webkit-scrollbar': {
        width: 0,
        height: 0,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.grey.A200,
      },
    },
    groupDivider: {
      margin: theme.spacing(0, 3),
      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
    },
    group: {
      margin: theme.spacing(0, 0, 2, 0),
      padding: theme.spacing(0, 0.5, 0, 2),
      minHeight: 38,
      color: theme.palette.secondary.main,
    },
    groupSelected: {},
    groupDot: {
      // display: 'inline-block',
      width: 14,
      height: 14,
      borderRadius: '50%',
      backgroundColor: theme.palette.primary.main,
    },
    groupText: {
      marginLeft: -7,
      fontSize: 14,
      fontWeight: 600,
      textTransform: 'uppercase',
    },
    categoryWrapper: {
      padding: theme.spacing(0, 0.3, 1, 1),
    },
    category: {
      position: 'relative',
      margin: theme.spacing(0, 0, 3, 0),
      padding: theme.spacing(0, 0, 0, 2),
      minHeight: 38,
      color: theme.palette.secondary.main,
      borderTopLeftRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius / 2,
      borderBottomRightRadius: borderRadius / 2,
      borderRightWidth: 8,
      borderRightStyle: 'solid',
      borderRightColor: 'transparent',
      '&:last-child': {
        marginBottom: theme.spacing(1),
      },
      '&$categorySelected': {
        borderRightColor: '#96272F',
        backgroundColor: '#E3C18A',
        color: 'rgba(0, 0, 0, 0.85)',
      },
      '&$categorySelected:hover': {
        backgroundColor: '#E3C18A',
      },
    },
    categorySelected: {},
    categoryIcon: {
      margin: '6px 8px',
      width: 24,
      height: 24,
      zIndex: 1,
      alignSelf: 'start',
    },
    categoryText: {
      fontSize: 16,
      fontWeight: 600,
      lineHeight: '20px',
      wordWrap: 'break-word',
    },
  }
})

function LeftMenu(props) {
  const { menus: originMenus, setMenus, listGap } = props
  const classes = useStyles()
  const { t } = useTranslation()
  const { getGlobalConfig } = useSystemConfig()
  const isShowGroupName = getGlobalConfig(24)?.open

  const menus = useMemo(() => {
    return originMenus.map((group) => {
      return {
        ...group,
        list: group.list.map((c) => {
          const disabled = ~~c?.list?.filter((d) => !d.hidden)?.length < 1
          return {
            ...c,
            hidden: c.hidden || disabled,
            disabled,
          }
        }),
      }
    })
  }, [originMenus])

  const [active, setActive] = useGlobalState('Active_Menu')
  const [groupIdx, categoryIdx] = active

  // 左侧菜单组展开/折叠
  const toggleGroup = useCallback(
    (gIdx) => {
      return () => {
        const newState = [...menus]
        newState[gIdx].expand = !menus[gIdx].expand
        setMenus(newState)
        if (newState[gIdx].expand) {
          setActive([gIdx, 0])
        }
      }
    },
    [menus, setMenus]
  )
  // 左侧菜单选择
  const selectMenu = useCallback(
    (gIdx, cIdx) => {
      return () => {
        setActive([gIdx, cIdx])
      }
    },
    [setActive]
  )

  return (
    <Grid item className={classes.LeftMenu}>
      <Box
        className={classes.menuWrapper}
        style={{ height: `calc(100vh - ${listGap}px)` }}
      >
        {menus.map((g, i, { length }) => {
          const hiddenGroup =
            g.list.filter((each) => each.hidden)?.length === g.list.length
          return (
            <List key={g.id} hidden={g.hidden || hiddenGroup}>
              <ListItem
                button
                classes={{
                  root: classes.group,
                }}
                selected={groupIdx === i}
                onClick={toggleGroup(i)}
                hidden={!isShowGroupName}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <i
                        className={classes.groupDot}
                        style={{ opacity: groupIdx === i ? 1 : 0 }}
                      />
                      <span className={classes.groupText}>
                        {t(g.id, { ns: 'group' })}
                      </span>
                    </Box>
                  }
                />
                {g.expand ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={g.expand}>
                <List className={classes.categoryWrapper}>
                  {g.list?.map((c, j) => {
                    return (
                      <ListItem
                        key={c.id}
                        button
                        classes={{
                          root: classes.category,
                          selected: classes.categorySelected,
                        }}
                        hidden={c.hidden}
                        disabled={c.disabled}
                        selected={groupIdx === i && categoryIdx === j}
                        onClick={selectMenu(i, j)}
                      >
                        <ListItemText
                          classes={{
                            primary: classes.categoryText,
                          }}
                          primary={t(c.id, { ns: 'category' })}
                        />
                      </ListItem>
                    )
                  })}
                </List>
              </Collapse>
              {i < length - 1 && <Divider className={classes.groupDivider} />}
            </List>
          )
        })}
      </Box>
    </Grid>
  )
}

export default LeftMenu
