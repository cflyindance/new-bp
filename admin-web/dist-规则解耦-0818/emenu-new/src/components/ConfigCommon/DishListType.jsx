import { useMemo } from 'react'
import { Radio, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@material-ui/core'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'

const { Title } = Typography
const { Group: RadioGroup } = Radio
const DishListType = (props) => {
  const { t } = useTranslation()
  const { value, handleChangeWholeValue, menuItemList } = props

  const type = useMemo(() => {
    return value?.type || ''
  }, [value])

  const smallDishList = useMemo(() => {
    return value?.smallDishList || []
  }, [value])

  const largeDishList = useMemo(() => {
    return value?.largeDishList || []
  }, [value])

  const handleChange = (newValue) => {
    handleChangeWholeValue(
      26,
      type === 'small'
        ? { largeDishList: newValue }
        : { smallDishList: newValue }
    )
  }

  return (
    <div>
      <Title level={3}>{t('displaySetting.dishDisplay_title')}</Title>
      <div style={{ border: '1px solid #d9d9d9', borderRadius: '10px' }}>
        <Card elevation={0}>
          <CardContent>
            <RadioGroup
              value={type}
              onChange={(e) =>
                handleChangeWholeValue(26, { type: e.target.value })
              }
            >
              {['mix', 'small', 'large'].map((each) => {
                return (
                  <Radio key={each} value={each}>
                    {t(`radioOrderSetting.dishDisplay_${each}`)}
                  </Radio>
                )
              })}
            </RadioGroup>
            {['small', 'large'].includes(type) && (
              <div style={{ paddingTop: 32 }}>
                <Title level={5}>
                  {t(`displaySetting.selectDish_${type}`)}
                </Title>
                <TreeSelectDish
                  onChange={handleChange}
                  treeData={menuItemList}
                  value={type === 'small' ? largeDishList : smallDishList}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DishListType
