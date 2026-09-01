const env = import.meta.env
// const {
//   VITE_LEGACY,
//   VITE_BUILD_COMPRESS,
//   VITE_ENABLE_IMAGEMIN,
//   VITE_BUILD_REPORT,
//   VITE_BUILD_WATCH,
//   VITE_SERVER_URL,
//   VITE_USE_MOCK,
//   VITE_USE_PWA,
// } = env

export const useMock = env.VITE_USE_MOCK === 'true'
export const usePwa = env.VITE_USE_PWA === 'true'
export const useVconsole = env.VITE_USE_VCONSOLE === 'true'
export const serverUrl = env.DEV
  ? env.VITE_SERVER_URL
  : window.location.origin + '/kpos/'
