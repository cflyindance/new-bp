import React, { useMemo } from 'react'
import {
  Button,
  Dialog,
  IconButton,
  makeStyles,
  Typography,
} from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import TRANSLATE from '@/assets/image/translate.png'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useBoolean } from 'ahooks'
import { supportLanguages } from '@/locales/resources'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'

const useStyles = makeStyles((theme) => ({
  content: {
    padding: 20,
    width: 368,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.common.white,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 1.2,
    letterSpacing: -0.6,
  },
  optionBtnBox: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'column',
    paddingTop: 20,
  },
  optionBtnList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxHeight: 'calc(100vh - 300px)',
    overflowY: 'auto',
    '& > button:first-child': {
      marginTop: 0,
    },
    '&::-webkit-scrollbar': {
      width: 4,
      height: 4,
      borderRadius: 10,
      backgroundColor: '#aaaaaa',
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: 10,
      backgroundColor: '#96272f',
    },
  },
  optionBtn: {
    width: 304,
    height: 40,
    border: '1px solid #E0E0E0',
    color: '#000000',
    borderRadius: 5,
    fontSize: 18,
    fontWeight: 'normal',
    marginTop: 20,
  },
  cancelBtn: {
    width: 304,
    height: 56,
    border: '1px solid #E0E0E0',
    color: '#ffffff',
    background: '#96272F',
    borderRadius: 10,
    fontSize: 18,
    fontWeight: 'normal',
    marginTop: 20,
  },
  checkedIcon: {
    color: '#96272F',
    fontSize: 24,
    position: 'absolute',
    right: 20,
  },
  checkedOptionBtn: {
    borderColor: '#96272F',
  },
}))

const LanguageChange = (props) => {
  const { t, i18n } = useTranslation()
  const classes = useStyles()

  const { getFinalConfigById } = useSystemConfig()
  const languageSetting = getFinalConfigById(71)
  const languageList = languageSetting?.languages || []

  const displayLanguageList = useMemo(() => {
    return supportLanguages
      .filter((each) => languageList.includes(each))
      .map((each) => {
        return {
          label: t(`SystemSetting.languages_list.${each}`, { lng: each }),
          value: each,
        }
      })
  }, [languageList, t])

  const [
    languageModalVisible,
    { setTrue: openLanguageModal, setFalse: closeLanguageModal },
  ] = useBoolean()

  const handleChangeLang = () => {
    if (languageList.length === 2) {
      if (i18n.language === languageList[0]) {
        i18n.changeLanguage(languageList[1])
      } else {
        i18n.changeLanguage(languageList[0])
      }
    } else {
      openLanguageModal()
    }
  }

  const onModalLanguageChange = (lang) => () => {
    closeLanguageModal()
    i18n.changeLanguage(lang)
  }

  if (languageList.length <= 1) {
    return null
  }

  return (
    <>
      {props.renderButton ? (
        props.renderButton({ onClick: handleChangeLang })
      ) : (
        <IconButton onClick={handleChangeLang}>
          <img
            style={{
              width: 24,
              height: 24,
            }}
            src={TRANSLATE}
            alt="language"
          />
        </IconButton>
      )}
      <Dialog open={languageModalVisible}>
        <div className={classes.content}>
          <Typography variant="h4" className={classes.title}>
            {t('chooseLanguageModal.title')}
          </Typography>
          <div className={classes.optionBtnBox}>
            <div className={classes.optionBtnList}>
              {displayLanguageList.map((item) => {
                return (
                  <Button
                    key={item.value}
                    variant="outlined"
                    className={`${classes.optionBtn} ${i18n.language === item.value ? classes.checkedOptionBtn : ''}`}
                    onClick={onModalLanguageChange(item.value)}
                  >
                    {item.label}
                    {i18n.language === item.value && (
                      <CheckCircleIcon className={classes.checkedIcon} />
                    )}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outlined"
              className={classes.cancelBtn}
              onClick={closeLanguageModal}
            >
              {t('chooseLanguageModal.btn_cancel')}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

export default LanguageChange
