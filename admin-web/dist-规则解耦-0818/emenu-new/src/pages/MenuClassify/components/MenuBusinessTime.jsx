import styles from './MenuBusinessTime.module.less'
import { Button, Checkbox, Col, Row, Space, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import { useBoolean, useMount } from 'ahooks'
import { useEffect, useMemo, useState } from 'react'
import { getRestaurantHour } from '@/services/menus'
import { getBsTime } from '@/utils/getBsTime'
import useSystemConfig from '@/hooks/useSystemConfig'
import classNames from 'classnames'
import { Dialog } from '@material-ui/core'

const { Group } = Checkbox
const configId = 52

const MenuBusinessTime = () => {
  const { t } = useTranslation()
  const [bsTime, setBsTime] = useState([])
  const [currentEditItem, setCurrentEditItem] = useState(null)
  const [openBuffetSelect, { setTrue, setFalse }] = useBoolean()
  const [tableData, setTableData] = useState([])
  const [hourInfo, setHourInfo] = useState([])
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const menuClassifySetting = getGlobalConfig(configId)

  const allMenuClassify = useMemo(() => {
    return menuClassifySetting?.menuClassifySetting || []
  }, [menuClassifySetting])

  const initBsHour = async () => {
    const res = await getRestaurantHour()
    if (res?.hours?.length) {
      const newHours = getBsTime(res.hours)
      setHourInfo(newHours)
    }
  }

  useMount(() => {
    initBsHour()
  })

  useEffect(() => {
    if (allMenuClassify?.length) {
      setTableData(allMenuClassify)
    }
  }, [allMenuClassify])

  const columns = [
    {
      title: t('SystemSetting.menuClassifyName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('SystemSetting.brandBusinessTime'),
      key: 'businessTime',
      dataIndex: 'businessTime',
      render: (_, record) => {
        const names = record.businessTime?.map((each) => each.name)
        if (names?.length) {
          return <span>{names.join('/')}</span>
        }
        return <span>All Day</span>
      },
    },
    {
      title: t('SystemSetting.operation'),
      key: 'operation',
      width: 50,
      render: (_, row) => (
        <Button
          type="link"
          onClick={() => {
            setTrue()
            setCurrentEditItem(row)
            setBsTime(row.businessTime || [])
          }}
        >
          {t('SystemSetting.edit')}
        </Button>
      ),
    },
  ]

  const handleSelectHour = (val) => {
    const bsTime = hourInfo.filter((each) => val.includes(each.id))
    setBsTime(bsTime)
  }

  const handleCloseModal = () => {
    setFalse()
    setCurrentEditItem(null)
    setBsTime([])
  }

  const handleConfirmTime = () => {
    const newMenuClassify = tableData.map((each) => {
      if (each.id === currentEditItem.id) {
        return {
          ...each,
          businessTime: bsTime,
        }
      }
      return each
    })
    const newVal = {
      ...menuClassifySetting,
      menuClassifySetting: newMenuClassify,
    }
    changeGlobalConfig(configId, newVal)
    handleCloseModal()
  }

  return (
    <div className={styles.businessWrapper}>
      <Table columns={columns} dataSource={tableData} pagination={false} />
      <Dialog open={openBuffetSelect} onClose={handleCloseModal}>
        <div className={styles.businessTimeWrapper}>
          <header className={styles.title}>
            {t('SystemSetting.brandBusinessTime')}
          </header>
          <Group
            value={bsTime.map((each) => each.id)}
            onChange={handleSelectHour}
          >
            {hourInfo.map((each, idx) => {
              return (
                <Row key={idx}>
                  <Col span={24}>
                    <div className={styles.hourRow}>
                      <Checkbox value={each.id}>{each.name}</Checkbox>
                      <span>{each.from}</span>
                      <span> to </span>
                      <span>{each.to} </span>
                      <div className={styles.bsDay}>
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(
                          (day) => {
                            return (
                              <div
                                className={classNames(
                                  styles.dayItem,
                                  each.bsDay.includes(day) && styles.work
                                )}
                                key={day}
                              >
                                {day}
                              </div>
                            )
                          }
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              )
            })}
          </Group>
          <footer className={styles.footerOperation}>
            <Space size={16}>
              <Button onClick={handleCloseModal}>
                {t('AdminSetting.btn_cancel')}
              </Button>
              <Button type="primary" onClick={handleConfirmTime}>
                {t('ChooseLicense.confirm')}
              </Button>
            </Space>
          </footer>
        </div>
      </Dialog>
    </div>
  )
}

export default MenuBusinessTime
