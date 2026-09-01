import React, { memo } from 'react'
import { RecommendIcon } from '@/components/common/SvgIcons'
import SPICY from '@/assets/image/spicy.png'
import styles from './index.module.less'
import { serverUrl } from '@/utils/env_var'

const ImgTag = (props) => {
  const { allImgLabel } = props

  return (
    <div className={styles.imgIconWrapper}>
      {allImgLabel.map((each, idx) => {
        if (each.isRecommend) {
          return <RecommendIcon className={styles.icon} key={idx} />
        }
        if (each.spicy) {
          return (
            <img src={SPICY} alt="SPICY" className={styles.icon} key={idx} />
          )
        }
        return (
          each.picture && (
            <img
              src={`${serverUrl}${each.picture}`}
              alt="SPICY"
              className={styles.icon}
              key={each.id}
            />
          )
        )
      })}
    </div>
  )
}

export default memo(ImgTag)
