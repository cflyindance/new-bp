export function getStorageValue(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key)
    if (saved === null) {
      return defaultValue
    }
    return JSON.parse(saved)
  } catch (e) {
    console.log(e)
    return defaultValue || false
  }
}

export function setStorageValue(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  if (key === 'emenu_auth') {
    window.dispatchEvent(
      new CustomEvent('emenu_auth_changed', {
        detail: value,
      })
    )
  }
}
