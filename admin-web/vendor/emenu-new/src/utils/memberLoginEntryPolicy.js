export const isPreOrderMemberLoginShown = ({
  isRequired,
  isPreOrderLoginHidden,
}) => Boolean(isRequired || !isPreOrderLoginHidden)

export const isMenuMemberLoginEntryShown = (config) => config?.open !== false
