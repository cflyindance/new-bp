import { useState, useEffect } from 'react'
import { useBoolean, useMount } from 'ahooks'
import styles from './BrandBusinessTime.module.less'
import { getRestaurantHour } from '@/services/menus'
import { getBsTime } from '@/utils/getBsTime'
import useSystemConfig from '@/hooks/useSystemConfig'
import { Checkbox, Button, Table, Row, Col, Space } from 'antd'
import { Dialog } from '@material-ui/core'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

const { Group } = Checkbox

const BrandBusinessTime = () => {
  const [bsTime, setBsTime] = useState([])
  const [hourInfo, setHourInfo] = useState([])
  const [tableData, setTableData] = useState([])
  const [currentEditItem, setCurrentEditItem] = useState('')
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const [openBuffetSelect, { setTrue, setFalse }] = useBoolean()
  const { t } = useTranslation()
  const brandSetting = getGlobalConfig(13)

  useMount(() => {
    initBsHour()
  })

  useEffect(() => {
    if (brandSetting?.brandBusinessTime?.length) {
      setTableData(brandSetting?.brandBusinessTime)
      return
    }
    if (brandSetting?.typeSetting?.type) {
      const originData = brandSetting?.typeSetting?.type.map((each) => {
        return {
          name: each,
          businessTime: [],
        }
      })
      setTableData(originData)
    }
  }, [brandSetting, setTableData])

  const initBsHour = async () => {
    const res = await getRestaurantHour()
    if (res?.hours?.length) {
      const newHours = getBsTime(res.hours)
      setHourInfo(newHours)
    }
  }

  const columns = [
    {
      title: t('SystemSetting.brandName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('SystemSetting.brandBusinessTime'),
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
            setCurrentEditItem(row.name)
            setBsTime(row.businessTime)
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
    setCurrentEditItem('')
    setBsTime([])
  }

  const handleConfirmTime = () => {
    const brandBusinessTime = tableData.map((each) => {
      if (each.name === currentEditItem) {
        return {
          ...each,
          businessTime: bsTime,
        }
      }
      return each
    })
    changeGlobalConfig(13, {
      ...brandSetting,
      brandBusinessTime,
    })
    handleCloseModal()
  }

  return (
    <div className={styles.brandBusinessWrapper}>
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

export default BrandBusinessTime
