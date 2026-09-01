import { makeStyles, Modal } from '@material-ui/core'
import { useEffect, useState, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import message from '@/components/Message'

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '400px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: '16px',
    top: '16px',
    width: '32px',
    height: '32px',
  },
  body: {
    width: '100%',
    marginTop: '16px',
    padding: '0 48px',
    textAlign: 'center',
  },
  input: {
    textAlign: 'center',
  },
  tip: {
    fontSize: '14px',
    color: '9e9e9e',
    marginTop: '8px',
    opacity: 0.6,
  },
  footer: {
    marginTop: '16px',
    width: '100%',
    padding: '0 48px',
    textAlign: 'center',
  },
  confirmBtn: {
    width: '100%',
  },
}))

const PASSWORD = ['1qaz@WSX6788', 'wsxcvbnm']

function SuperAdminLogin({ visible, onClose, onSuccess }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [passcode, setPasscode] = useState('')

  useEffect(() => {
    setPasscode('')
  }, [visible])

  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    if (!passcode) {
      message.warn(t('AdminLogin.tip_initial'))
      return
    }
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (PASSWORD.includes(passcode)) {
      onSuccess()
      onClose()
    } else {
      message.warn(t('AdminLogin.tip_wrong'))
    }
    setLoading(false)
  }

  return (
    <Modal open={visible} onClose={onClose}>
      <div className={classes.root}>
        <div className={classes.content}>
          <div className={classes.header}>
            {t('AdminLogin.super_admin_login_title')}
          </div>
          <div className={classes.closeBtn}>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </div>
          <div className={classes.body}>
            <Input
              placeholder={t('AdminLogin.super_admin_login_placeholder')}
              value={passcode}
              size="large"
              type="password"
              autoComplete="off"
              className={classes.input}
              autoFocus
              onChange={(e) => setPasscode(e.target.value)}
            />
            <div className={classes.tip}>
              {t('AdminLogin.super_admin_login_tip')}
            </div>
          </div>
          <div className={classes.footer}>
            <Button
              type="primary"
              size="large"
              className={classes.confirmBtn}
              onClick={onConfirm}
              loading={loading}
            >
              {t('AdminLogin.super_admin_login_confirm_btn')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default memo(SuperAdminLogin)
