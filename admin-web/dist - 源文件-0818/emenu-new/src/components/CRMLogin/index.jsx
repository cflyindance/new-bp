import { Suspense, useEffect, useMemo, useState } from 'react'
import { useBoolean, useMemoizedFn } from 'ahooks'
import { Dialog, IconButton } from '@material-ui/core'
import { Person } from '@material-ui/icons'
import { getCRMMemberInfo } from '@/services/crm'
import LoginContent from './LoginContent'
import { useGlobalState } from '@/hooks/useGlobalState'
import { Drawer } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import MemberInfo from '@/components/CRMLogin/MemberInfo'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { getStorageValue } from '@/utils/storage'
import FeedbackToast from '@/components/common/FeedbackToast'
import useSendMemberOrder from '@/hooks/useSendMemberOrder'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import { getCrmProvider, CRM_PROVIDER } from '@/crm'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    width: 440,
    maxWidth: '100vw',
    overflow: 'hidden',
    borderTopLeftRadius: theme.shape.borderRadius * 2,
    borderBottomLeftRadius: theme.shape.borderRadius * 2,
  },
}))

const CRMLogin = (props) => {
  const { isShowIcon = true, isShowMask = true } = props
  const { crmStatus, crmProvider } = useIsMemberLogin()
  const classes = useStyles()
  const [loading, setLoading] = useState(false)
  const [memberInfo, setMemberInfo] = useGlobalState('memberInfo')
  const [loginCrmFnObj] = useGlobalState('loginCrmFnObj')
  const [open, setOpen] = useGlobalState('open')
  const [isShowMemberInfo, setIsShowMemberInfo] = useState(false)
  const { onCloseLoginModal } = loginCrmFnObj
  const tableInfo = getStorageValue('emenu_table', {})
  const currentOrder = tableInfo?.currentOrder
  const [
    openFeedback,
    { setTrue: setOpenFeedback, setFalse: setCloseFeedback },
  ] = useBoolean()
  const [submitting, { setTrue: startSubmitting, setFalse: endSubmitting }] =
    useBoolean()
  const { memberLoginSubmit, memberLogoutSubmit, error, data } =
    useSendMemberOrder({
      onClose: (isNewMember) => {
        setIsShowMemberInfo(false)
        handleClose(null, { isNewMember })
      },
      setCloseFeedback,
      endSubmitting,
    })

  const fetchCRMMemberInfo = useMemoizedFn(async (userId) => {
    try {
      if (crmProvider === CRM_PROVIDER.INTEGRATION) {
        const provider = getCrmProvider(CRM_PROVIDER.INTEGRATION)
        const memberInfo = await provider.fetchMemberInfo(userId)
        if (memberInfo) setMemberInfo(memberInfo)
        return
      }
      const res = await getCRMMemberInfo(userId)
      if (res && Object.keys(res)?.length > 0) {
        setMemberInfo(res)
      }
    } catch (e) {
      throw new Error(e)
    } finally {
      setLoading(false)
    }
  })

  const crmMemberId = useMemo(() => {
    return currentOrder?.crmMemberId
  }, [currentOrder])

  const point = useMemo(() => {
    return currentOrder?.member?.pointBalance
  }, [currentOrder])

  useEffect(async () => {
    if (!crmMemberId) return
    setLoading(true)
    await fetchCRMMemberInfo(crmMemberId)
  }, [crmMemberId, fetchCRMMemberInfo, point])

  const handleClickUser = async () => {
    if (Object.keys(memberInfo)?.length > 0) {
      setIsShowMemberInfo(true)
    } else {
      setOpen(true)
    }
  }

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick') return
    setOpen(false)
    onCloseLoginModal({ isNewMember: !!reason?.isNewMember })
  }

  return (
    crmStatus && (
      <>
        {isShowIcon &&
          (props.renderButton ? (
            props.renderButton({ onClick: handleClickUser })
          ) : (
            <IconButton onClick={handleClickUser}>
              <Person />
            </IconButton>
          ))}
        <Dialog
          open={open}
          onClose={handleClose}
          BackdropProps={{ invisible: !isShowMask }}
        >
          <LoginContent
            onClose={handleClose}
            memberLoginSubmit={memberLoginSubmit}
            setOpenFeedback={setOpenFeedback}
            startSubmitting={startSubmitting}
          />
        </Dialog>
        <Drawer
          classes={{ paper: classes.root }}
          anchor="right"
          open={isShowMemberInfo}
          onClose={() => setIsShowMemberInfo(false)}
        >
          <MemberInfo
            onClose={() => setIsShowMemberInfo(false)}
            memberLogoutSubmit={memberLogoutSubmit}
            setOpenFeedback={setOpenFeedback}
            startSubmitting={startSubmitting}
          />
        </Drawer>
        <LoadingOverlay loading={loading} />
        <Suspense fallback={<LoadingOverlay loading={true} />}>
          <FeedbackToast
            open={openFeedback}
            loading={submitting}
            error={error}
            data={data}
            onClose={setCloseFeedback}
          />
        </Suspense>
      </>
    )
  )
}

export default CRMLogin
