import { useState, useRef, useEffect } from 'react'
import {
  Box,
  makeStyles,
  Button,
  Dialog,
  Typography,
  TextField,
  IconButton,
} from '@material-ui/core'
import { Select } from 'antd'
import LoadingOverlay from '../common/LoadingOverlay'
import { useToggle } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import TRANSLATE from '@/assets/image/translate.png'

const { Option } = Select
const useStyles = makeStyles((theme) => ({
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.2,
    color: '#333',
  },
  text: {
    borderRadius: 5,
    '& $textNotched': {
      borderColor: '#E0E0E0',
    },
    '&:hover $textNotched': {
      borderColor: '#E0E0E0',
    },
    '&$textFocused $textNotched': {
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
  },
  languageBtn: {
    marginLeft: theme.spacing(2),
  },
  textInput: {
    padding: theme.spacing(2, 3),
    '&:not($select)': {
      textTransform: 'uppercase',
    },
    '&::placeholder': {
      textTransform: 'none',
    },
  },
  textFocused: {},
  textNotched: {},
  select: {
    padding: theme.spacing(2, 3),
  },
  selectBox: {
    minHeight: 0,
    boxShadow: '0px 2px 10px rgba(18, 40, 98, 0.1)',
  },
  selectList: {
    padding: 0,
    maxHeight: 300,
    // overflowY: 'auto',
    // '&::-webkit-scrollbar': {
    //   width: 5,
    //   height: 5,
    //   borderRadius: theme.shape.borderRadius,
    //   backgroundColor: theme.palette.grey.A200,
    // },
    // '&::-webkit-scrollbar-thumb': {
    //   borderRadius: theme.shape.borderRadius,
    //   backgroundColor: theme.palette.primary.light,
    // },
  },
  selectItemInput: {
    width: '100%',
    '&> .ant-select-selector': {
      // padding: `${theme.spacing(1, 2)} !important`,
      height: '54px !important',
      '& .ant-select-selection-placeholder': {
        lineHeight: '54px !important',
      },
    },
  },
  selectItemOption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
  },
  selectItem: {
    width: 396,
    padding: theme.spacing(2, 3),
    justifyContent: 'space-between',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    '&$selectedItem': {
      backgroundColor: 'rgba(33, 150, 243, 0.05)',
    },
    '&$selectedItem:hover': {
      backgroundColor: 'rgba(33, 150, 243, 0.05)',
    },
  },
  selectedItem: {
    fontWeight: 700,
  },
  btn: {
    height: 51,
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 5,
    boxShadow: 'none',
  },
  btnPrimary: {
    // boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    '&$btnDisabled': {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.primary.main,
    },
  },
  btnText: {
    marginTop: theme.spacing(2),
    textDecoration: 'underline',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  btnDisabled: {
    opacity: 0.5,
  },
}))

function ChooseLicense({ open, licenses, onClose, onEnter, loading }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [boundLicense, setBoundLicense] = useGlobalState('boundLicense')
  const [licenseName, setLicenseName] = useState('')
  const [state, { toggle }] = useToggle('exist', 'new')
  const { i18n } = useTranslation()
  const isInputting = useRef(false)
  const inputRef = useRef(null)

  const handleClose = (event, reason) => {
    if (!reason) {
      onClose()
    }
  }

  const toggleState = () => {
    toggle()
    setLicenseName('')
  }

  useEffect(() => {
    if (boundLicense) {
      const { licenseName } = boundLicense
      handleChangeSelect(licenseName)
    }
  }, [boundLicense])

  const handleChangeSelect = (e) => {
    // const val = e.target.value  //material-ui
    const val = e //antd
    if (!val) return
    // select license login 不需要校验规则, 兼容老license
    setLicenseName(val.toUpperCase())

    if (boundLicense) {
      setBoundLicense(null)
    }
  }

  const handleChangeLang = () => {
    const lang = i18n.language
    if (lang === 'en') {
      i18n.changeLanguage('zh')
    } else {
      i18n.changeLanguage('en')
    }
  }

  const handleInput = (e) => {
    if (isInputting.current) return
    const value = e.target.value
    if (/^[\w\d\s-]{0,20}$/.test(value)) {
      inputRef.current.value = value
      setLicenseName(value.toUpperCase())
    } else {
      inputRef.current.value = licenseName
      setLicenseName(licenseName)
    }
  }

  useEffect(() => {
    if (open && !['en', 'zh'].includes(i18n.language)) {
      i18n.changeLanguage('en')
    }
  }, [open, i18n.language])

  return (
    <Dialog open={open} onClose={handleClose}>
      <LoadingOverlay loading={loading} />
      <Box
        display="flex"
        flexDirection="column"
        padding={4}
        width={460}
        height={460}
      >
        <div className={classes.titleRow}>
          <Typography variant="h6" className={classes.title}>
            {t(`ChooseLicense.${state}`)}
          </Typography>
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
        </div>
        {state === 'new' ? (
          <TextField
            defaultValue={licenseName}
            inputRef={inputRef}
            fullWidth
            autoComplete="off"
            variant="outlined"
            InputProps={{
              classes: {
                root: classes.text,
                input: classes.textInput,
                focused: classes.textFocused,
                notchedOutline: classes.textNotched,
              },
            }}
            // inputProps={{
            //   maxLength: 20,
            // }}
            placeholder={t('ChooseLicense.new')}
            onCompositionStart={() => {
              isInputting.current = true
            }}
            onCompositionEnd={(e) => {
              isInputting.current = false
              handleInput(e)
            }}
            onInput={handleInput}
          />
        ) : (
          <Box>
            <Select
              size="large"
              className={classes.selectItemInput}
              onChange={handleChangeSelect}
              value={licenseName ? licenseName : undefined}
              placeholder={t('ChooseLicense.exist')}
              getPopupContainer={(node) => node.parentNode}
            >
              {licenses.map((e) => {
                return (
                  <Option key={e.id} value={e.name} disabled={e.inUse}>
                    <div className={classes.selectItemOption}>
                      <span>{e.name}</span>
                      <span>
                        {e.inUse && (
                          <Typography variant="body2" color="error">
                            {t('ChooseLicense.using')}
                          </Typography>
                        )}
                      </span>
                    </div>
                  </Option>
                )
              })}
            </Select>
            {/* <TextField
              autoFocus
              fullWidth
              variant="outlined"
              select
              InputProps={{
                classes: {
                  root: classes.text,
                  input: classes.textInput,
                  focused: classes.textFocused,
                  notchedOutline: classes.textNotched,
                },
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (value) =>
                  value || (
                    <span className={classes.btnDisabled}>
                      {t('ChooseLicense.exist')}
                    </span>
                  ),
                IconComponent: ExpandMoreRounded,
                classes: {
                  outlined: classes.select,
                },
                MenuProps: {
                  classes: {
                    paper: classes.selectBox,
                    list: classes.selectList,
                  },
                },
              }}
              value={licenseName}
              onChange={handleChangeSelect}
              placeholder={t('ChooseLicense.exist')}
            >
              {licenses.map((e) => {
                return (
                  <MenuItem
                    key={e.id}
                    value={e.name}
                    disabled={e.inUse}
                    classes={{
                      root: classes.selectItem,
                      selected: classes.selectedItem,
                    }}
                  >
                    {e.name}
                    {e.inUse && (
                      <Typography variant="body2" color="error">
                        {t('ChooseLicense.using')}
                      </Typography>
                    )}
                  </MenuItem>
                )
              })}
            </TextField> */}
          </Box>
        )}

        <Box marginTop="auto">
          <Button
            variant="contained"
            color="primary"
            fullWidth
            classes={{
              root: classes.btn,
              containedPrimary: classes.btnPrimary,
              disabled: classes.btnDisabled,
            }}
            disabled={!licenseName?.trim()?.length}
            onClick={onEnter.bind(this, licenseName, state)}
          >
            {t('ChooseLicense.confirm')}
          </Button>
          <Button
            color="primary"
            fullWidth
            classes={{
              root: classes.btn,
              textPrimary: classes.btnText,
            }}
            onClick={toggleState}
          >
            {t(`ChooseLicense.${state === 'new' ? 'exist' : 'new'}`)}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default ChooseLicense
