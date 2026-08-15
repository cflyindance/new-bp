import useSystemConfig from '@/hooks/useSystemConfig'
import { useMemo } from 'react'
import styles from './TypeSetting.module.less'
import { DEFAULT_AGE, DEFAULT_CATEGORY } from '@/constants/systemConfig'
import SingleSetting from './SingleSetting'
import { getDefaultBrandSetting } from '@/utils/brandMenuCount'

const configId = 13

const TypeSetting = () => {
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const brandSetting = getGlobalConfig(13)

  const typeSetting = useMemo(() => {
    return brandSetting?.typeSetting
  }, [brandSetting])

  const brandMeuSetting = useMemo(() => {
    return brandSetting?.brandMeuSetting || []
  }, [brandSetting])

  const brandBusinessTime = useMemo(() => {
    return brandSetting?.brandBusinessTime
  }, [brandSetting])

  const alias = useMemo(() => {
    return (
      brandSetting?.alias || {
        age: null,
        type: null,
      }
    )
  }, [brandSetting])

  const setNewContent = (newVal, key, newContent) => {
    const newBrand =
      key === 'age'
        ? getDefaultBrandSetting([newContent], typeSetting?.type || [])
        : getDefaultBrandSetting(typeSetting?.age || [], [newContent], {
            getTypeMark,
          })
    const currentValue = {
      ...brandSetting,
      typeSetting: {
        ...(brandSetting.typeSetting || {}),
        [key]: [...newVal],
      },
      brandMeuSetting: brandMeuSetting.concat(newBrand),
    }
    // 设置过营业时间
    if (brandBusinessTime?.length && key === 'type') {
      currentValue.brandBusinessTime = [
        ...brandBusinessTime,
        { name: newContent, businessTime: [] },
      ]
    }
    changeGlobalConfig(configId, currentValue)
  }

  const removeBrandMenuSetting = (settingType, name, newContentList) => {
    const currentValue = {
      ...brandSetting,
      typeSetting: {
        ...(brandSetting.typeSetting || {}),
        [settingType]: [...newContentList],
      },
      brandMeuSetting: brandMeuSetting.filter((each) => {
        const { typeAItem, typeBItem } = each
        if (settingType === 'age') return typeAItem !== name
        if (settingType === 'type') return typeBItem !== name
      }),
    }
    // 设置过营业时间
    if (brandBusinessTime?.length && settingType === 'type') {
      currentValue.brandBusinessTime = brandBusinessTime.filter(
        (each) => each.name !== name
      )
    }
    changeGlobalConfig(configId, currentValue)
  }

  const editBrandMenuSetting = (settingType, oldVal, newVal) => {
    const currentValue = {
      ...brandSetting,
      typeSetting: {
        age: brandSetting.typeSetting.age?.map((typeAItem) => {
          return typeAItem === oldVal ? newVal : typeAItem
        }),
        type: brandSetting.typeSetting.type?.map((typeBItem) => {
          return typeBItem === oldVal ? newVal : typeBItem
        }),
      },
      brandMeuSetting: brandMeuSetting.map((each) => {
        const { typeAItem, typeBItem } = each
        if (settingType === 'age' && typeAItem === oldVal) {
          return {
            ...each,
            typeAItem: newVal,
            itemName: `${newVal}-${typeBItem}`,
          }
        }
        if (settingType === 'type' && typeBItem === oldVal) {
          return {
            ...each,
            typeBItem: newVal,
            itemName: `${typeAItem}-${newVal}`,
          }
        }
        return each
      }),
    }
    // 设置过营业时间
    if (brandBusinessTime?.length && settingType === 'type') {
      currentValue.brandBusinessTime = brandBusinessTime.map((each) => {
        if (each.name === oldVal) {
          return {
            ...each,
            name: newVal,
          }
        }
        return each
      })
    }
    changeGlobalConfig(configId, currentValue)
  }

  const changeTitleAlias = (settingType, newVal) => {
    const currentValue = {
      ...brandSetting,
      alias: {
        ...brandSetting.alias,
        [settingType]: newVal,
      },
    }
    changeGlobalConfig(configId, currentValue)
  }

  const changeMark = (val, each) => {
    const newBrandMeuSetting = brandMeuSetting.map((setting) => {
      const { typeAItem } = setting
      return typeAItem === each ? { ...setting, mark: val } : setting
    })
    const currentValue = {
      ...brandSetting,
      brandMeuSetting: newBrandMeuSetting,
    }
    changeGlobalConfig(configId, currentValue)
  }

  const getTypeMark = (typeA) => {
    const typeMark = brandMeuSetting.find(
      (each) => each.typeAItem === typeA
    )?.mark
    return typeMark || undefined
  }

  return (
    <div className={styles.typeSettingWrapper}>
      {[
        { contentList: typeSetting?.age || DEFAULT_AGE, settingType: 'age' },
        {
          contentList: typeSetting?.type || DEFAULT_CATEGORY,
          settingType: 'type',
        },
      ].map((each) => {
        return (
          <SingleSetting
            removeBrandMenuSetting={removeBrandMenuSetting}
            settingType={each.settingType}
            contentList={each.contentList}
            setNewContent={setNewContent}
            key={each.settingType}
            editBrandMenuSetting={editBrandMenuSetting}
            alias={alias}
            changeTitleAlias={changeTitleAlias}
            changeMark={changeMark}
            getTypeMark={getTypeMark}
          />
        )
      })}
    </div>
  )
}

export default TypeSetting
