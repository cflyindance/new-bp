import { useState } from 'react'
import { useMount } from 'ahooks'
import axios from 'axios'

const useCheckVersion = () => {
  const [version, setVersion] = useState(null)

  useMount(async () => {
    try {
      const res = await checkVersionRequest()
      if (res.status === 200) {
        const { version } = res.data
        setVersion(version)
      }
    } catch (e) {
      console.warn(e?.message)
    }
  })

  const checkVersionRequest = async () => {
    // 嵌入 admin-web 时优先用本地包 version.json；BASE_URL 在 embed 构建下为 /emenu-new/
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
    const localUrl = `${base}version.json?t=${Date.now()}`
    try {
      return await axios(localUrl)
    } catch {
      return axios(`/kpos/emenu/version.json?t=${Date.now()}`)
    }
  }

  return {
    version,
    checkVersionRequest,
  }
}

export default useCheckVersion
