import { memo } from 'react'
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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSystemConfig from '@/hooks/useSystemConfig'
import virtualListData from '@/utils/virtualListData'
import { useMemoizedFn } from 'ahooks'
import { serverUrl } from '@/utils/env_var'

const useStyles = makeStyles((theme) => {
  const borderRadius = theme.shape.borderRadius
  return {
    LeftMenu: {
      position: 'absolute',
      width: 164,
      minWidth: 188,
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
    groupDot: {
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
    },
    categorySelected: {
      borderRightColor: '#96272F',
      backgroundColor: '#E3C18A',
      color: 'rgba(0, 0, 0, 0.85)',
      '&:hover': {
        backgroundColor: '#E3C18A',
      },
    },
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

const LeftMenu = (props) => {
  const classes = useStyles()
  const { t } = useTranslation()
  const { menu, activeMenu, setActiveMenu, listRef, allCateList, listGap } =
    props
  const [sortedMenu, setSortedMenu] = useState([])
  const { getGlobalConfig } = useSystemConfig()
  const isShowGroupName = getGlobalConfig(24)?.open
  const isShowCategoryName = getGlobalConfig(25)?.open

  // 品类模式在瀑布流模式下 切换品类后滑动到顶点
  useEffect(() => {
    if (menu?.length > 0 && listRef.current) {
      listRef.current.scrollTo(0)
    }
  }, [menu, listRef])

  useEffect(() => {
    if (menu?.length) {
      const afterSortMenu = menu.map((group) => {
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
          // 不展示类名称时， 默认折叠所有组类
          expand: isShowCategoryName ? group.expand : false,
        }
      })
      setSortedMenu(afterSortMenu)
      return
    }
    setSortedMenu([])
  }, [menu, setSortedMenu, isShowCategoryName])

  const { groupIdx, categoryIdx } = useMemo(() => {
    return activeMenu
  }, [activeMenu])

  // 左侧菜单组展开/折叠
  const toggleGroup = useMemoizedFn((i) => {
    return () => {
      const newSortedMenu = sortedMenu.map((group, idx) => {
        return idx === i
          ? {
              ...group,
              // 不展示菜类时，点击组直接跳转
              expand: isShowCategoryName ? !group.expand : true,
            }
          : group
      })
      setSortedMenu(newSortedMenu)
      if (newSortedMenu[i].expand) {
        selectMenu(i, 0)()
      }
    }
  })

  // 左侧菜单选择
  const selectMenu = useMemoizedFn((groupIdx, categoryIdx) => {
    return () => {
      setActiveMenu({
        groupIdx,
        categoryIdx,
      })
      const selectedCate = sortedMenu[groupIdx]?.list?.[categoryIdx]
      const cateListWithValidDish = virtualListData(allCateList)
      const idx = cateListWithValidDish.findIndex(
        (cate) => cate.id === selectedCate.id
      )
      if (idx !== -1) {
        let height = 0
        for (let i = 0; i < idx; i++) {
          const { type, isHotPot, isLargeRow } = cateListWithValidDish[i]
          if (type === 'cateText') {
            height += 48
          } else if (type === 'cateList') {
            height += isLargeRow ? 400 : 310
          }
          if (isHotPot) {
            height += window.innerHeight - listGap
          }
        }
        listRef.current?.scrollTo(height)
      }
    }
  })
  return (
    <Grid item className={classes.LeftMenu}>
      <Box
        className={classes.menuWrapper}
        id="menuNavList"
        style={{ height: `calc(100vh - ${listGap}px)` }}
      >
        {sortedMenu.map((g, i, { length }) => {
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
                {isShowCategoryName ? (
                  g.expand ? (
                    <ExpandLess />
                  ) : (
                    <ExpandMore />
                  )
                ) : null}
              </ListItem>
              {isShowCategoryName && (
                <Collapse in={g.expand}>
                  <List className={classes.categoryWrapper}>
                    {g.list?.map((c, j) => {
                      return (
                        <ListItem
                          key={c.id}
                          button
                          classes={{
                            root: classes.category,
                          }}
                          className={
                            groupIdx === i && categoryIdx === j
                              ? classes.categorySelected
                              : null
                          }
                          hidden={c.hidden}
                          disabled={c.disabled}
                          onClick={selectMenu(i, j)}
                          data-menu-cate={c.id}
                        >
                          {c.icon ? (
                            <img
                              style={{ width: 32, height: 32 }}
                              alt={c.name || ''}
                              src={serverUrl + c.icon}
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            ''
                          )}
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
              )}

              {i < length - 1 && <Divider className={classes.groupDivider} />}
            </List>
          )
        })}
      </Box>
    </Grid>
  )
}

export default memo(LeftMenu)
