import { Dialog } from '@material-ui/core'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Virtual, Pagination } from 'swiper/modules'
import { serverUrl } from '@/utils/env_var'
import styles from './PosterSwiper.module.less'
import CancelIcon from '@material-ui/icons/Cancel'
import leftIcon from '@/assets/image/left_134_134.png'
import rightIcon from '@/assets/image/right_134_134.png'
import 'swiper/css'
import 'swiper/css/virtual'
import 'swiper/css/pagination'
import { useEffect, useState } from 'react'
import LoadingOverlay from '@/components/common/LoadingOverlay'

const PosterSwiper = (props) => {
  const { open, onClose, list = [] } = props
  const [loading, setLoading] = useState(false)
  const [swiper, setSwiper] = useState(null)
  const onNext = () => {
    swiper?.slideNext()
  }
  const onPrev = () => {
    swiper?.slidePrev()
  }
  useEffect(() => {
    if (open) {
      setLoading(true)
    }
  }, [open])

  return (
    <>
      <Dialog
        open={open}
        BackdropProps={{ invisible: true }}
        PaperProps={{
          style: {
            width: '100%',
            height: 'auto',
            maxWidth: 'none',
            maxHeight: 'none',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            borderRadius: 'none',
          },
        }}
        style={{ opacity: loading ? 0 : 1, zIndex: 10000 }}
      >
        <div className={styles.content}>
          <Swiper
            modules={[Virtual, Pagination]}
            Virtual
            pagination={{
              clickable: true,
            }}
            loop={true}
            onSwiper={setSwiper}
            onInit={() => setTimeout(() => setLoading(false), 100)}
            className={styles.swiper}
          >
            {list.map((item) => {
              const url = serverUrl + item.url
              const isImage =
                url.includes('.png') ||
                url.includes('.jpg') ||
                url.includes('.jpeg') ||
                url.includes('.gif')
              const isVideo =
                url.includes('.mp4') ||
                url.includes('.mov') ||
                url.includes('.avi') ||
                url.includes('.mkv') ||
                url.includes('.wmv')

              return (
                <SwiperSlide key={item.id} className={styles.swiperSlide}>
                  {isImage && (
                    <img
                      src={url}
                      alt={item.name}
                      className={styles.swiperItem}
                    />
                  )}
                  {isVideo && (
                    <video
                      src={url}
                      alt={item.name}
                      className={styles.swiperItem}
                      loop
                      muted
                      playsInline
                      autoPlay
                    />
                  )}
                </SwiperSlide>
              )
            })}
            {list.length > 1 && (
              <div slot="container-end" className={styles.navigation}>
                <img
                  src={leftIcon}
                  onClick={onPrev}
                  className={styles.prevBtn}
                />
                <img
                  src={rightIcon}
                  onClick={onNext}
                  className={styles.nextBtn}
                />
              </div>
            )}
          </Swiper>
          <CancelIcon className={styles.closeBtn} onClick={onClose} />
        </div>
      </Dialog>
      <LoadingOverlay loading={loading} />
    </>
  )
}

export default PosterSwiper
