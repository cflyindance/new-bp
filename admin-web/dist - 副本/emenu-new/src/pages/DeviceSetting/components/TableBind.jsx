import { getAreas } from '@/services/tables'
import { useMount } from 'ahooks'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import styles from './BindItem.module.less'
import { Button, Cascader } from 'antd'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'

const TableBind = (props) => {
  const {
    bindingInfo,
    deviceInfo,
    handleChangeDeviceConfig,
    handleSave,
    deviceConfig,
  } = props
  const { t } = useTranslation()
  const [tableArea, setTableArea] = useState([])
  const [selectedTable, setSelectTable] = useState(null)

  useMount(() => {
    getTableArea()
  })

  const bindTableId = useMemo(() => {
    return bindingInfo?.tableId || ''
  }, [bindingInfo])

  const tableId = useMemo(() => {
    return deviceInfo?.tableId || ''
  }, [deviceInfo])

  useEffect(() => {
    if (!tableArea.length) return
    if (bindTableId) {
      const area = bindTableId.split('-')[0]
      const table = bindTableId.split('-')[1]
      setSelectTable([Number(area), Number(table)])
      return
    }
    if (tableId) {
      const area = Number(tableId.split('-')[0])
      const table = Number(tableId.split('-')[1])
      area && table
        ? setSelectTable([Number(area), Number(table)])
        : setSelectTable(null)
    }
  }, [tableId, bindTableId, tableArea])

  const allBindTables = useMemo(() => {
    return deviceConfig
      .map((item) => {
        const { configInfo } = item
        const deviceBindInfo = configInfo.find((config) => config.id === 50)
        return deviceBindInfo?.value?.tableId?.split('-')[1] || ''
      })
      .filter(Boolean)
  }, [deviceConfig])

  // 禁用已被选择的桌子
  const areaTables = useMemo(() => {
    return tableArea.map((area) => {
      return {
        ...area,
        tables: area?.tables?.map((table) => ({
          ...table,
          disabled: allBindTables.includes(String(table.id)),
        })),
      }
    })
  }, [allBindTables, tableArea])

  const getTableArea = async () => {
    try {
      const res = await getAreas()
      if (res?.areas?.length) {
        setTableArea(res.areas)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleChangeTable = (v) => {
    setSelectTable(v) // [areaId, tableId]
  }

  const handleBindDevice = () => {
    const bindTable = {
      ...bindingInfo,
      deviceId: deviceInfo?.deviceId,
      tableId: `${selectedTable[0]}-${selectedTable[1]}`,
    }
    handleChangeDeviceConfig(50, bindTable)
    handleSave()
  }

  const unBindDevice = () => {
    const bindTable = {
      ...bindingInfo,
      tableId: null,
    }
    handleChangeDeviceConfig(50, bindTable)
    handleSave()
  }

  return (
    <div className={styles.bindingItem}>
      <Card elevation={0}>
        <CardHead
          title={
            <div className={styles.bindingInnerContent}>
              <span className={styles.label}>Table:</span>
              <Cascader
                expandTrigger="hover"
                value={selectedTable}
                onChange={handleChangeTable}
                className={styles.list}
                options={areaTables}
                displayRender={(label) => label.join('-')}
                fieldNames={{ label: 'name', value: 'id', children: 'tables' }}
                disabled={!!bindTableId}
              />
              <span
                className={classNames(
                  styles.bindingType,
                  bindTableId && styles.selected
                )}
              >
                {bindTableId ? t('bind.already_bind') : t('bind.not_bind')}
              </span>
            </div>
          }
          subheader={t('bind.bind_subtitle_table')}
          action={
            bindTableId ? (
              <Button onClick={unBindDevice}>{t('bind.unBind_table')}</Button>
            ) : (
              <Button type="primary" onClick={handleBindDevice}>
                {t('bind.bind_table')}
              </Button>
            )
          }
        />
      </Card>
    </div>
  )
}

export default TableBind
