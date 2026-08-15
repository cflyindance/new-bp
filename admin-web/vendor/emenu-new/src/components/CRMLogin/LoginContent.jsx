import { useMemo, useRef, useState } from 'react'
import styles from './LoginContent.module.less'
import { formatUSPhoneNumber } from '@/utils/formatPhone'
import classNames from 'classnames'
import {
  createCRMMember,
  getAuthCode,
  getCRMMemberInfo,
  searchCRMMember,
  verifyAuthCode,
} from '@/services/crm'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import Toast from '@/components/Toast'
import { useGlobalState } from '@/hooks/useGlobalState'
import CountDown from './CountDown'
import { CloseRounded as CloseIcon } from '@material-ui/icons'
import { useTranslation } from 'react-i18next'
import KeyBoardInstance from '@/utils/KeyBoardBounce'
import useSystemConfig from '@/hooks/useSystemConfig'
import { getCrmProvider, CRM_PROVIDER } from '@/crm'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'

const LoginContent = (props) => {
  const { onClose, memberLoginSubmit, setOpenFeedback, startSubmitting } = props
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [reSendCode, setReSendCode] = useState(true)
  const [loginSession, setLoginSession] = useState('')
  const [, setMemberInfo] = useGlobalState('memberInfo')
  const { getFinalConfigById } = useSystemConfig()
  const isNeedLoginCRM = getFinalConfigById(34)?.open
  const isNeedAuthCode = getFinalConfigById(35)?.open
  const { crmProvider } = useIsMemberLogin()
  const integrationProvider = getCrmProvider(CRM_PROVIDER.INTEGRATION)
  const isIntegrationCrm = crmProvider === CRM_PROVIDER.INTEGRATION
  const { t } = useTranslation()
  const countDownRef = useRef(null)
  const phoneInputRef = useRef(null)
  const codeInputRef = useRef(null)
  // useEffect(() => {
  //   fetchCRMMemberInfo('73973dd0-5853-43a3-8062-132323ae52c4')
  // }, [])

  const onPhoneChange = (e) => {
    let tempPhone = e.target.value
    const phoneNum = tempPhone.replace(/\D/g, '')
    setPhone(formatUSPhoneNumber(phoneNum))
  }

  const actualPhone = useMemo(() => {
    return phone.replace(/\D/g, '')
  }, [phone])

  const onAuthChange = (e) => {
    let tempPhone = e.target.value
    const phoneNum = tempPhone.replace(/\D/g, '')
    setAuthCode(phoneNum)
  }

  const canSendCode = useMemo(() => {
    return actualPhone?.length === 10
  }, [actualPhone])

  const isValidLogin = useMemo(() => {
    if (!isNeedAuthCode) {
      return canSendCode
    }
    return canSendCode && authCode?.length === 6
  }, [canSendCode, authCode, isNeedAuthCode])

  const handleSendCode = async () => {
    if (!canSendCode || !reSendCode) return
    const onSendError = (msg) => {
      setReSendCode(true)
      countDownRef.current.stop()
      msg && Toast.error(msg)
    }
    setReSendCode(false)
    try {
      setLoading(true)
      const data = {
        phone: `+1${actualPhone}`,
        countryCode: '+1',
        options: {
          autoSignUp: true,
        },
      }
      const codeRes = await getAuthCode(data)
      const codeData = codeRes?.data || codeRes
      // 发送成功
      if (codeData.successful) {
        setLoginSession(codeData?.otpLogin?.Session || '')
        countDownRef.current.start()
        return
      }
      onSendError('Message sending failed !')
    } catch (e) {
      console.log(e.response?.data?.message || e.message)
      onSendError()
    } finally {
      setLoading(false)
    }
  }

  const handleMemberLogin = async () => {
    if (!isValidLogin) return
    try {
      setLoading(true)
      // 不需要验证
      if (!isNeedAuthCode) {
        await onVerifySuccess()
        return
      }
      const data = {
        phone: `+1${actualPhone}`,
        countryCode: '+1',
        code: authCode,
        session: loginSession,
      }
      // 需要验证
      const res = await verifyAuthCode(data)
      const verifyData = res?.data || res
      if (verifyData.token) {
        countDownRef.current.stop()
        await onVerifySuccess()
        return
      }
      Toast.error(verifyData.message)
    } catch (e) {
      if (e.response?.data?.code === 'INCORRECT_CODE') {
        const session = e.response.data.retrySession
        setLoginSession(session)
      }
      Toast.error(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  const onVerifySuccess = async () => {
    try {
      setLoading(true)
      if (isIntegrationCrm) {
        await loginCrmIntegrationMember()
        return
      }
      // menusifu crm
      const searchRes = await searchMemberInfo()
      if (searchRes) {
        const { userId } = searchRes
        await fetchCRMMemberInfo(userId, false)
        return
      }
      const createRes = await createCRM()
      if (!createRes || !Object.keys(createRes)?.length) return
      const { userId } = createRes
      await fetchCRMMemberInfo(userId, true)
    } finally {
      setLoading(false)
    }
  }

  const loginCrmIntegrationMember = async () => {
    const existingMember =
      await integrationProvider.searchMemberByPhone(actualPhone)
    const memberInfo = existingMember
      ? existingMember
      : await integrationProvider.createMemberByPhone(actualPhone)

    if (!memberInfo?.userId) {
      Toast.error('failed to get member info')
      return
    }

    setMemberInfo(memberInfo)

    const beforeLogin = () => {
      setOpenFeedback()
      startSubmitting()
      onClose()
    }

    await memberLoginSubmit({
      isHasBenefit: false,
      crmMemberId: memberInfo.userId,
      isNewMember: !existingMember,
      beforeLogin,
    })
  }

  const searchMemberInfo = async () => {
    try {
      const searchParams = {
        pageNo: 1,
        pageSize: 15,
        searchField: 'phone',
        searchKey: actualPhone,
      }
      const res = await searchCRMMember(searchParams)
      if (res?.total > 0) {
        // 非新会员
        setMemberInfo(res.data?.[0])
        return res.data?.[0]
      }
      return false
    } catch (e) {
      throw new Error(e)
    }
  }

  const createCRM = async () => {
    const data = {
      firstname: '',
      lastname: '',
      phone: actualPhone,
      email: '',
    }
    const res = await createCRMMember(data)
    if (res && Object.keys(res)?.length > 0) {
      return res
    }
    return false
  }

  const fetchCRMMemberInfo = async (userId, isNewMember) => {
    try {
      const res = await getCRMMemberInfo(userId)
      if (res && Object.keys(res)?.length > 0) {
        setMemberInfo(res)
        const currentTime = Date.now()
        const isVIPMember = !!res?.privileges?.find(
          (each) =>
            each.status === 'ACTIVE' &&
            currentTime <= (each.expireTime ?? Infinity)
        )
        const beforeLogin = () => {
          setOpenFeedback()
          startSubmitting()
          onClose()
        }
        await memberLoginSubmit({
          isHasBenefit: isVIPMember,
          crmMemberId: userId,
          isNewMember,
          beforeLogin,
        })
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  const handleEnter = (e, cb) => {
    if (e.keyCode === 13) {
      cb()
    }
  }

  return (
    <>
      <div className={styles.contentWrapper}>
        <div className={styles.title}>{t('crm.login')}</div>
        {isNeedLoginCRM && (
          <div className={styles.tips}>
            {t('SettingOrderLimit.limit_isNeedLoginCRM_title')}
          </div>
        )}
        {!isNeedLoginCRM && (
          <div className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </div>
        )}
        <div className={styles.inputLabel}>{t('crm.enterPhone')}</div>
        <div className={styles.phoneInputWrapper}>
          <span className={styles.addon}>+1</span>
          <input
            ref={phoneInputRef}
            value={phone}
            maxLength={10}
            className={styles.inputNum}
            type="tel"
            onChange={onPhoneChange}
            onKeyUp={(e) =>
              handleEnter(e, !isNeedAuthCode ? onVerifySuccess : handleSendCode)
            }
            onFocus={() => {
              KeyBoardInstance.checkIfNeedBounce(phoneInputRef.current)
            }}
            onBlur={() => {
              KeyBoardInstance.removeBoxFromBody()
            }}
          />
        </div>

        {isNeedAuthCode && (
          <div className={styles.inputLabel}>{t('crm.enterCode')}</div>
        )}
        {isNeedAuthCode && (
          <div className={styles.phoneInputWrapper}>
            <input
              ref={codeInputRef}
              value={authCode}
              maxLength={6}
              className={styles.inputNum}
              type="tel"
              onChange={onAuthChange}
              onKeyUp={(e) => handleEnter(e, handleMemberLogin)}
              onFocus={() => {
                KeyBoardInstance.checkIfNeedBounce(codeInputRef.current)
              }}
              onBlur={() => {
                KeyBoardInstance.removeBoxFromBody()
              }}
            />
            <span
              className={classNames(
                styles.addAfter,
                (!canSendCode || !reSendCode) && styles.disabled_addAfter
              )}
              onClick={handleSendCode}
            >
              <span>{t('crm.sendCode')}</span>
              <CountDown
                ref={countDownRef}
                onFinishedEffect={() => setReSendCode(true)}
              />
            </span>
          </div>
        )}

        <div
          className={classNames(
            styles.loginBtn,
            !isValidLogin && styles.disabled_login
          )}
          onClick={handleMemberLogin}
        >
          {t('crm.login')}
        </div>

        {!isNeedLoginCRM && (
          <div className={styles.loginLater} onClick={onClose}>
            {t('crm.loginLater')}
          </div>
        )}
      </div>
      <LoadingOverlay loading={loading} />
    </>
  )
}

export default LoginContent
