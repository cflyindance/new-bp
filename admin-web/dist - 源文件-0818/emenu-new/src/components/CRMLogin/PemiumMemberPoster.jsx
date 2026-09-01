import { Dialog } from '@material-ui/core'
import styles from './PemiumMemberPoster.module.less'
import CloseIcon from '@material-ui/icons/Close'
import { Trans, useTranslation } from 'react-i18next'
import StarImg from '@/assets/image/pemium_star_39_43.png'
import GiftImg from '@/assets/image/pemium_gift_39_41.png'
import VoucherImg from '@/assets/image/pemium_voucher_38_31.png'
import PsoterBgImg from '@/assets/image/pemium_poster_bg.svg'
import { Button } from 'antd'
import { serverUrl } from '@/utils/env_var'

const PemiumMemberPoster = (props) => {
  const { open, price, posterSrc, onCancel, onJoin } = props
  const { t } = useTranslation()

  return (
    <Dialog
      open={open}
      BackdropProps={{ invisible: true }}
      PaperProps={{
        style: {
          marginTop: 'calc(32px + 20px + 4px)',
          overflow: 'visible',
          backgroundColor: 'transparent',
          borderRadius: 'none',
          boxShadow: 'none',
        },
      }}
    >
      <div className={styles.closeBtn} onClick={onCancel}>
        <CloseIcon style={{ fontSize: 40 }} />
      </div>
      {posterSrc ? (
        <img
          className={styles.imageContent}
          src={serverUrl + posterSrc}
          onClick={onJoin}
        />
      ) : (
        <div className={styles.content} onClick={onJoin}>
          <div className={styles.content_inner}>
            <div className={styles.notPemium}>
              {t('crm.pemiumMemberPoster.notPemium')}
            </div>
            <div className={styles.becomePemium}>
              <Trans i18nKey="crm.pemiumMemberPoster.becomePemium" />
            </div>
            <div className={styles.benefitList}>
              <div className={styles.benefitList_item}>
                <img src={StarImg} />
                {t('crm.pemiumMemberPoster.benefitList_item_1')}
              </div>
              <div className={styles.benefitList_item}>
                <img src={GiftImg} />
                {t('crm.pemiumMemberPoster.benefitList_item_2')}
              </div>
              <div className={styles.benefitList_item}>
                <img src={VoucherImg} />
                {t('crm.pemiumMemberPoster.benefitList_item_3')}
              </div>
            </div>

            <div className={styles.joinBtnWrapper}>
              <Button type="primary" className={styles.joinBtn}>
                {t('crm.pemiumMemberPoster.join', { price })}
              </Button>
            </div>
          </div>
          <div className={styles.posterBg}>
            <img src={PsoterBgImg} />
          </div>
        </div>
      )}
    </Dialog>
  )
}

export default PemiumMemberPoster
