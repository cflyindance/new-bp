import { useEmenuProThemeAdapter } from '../../components/EmenuProTheme'

const MemberPriceValue = ({ config, value }) => {
  const { style } = config

  const themeStyles = useEmenuProThemeAdapter(style)

  return <div style={{ ...themeStyles }}>{value}</div>
}

export default MemberPriceValue
