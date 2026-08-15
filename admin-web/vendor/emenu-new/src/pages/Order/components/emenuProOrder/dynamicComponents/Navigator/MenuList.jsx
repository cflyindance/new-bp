import { ButtonBase, makeStyles } from '@material-ui/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEmenuProThemeAdapter } from '../../components/EmenuProTheme'
import { useTranslation } from 'react-i18next'
import { useSwiper } from '../../components/SwiperProvider'

const useStyles = makeStyles(() => ({
  item: {
    textAlign: 'left',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
  },
}))

const MenuList = ({ config, categoryList }) => {
  const { style } = config

  const themeStyles = useEmenuProThemeAdapter(style, {
    exclude: ['visibility'],
  })

  const menuItemConfig = useMemo(
    () =>
      config.children?.find((component) => component.component === 'MenuItem'),
    [config]
  )
  const backgroundColor = useMemo(
    () => menuItemConfig?.style?.backgroundColor,
    [menuItemConfig]
  )

  const [activeIndex, setActiveIndex] = useState()

  const swiper = useSwiper()

  const onClick = (pageIndex) => () => {
    // 消除白屏
    // todo 可以用插入一页slide的方式消除白屏，但是需要考虑删除插入的页，以及用户手动中断时候activeIndex的更新
    if (swiper) {
      const activeIndex = swiper.activeIndex
      const diff = pageIndex - activeIndex
      const slidesAfter = swiper.virtual.slidesAfter
      const slidesBefore = swiper.virtual.slidesBefore
      setActiveIndex(pageIndex)
      if (diff > 0 && diff > slidesAfter) {
        const index = pageIndex - slidesBefore
        swiper.slideTo(index, 0)
        swiper.slideTo(pageIndex)
      } else if (diff < 0 && diff < -slidesBefore) {
        const index = pageIndex + slidesAfter
        swiper.slideTo(index, 0)
        swiper.slideTo(pageIndex)
      } else {
        swiper.slideTo(pageIndex)
      }
    }
  }

  useEffect(() => {
    if (swiper) {
      const onActiveIndexChange = (swiper) => {
        setActiveIndex(swiper.activeIndex)
      }
      onActiveIndexChange(swiper)
      swiper.on('activeIndexChange', onActiveIndexChange)
      return () => {
        swiper.off('activeIndexChange', onActiveIndexChange)
      }
    }
  }, [swiper])

  return (
    <div style={{ ...themeStyles, backgroundColor, overflow: 'auto' }}>
      {categoryList.map(({ categoryId, pageIndexList }) => (
        <MenuItem
          config={menuItemConfig}
          key={categoryId}
          categoryId={categoryId}
          isActive={pageIndexList.includes(activeIndex)}
          onClick={onClick(pageIndexList[0])}
        />
      ))}
    </div>
  )
}

const MenuItem = ({ config, categoryId, isActive, onClick }) => {
  const { style, props } = config

  const classes = useStyles()

  const { WebkitLineClamp, ...themeStyles } = useEmenuProThemeAdapter(style, {
    ignore: ['width', 'height'],
  })
  const activeStyles = props.active.style
  const activeThemeStyles = useEmenuProThemeAdapter(activeStyles)

  const { t } = useTranslation()

  const menuItemRef = useRef(null)

  const scrollIntoView = (container, target) => {
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()

    const topOffset =
      targetRect.top -
      containerRect.top +
      container.scrollTop -
      container.clientHeight / 2 +
      target.clientHeight / 2
    const leftOffset =
      targetRect.left -
      containerRect.left +
      container.scrollLeft -
      container.clientWidth / 2 +
      target.clientWidth / 2

    container.scrollTo({ top: topOffset, left: leftOffset, behavior: 'smooth' })
  }

  useEffect(() => {
    if (menuItemRef.current && isActive) {
      scrollIntoView(menuItemRef.current.parentElement, menuItemRef.current)
    }
  }, [isActive])

  return (
    <ButtonBase
      ref={menuItemRef}
      style={{
        ...themeStyles,
        ...(isActive ? activeThemeStyles : {}),
        justifyContent: 'flex-start',
      }}
      onClick={onClick}
    >
      <div className={classes.item} style={{ WebkitLineClamp }}>
        {t(categoryId, { ns: 'category' })}
      </div>
    </ButtonBase>
  )
}

export default MenuList
