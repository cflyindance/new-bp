import { toast } from 'react-hot-toast'
import {
  FeedbackErrorIcon,
  FeedbackSuccessIcon,
  FeedbackWarningIcon,
} from '@/components/common/SvgIcons'
import styles from './index.module.less'
import InfoIcon from '@material-ui/icons/Info'

const TOAST_DURATION = 5 * 1000
const MAX_TOASTS = 3
let displayToasts = []

export const limitedToast = (message, config, type) => {
  if (displayToasts.length >= MAX_TOASTS) {
    const oldest = displayToasts.shift()
    if (oldest) toast.dismiss(oldest)
  }

  let toastId
  switch (type) {
    case 'error':
      toastId = toast.error(message, config)
      break
    case 'success':
      toastId = toast.success(message, config)
      break
    case 'loading':
      toastId = toast.loading(message, config)
      break
    default:
      toastId = toast(message, config)
  }
  displayToasts.push(toastId)

  // 自动消失后，从数组中删除
  const t = setTimeout(
    () => {
      displayToasts = displayToasts.filter((tId) => tId !== toastId)
      clearTimeout(t)
    },
    (config?.duration ?? TOAST_DURATION) + 100
  )
}

const info = (msg, config) => {
  return limitedToast(
    <div className={styles.toastText}>
      <div>{msg}</div>
    </div>,
    {
      className: styles.toast,
      icon: <InfoIcon className={styles.toastInfoIcon} />,
      duration: TOAST_DURATION,
      ...config,
    }
  )
}

const success = (msg, config) => {
  return limitedToast(
    <div className={styles.toastText}>
      <div>{msg}</div>
    </div>,
    {
      className: styles.toast,
      icon: <FeedbackSuccessIcon className={styles.toastSuccessIcon} />,
      duration: TOAST_DURATION,
      ...config,
    },
    'success'
  )
}

const error = (msg, config) => {
  return limitedToast(
    <div className={styles.toastText}>
      <div>{msg}</div>
    </div>,
    {
      className: styles.toast,
      icon: <FeedbackErrorIcon className={styles.toastErrorIcon} />,
      duration: TOAST_DURATION,
      ...config,
    },
    'error'
  )
}

const warning = (msg, config) => {
  return limitedToast(
    <div className={styles.toastText}>
      <div>{msg}</div>
    </div>,
    {
      className: styles.toast,
      icon: <FeedbackWarningIcon className={styles.toastWarningIcon} />,
      duration: TOAST_DURATION,
      ...config,
    }
  )
}

const Toast = {
  info,
  success,
  error,
  warning,
}

export default Toast
