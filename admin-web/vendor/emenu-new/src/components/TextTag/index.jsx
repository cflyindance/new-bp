import { useState, useRef, useEffect, memo } from 'react'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'

const TextTags = (props) => {
  const { allTextLabel, wrapperStyle = {} } = props
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const [visibleTags, setVisibleTags] = useState([])

  const init = (container, allTextLabel) => {
    let visibleCount = 0
    let currentWidth = 0
    for (let i = 0; i < allTextLabel.length; i++) {
      const tag = allTextLabel[i]
      const tagWidth = getTextWidth(tag.name)
      if (currentWidth + tagWidth < container.clientWidth) {
        currentWidth += tagWidth
        visibleCount++
      } else {
        break
      }
    }
    setVisibleTags(allTextLabel.slice(0, visibleCount))
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      init(container, allTextLabel)
      if (window.ResizeObserver) {
        const observer = new window.ResizeObserver(() => {
          init(container, allTextLabel)
        })
        observer.observe(container)
        return () => {
          observer.disconnect()
        }
      }
    }
  }, [containerRef.current, allTextLabel])

  const getTextWidth = (text) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    context.font = '12px'
    return context.measureText(text).width + 18
  }

  return (
    <div
      ref={containerRef}
      className={styles.tagWrapper}
      style={{
        visibility: allTextLabel?.length > 0 ? 'visible' : 'hidden',
        ...wrapperStyle,
      }}
    >
      {visibleTags.map((tag, idx) => {
        return (
          <span key={idx} className={styles.textTag}>
            {tag.id
              ? tag.name
              : t(`Order.${tag.name}`, { defaultValue: tag.name })}
          </span>
        )
      })}
    </div>
  )
}

export default memo(TextTags)
