import { Button, Modal, Switch, Select, TreeSelect } from 'antd'
import { useState } from 'react'
import styles from './Schedule.module.less'
import { useBoolean, useMount } from 'ahooks'
import DateWeekTime from '@/components/DateWeekTime'
import { Card } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import useSetGlobalConfigItem from '@/hooks/useSystemConfig'
import { listStaff } from '@/services/system'
import { getAreas } from '@/services/tables'
import { nanoid } from 'nanoid'
import { useTranslation } from 'react-i18next'
import message from '@/components/Message'

const { Option } = Select

const initialValue = {
  weekDay: [],
  startTime: null,
  endTime: null,
  selectedStaff: [],
  selectedArea: [],
}

const Schedule = () => {
  const { t } = useTranslation()
  const [scheduleSetting, { setTrue, setFalse }] = useBoolean()
  const [value, setValue] = useState(initialValue)
  const [staffList, setStaffList] = useState([])
  const [areaList, setAreaList] = useState([])
  const { getGlobalConfig, changeGlobalConfig } = useSetGlobalConfigItem()

  const oldVal = getGlobalConfig(30)
  const isOpen = oldVal?.open
  const dataList = oldVal?.scheduleSetting

  useMount(() => {
    getStaffList()
    getAreaList()
  })

  const handleCloseModal = () => {
    setFalse()
    setValue(initialValue)
  }

  const handleAddSchedule = () => {
    setTrue()
  }

  const handleSwitchChange = (newValue) => {
    const oldVal = getGlobalConfig(30)
    changeGlobalConfig(30, { ...oldVal, open: newValue })
  }

  const getStaffList = async () => {
    const res = await listStaff()
    if (res?.staff?.length > 0) {
      setStaffList(res.staff)
    }
  }

  const getAreaList = async () => {
    const res = await getAreas()
    if (res?.areas?.length) {
      setAreaList(res.areas)
    }
  }

  const handleChangeStaff = (newValue) => {
    setValue({
      ...value,
      selectedStaff: newValue,
    })
  }

  const handleChangeArea = (newValue) => {
    setValue({
      ...value,
      selectedArea: newValue,
    })
  }

  const handleValidate = () => {
    const { weekDay, startTime, endTime, selectedStaff, selectedArea } = value
    return !(
      !startTime ||
      !endTime ||
      !weekDay.length ||
      !selectedStaff.length ||
      !selectedArea.length
    )
  }

  const handleSaveSetting = () => {
    // 校验
    const res = handleValidate()
    if (!res) return message.warn(t('schedule.validate'))

    // 编辑
    if (value?.id) {
      const newData = dataList?.map((each) => {
        if (each.id === value?.id) {
          return value
        }
        return each
      })
      changeGlobalConfig(30, { ...oldVal, scheduleSetting: newData })
    } else {
      // 新增
      changeGlobalConfig(30, {
        ...oldVal,
        scheduleSetting: [...dataList, { ...value, id: nanoid() }],
      })
    }
    // 关闭弹窗 清空暂存数据
    handleCloseModal()
  }

  const handleEditItem = (item) => {
    setValue(item)
    setTrue()
  }

  const handleDeleteItem = (item) => {
    const { id } = item
    const newDataList = dataList.filter((each) => each.id !== id)
    changeGlobalConfig(30, {
      ...oldVal,
      scheduleSetting: newDataList,
    })
  }

  return (
    <>
      <div className={styles.scheduleWrapper}>
        <div className={styles.scheduleSwitch}>
          <Card elevation={0}>
            <CardHead
              title={t('schedule.title')}
              action={
                <Switch
                  checked={isOpen}
                  onChange={(v) => handleSwitchChange(v)}
                />
              }
            />
          </Card>
        </div>

        {isOpen && (
          <div className={styles.contentWrapper}>
            <div className={styles.operationRow}>
              <Button
                type="primary"
                className={styles.add}
                onClick={handleAddSchedule}
              >
                {t('schedule.add')}
              </Button>
            </div>
            <div className={styles.contentList}>
              {dataList?.map((each) => {
                return (
                  <div key={each.id} className={styles.contentItem}>
                    <div className={styles.content}>
                      {/*<div>{each.startTime}</div>*/}
                      {/*<div>{each.endTime}</div>*/}
                      <div className={styles.staff}>
                        {each.selectedStaff.map((staff, i) => {
                          const staffName = staffList.find(
                            (each) => each.user.id === staff
                          )
                          return (
                            <div className={styles.staffItem} key={staff}>
                              {staffName?.name}
                              {i !== each.selectedStaff.length - 1 && (
                                <span>、</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className={styles.time}>
                        <span>{each.weekDay.join(', ')}</span>
                        <span className={styles.divider}>, </span>
                        <span> {each.startTime}</span>
                        <span> — </span>
                        <span> {each.endTime}</span>
                      </div>
                      <div className={styles.area}>
                        {each.selectedArea.map((area, i) => {
                          let tableName = ''
                          const areaName = areaList.find((a) =>
                            a.tables.find((t) => t.id === area)
                          )?.name
                          areaList.forEach((list) => {
                            list.tables.forEach((table) => {
                              if (table.id === area) {
                                tableName = table.name
                              }
                            })
                          })
                          return (
                            <span key={area}>
                              <span>
                                {areaName}-{tableName}{' '}
                              </span>
                              {i !== each.selectedArea.length - 1 && (
                                <span>、</span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className={styles.operation}>
                      <Button type="link" onClick={() => handleEditItem(each)}>
                        {t('schedule.edit')}
                      </Button>
                      <Button
                        type="link"
                        onClick={() => handleDeleteItem(each)}
                      >
                        {t('SystemSetting.delete')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <Modal
        open={scheduleSetting}
        onCancel={handleCloseModal}
        onOk={handleSaveSetting}
        width={700}
      >
        <div className={styles.scheduleModal}>
          <DateWeekTime value={value} onChange={setValue} />
          <div className={styles.timeRow}>
            <div className={styles.timeLabel}>
              {t('schedule.selectEmployee')}
            </div>
            <div className={styles.weekSet}>
              <Select
                onChange={handleChangeStaff}
                value={value.selectedStaff}
                style={{ width: 400 }}
                placeholder={t('schedule.employeeTip')}
                mode="multiple"
                allowClear
              >
                {staffList
                  ?.filter((s) => !s.user.systemUser)
                  ?.map((each) => {
                    return (
                      <Option value={each.user.id} key={each.user.id}>
                        {each.name}
                      </Option>
                    )
                  })}
              </Select>
            </div>
          </div>
          <div className={styles.timeRow}>
            <div className={styles.timeLabel}>{t('schedule.tableNumber')}</div>
            <div className={styles.weekSet}>
              <div style={{ width: 400 }}>
                <TreeSelect
                  onChange={handleChangeArea}
                  value={value.selectedArea}
                  style={{ width: '100%' }}
                  placeholder={t('schedule.tableNumberTip')}
                  allowClear
                  treeData={areaList}
                  listHeight={660}
                  showArrow
                  treeCheckable
                  maxTagCount={10}
                  treeDefaultExpandAll
                  fieldNames={{
                    label: 'name',
                    value: 'id',
                    children: 'tables',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Schedule
