import {
  // createTheme,
  ThemeProvider,
  unstable_createMuiStrictModeTheme,
} from '@material-ui/core/styles'
import KeyBoardInstance from '@/utils/KeyBoardBounce'
// import 'antd/dist/antd.variable.min.css'

import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack'
import { HashRouter } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorBoundaryCom from '@/components/ErrorBoundary'
import { useVconsole } from './utils/env_var'
import React from 'react'
import ReactDOM from 'react-dom'
import VConsole from 'vconsole'
import './i18n'
import initLanguageCode from './utils/initLanguage'
import App from './App'
import store from './store'
import './index.scss'
import { AliveScope } from 'react-activation'
import AntdConfigProvider from './pages/GlobalSetting/components/AntdConfigProvider'

const vConsole = useVconsole ? new VConsole() : null
vConsole?.setOption({ log: { showTimestamps: true } })
vConsole?.setSwitchPosition(26, 100)

initLanguageCode()

// ConfigProvider.config({
//   theme: {
//     primaryColor: '#96272F',
//   },
// })

const theme = unstable_createMuiStrictModeTheme({
  palette: {
    primary: {
      main: '#96272F',
    },
    secondary: {
      main: '#E3C18A',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    allVariants: {
      fontFamily: [
        // '"SF Pro"',
        // '"PingFang SC"',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Fira Sans',
        'Droid Sans',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      textTransform: 'none',
    },
  },
  overrides: {
    MuiButton: {
      root: {
        minWidth: 'auto',
        '&:hover': {
          backgroundColor: 'none',
          '@media (hover: none)': {
            backgroundColor: 'none',
          },
        },
      },
    },
    MuiTouchRipple: {
      root: {
        display: 'none',
      },
    },
    MuiDialog: {
      root: {
        position: 'absolute !important', // 配合安卓下软键盘弹出兼容问题
      },
    },
    MuiIconButton: {
      root: {
        padding: 8,
        color: '#333',
        backgroundColor: '#FFF',
        '&:hover': {
          backgroundColor: 'none',
          '@media (hover: none)': {
            backgroundColor: 'none',
          },
        },
      },
    },
    MuiSvgIcon: {
      fontSizeSmall: {
        fontSize: 16,
      },
    },
    // MuiTouchRipple: {
    //   child: {
    //     opacity: 0,
    //     backgroundColor: 'rgba(0, 0, 0, 0)',
    //   },
    // },
    MuiCardActionArea: {
      root: {
        '&:hover $focusHighlight': {
          opacity: 0.1,
          '@media (hover: none)': {
            opacity: 0,
          },
        },
        '&$focusVisible $focusHighlight': {
          opacity: 0.1,
        },
      },
    },
    MuiBackdrop: {
      root: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
    },
  },
  transitions: {
    create: () => 'none',
  },
})

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary fallbackRender={ErrorBoundaryCom}>
      <Provider store={store}>
        <AliveScope>
          <ThemeProvider theme={theme}>
            <AntdConfigProvider>
              <SnackbarProvider
                anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
                autoHideDuration={3000}
                maxSnack={2}
              >
                <HashRouter>
                  <App />
                </HashRouter>
              </SnackbarProvider>
            </AntdConfigProvider>
          </ThemeProvider>
        </AliveScope>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
)

document.addEventListener(
  'touchmove',
  function (event) {
    const sys = window.navigator.userAgent
    if (!/iPhone|iPad|iPod/i.test(sys)) return
    // 只在ios缩放时拦截（pinch）
    if (event.scale !== 1) {
      event.preventDefault()
    }
  },
  { passive: false }
)

window.androidWebkit = Object.assign(window.androidWebkit || {}, {
  keyboardOpen: KeyBoardInstance.getKeyboardHeight,
  keyboardClose: KeyBoardInstance.removeBoxFromBody,
})

window.webviewConfig = {
  pauseTime: 0,
  resumeTime: performance.now(),
  active: true,
}
