import { memo, useState, useEffect, useRef } from 'react'
import { Container, Grid } from '@material-ui/core'
import { useGlobalState } from '@/hooks/useGlobalState'
import { makeStyles } from '@material-ui/core/styles'
import LeftMenu from './LeftMenu'
import RightContent from './RightContent'
import { useTranslation } from 'react-i18next'
import { cloneDeep } from 'lodash-es'
import { useMemoizedFn } from 'ahooks'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import useSystemConfig from '@/hooks/useSystemConfig'

const useStyles = makeStyles((theme) => ({
  OrderMain: {
    paddingBottom: theme.spacing(3),
    // backgroundColor: '#1A2241',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: 5,
      height: 5,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.main,
    },
  },
}))

function OrderMain(props) {
  const { t } = useTranslation('dish')
  const [active, setActive] = useGlobalState('Active_Menu')
  const [groupIdx, categoryIdx] = active
  const [menus, setMenus] = useState([])
  const {
    baseMenu,
    keyword,
    onCrmIntegrationRewardClick,
    onCrmIntegrationBenefitSelect,
    crmIntegrationBenefitDisabledOverride,
    onCrmIntegrationPointItemChange,
    onCrmIntegrationPointItemBeforeAdd,
    crmIntegrationPointItemGlobalLocked,
    selectedCrmIntegrationBenefitId,
  } = props
  const classes = useStyles()
  const dishListRef = useRef(null)
  const { getFinalConfigById } = useSystemConfig()
  const isDisplayDishCode = getFinalConfigById(66)?.open
  const hideSoldOutDish = getFinalConfigById(78)?.open

  const checkMenuExpand = useMemoizedFn((newMenus, oldMenus) => {
    if (!oldMenus?.length) return newMenus
    if (!newMenus?.length) return []
    return newMenus.reduce((pre, cur, idx) => {
      // 新菜单组
      const newMenuGroup = newMenus[idx]
      // 新菜单组id
      const newGroupId = newMenuGroup?.id
      const oldMenuGroup = oldMenus.find((each) => each.id === newGroupId)
      if (!oldMenuGroup) return pre.concat(newMenuGroup)
      const finalCategory = {
        ...newMenuGroup,
        expand: oldMenuGroup.expand,
      }
      return pre.concat(finalCategory)
    }, [])
  })

  useEffect(() => {
    if (baseMenu?.length) {
      const gIdx = baseMenu.findIndex(
        (g) => !g.hidden && g.list?.some((c) => c.list?.length)
      )
      const cIdx =
        baseMenu?.[gIdx]?.list?.findIndex((c) => !c.hidden && c.list?.length) ??
        -1
      setActive([gIdx, cIdx])
      setMenus(checkMenuExpand(cloneDeep(baseMenu), menus))
    }
  }, [baseMenu])

  useEffect(() => {
    const newMenus = baseMenu
      ?.filter((g) => !g.hidden)
      ?.map((g) => ({
        ...g,
        list: g.list
          .filter((c) => !c.hidden)
          .map((c) => ({
            ...c,
            list: c.list.filter((d) => {
              const name = t(d.id, { defaultValue: d.name })
              return (
                !d.hidden &&
                !(hideSoldOutDish && d.outOfStock) &&
                (name?.toLowerCase()?.includes(keyword?.toLowerCase()) ||
                  (isDisplayDishCode &&
                    d.itemNumber
                      ?.toLowerCase()
                      ?.includes(keyword?.toLowerCase())))
              )
            }),
          })),
      }))
    setMenus(newMenus)
    const gIdx = newMenus?.findIndex((g) => g.list?.some((c) => c.list?.length))
    const cIdx = newMenus?.[gIdx]?.list?.findIndex((c) => c.list?.length)
    setActive([gIdx > -1 ? gIdx : 0, cIdx > -1 ? cIdx : 0])
  }, [
    baseMenu,
    keyword,
    setActive,
    keyword ? t : null, // 如果keyword有值，则根据语言重新生成菜单
  ])

  useEffect(() => {
    if (dishListRef.current) {
      dishListRef.current.scrollTop = 0
    }
  }, [dishListRef, categoryIdx, groupIdx])

  const { isHideBar } = useIsMemberLogin()
  const listGap = isHideBar ? 108 : 145

  return (
    <Container maxWidth={false} className={classes.OrderMain} ref={dishListRef}>
      <Grid container spacing={3}>
        <LeftMenu listGap={listGap} menus={menus} setMenus={setMenus} />
        <RightContent
          listGap={listGap}
          menus={menus}
          setMenus={setMenus}
          onCrmIntegrationRewardClick={onCrmIntegrationRewardClick}
          onCrmIntegrationBenefitSelect={onCrmIntegrationBenefitSelect}
          crmIntegrationBenefitDisabledOverride={
            crmIntegrationBenefitDisabledOverride
          }
          onCrmIntegrationPointItemChange={onCrmIntegrationPointItemChange}
          onCrmIntegrationPointItemBeforeAdd={
            onCrmIntegrationPointItemBeforeAdd
          }
          crmIntegrationPointItemGlobalLocked={
            crmIntegrationPointItemGlobalLocked
          }
          selectedCrmIntegrationBenefitId={selectedCrmIntegrationBenefitId}
        />
      </Grid>
    </Container>
  )
}

export default memo(OrderMain)
