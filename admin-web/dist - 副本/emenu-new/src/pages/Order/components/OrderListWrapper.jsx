import { memo, useMemo, useState, useRef, useEffect } from 'react'
import styles from './OrderListWrapper.module.less'
import OrderMain from '@/components/OrderMain'
import LeftMenu from '@/components/LeftMenu'
import RightContent from '@/components/RightContent'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { cloneDeep } from 'lodash-es'
import { useGlobalState } from '@/hooks/useGlobalState'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import useSystemConfig from '@/hooks/useSystemConfig'

const CONSTANT_CATEGORY_NAME = ['crm-point-item', 'avocado-item-voucher']

const OrderListWrapper = (props) => {
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
  const [rightListCateId, setRightListCateId] = useState(null)
  const [activeMenu, setActiveMenu] = useState({ groupIdx: 0, categoryIdx: 0 })
  const listRef = useRef(null)
  const { t } = useTranslation('dish')
  const [menu, setMenu] = useState([])
  const [, setIsHasHotpot] = useGlobalState('isHasHotpot')
  const { getFinalConfigById } = useSystemConfig()
  const isDisplayDishCode = getFinalConfigById(66)?.open
  const hideSoldOutDish = getFinalConfigById(78)?.open

  useEffect(() => {
    if (!baseMenu?.length) return setMenu([])
    // v-list 不能使用 hidden 进行隐藏，否则需要resetHeight，性能消耗巨大
    const afterSearchMenu = cloneDeep(baseMenu).filter((group) => {
      // 组下所有类
      const groupCategory = group.list
      const afterSearchCategory = groupCategory.filter((category) => {
        // 类下所有菜
        const categoryDishList = category.list
        const afterSearchDishList = categoryDishList.filter((d) => {
          const name = t(d.id, { defaultValue: d.name })
          return keyword
            ? !d.hidden &&
                !(hideSoldOutDish && d.outOfStock) &&
                (name?.toLowerCase()?.includes(keyword?.toLowerCase()) ||
                  (isDisplayDishCode &&
                    d.itemNumber
                      ?.toLowerCase()
                      ?.includes(keyword?.toLowerCase())))
            : !d.hidden && !(hideSoldOutDish && d.outOfStock)
        })
        category.list = afterSearchDishList
        return category.list?.length > 0 && !category.hidden
      })
      group.list = afterSearchCategory
      return group.list?.length > 0 && !group.hidden
    })
    setMenu(afterSearchMenu)
    setActiveMenu({ groupIdx: 0, categoryIdx: 0 })
    listRef.current?.scrollTo(0)
    setRightListCateId(null)
  }, [
    baseMenu,
    setMenu,
    keyword,
    setActiveMenu,
    keyword ? t : null, // 如果keyword有值，则根据语言重新生成菜单
  ])

  const allCateList = useMemo(() => {
    return menu.map((group) => group.list).flat()
  }, [menu])

  useEffect(() => {
    if (allCateList?.length) {
      const hotpotList = allCateList.filter((cate) => {
        const notHiddenItem = cate.list.filter((dish) => !dish.hidden)
        return (
          notHiddenItem.length > 0 &&
          notHiddenItem.every((dish) => dish?.comboList?.length > 0)
        )
      })
      setIsHasHotpot(hotpotList?.length > 0)
    }
  }, [allCateList, setIsHasHotpot])

  const slideLeftMenuIntoView = useMemoizedFn(
    (groupIdx, categoryIdx, rightListCateId) => {
      setActiveMenu({
        groupIdx,
        categoryIdx,
      })
      const cateNav = Array.from(
        document.querySelectorAll('div[data-menu-cate]')
      )
      const leftMenuNav = cateNav.find((navItem) => {
        const cateId = navItem.getAttribute('data-menu-cate')
        return cateId === rightListCateId
      })
      if (leftMenuNav) {
        let { top, height } = leftMenuNav.getBoundingClientRect()
        if (top >= 200 && top <= window.innerHeight - 200) return
        const elCenter = top + height / 2
        const center = window.innerHeight / 2
        document.getElementById('menuNavList').scrollTo({
          top:
            document.getElementById('menuNavList').scrollTop -
            (center - elCenter),
          behavior: 'smooth',
        })
      }
    }
  )

  useEffect(() => {
    if (menu?.length && rightListCateId) {
      let categoryIdx = null
      const groupIdx = menu.findIndex((group) => {
        const { list } = group
        categoryIdx = list?.findIndex(
          (cate) =>
            cate.id ===
            (CONSTANT_CATEGORY_NAME.includes(rightListCateId)
              ? rightListCateId
              : Number(rightListCateId))
        )
        return categoryIdx !== -1
      })
      if (groupIdx !== -1 && categoryIdx !== -1) {
        slideLeftMenuIntoView(groupIdx, categoryIdx, rightListCateId)
      }
    }
  }, [rightListCateId, menu, slideLeftMenuIntoView])

  const { isHideBar } = useIsMemberLogin()

  const headerHeight = useMemo(() => {
    return isHideBar ? 80 : 135
  }, [isHideBar])

  const listGap = useMemo(() => {
    return headerHeight + 20
  }, [headerHeight])

  return (
    <div
      className={styles.headerWrapper}
      style={{ height: `calc(100vh - ${headerHeight}px)` }}
    >
      <OrderMain>
        <LeftMenu
          listGap={listGap}
          menu={menu}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          listRef={listRef}
          allCateList={allCateList}
        />
        <RightContent
          listGap={listGap}
          allCateList={allCateList}
          listRef={listRef}
          setRightListCateId={setRightListCateId}
          keyword={keyword}
          rightListCateId={rightListCateId}
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
      </OrderMain>
    </div>
  )
}

export default memo(OrderListWrapper)
