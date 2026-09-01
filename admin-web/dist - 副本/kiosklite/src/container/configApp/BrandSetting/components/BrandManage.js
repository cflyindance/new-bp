import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Button, Table } from 'antd';
import BrandInfo from './BrandInfo';
import Modal from '../../../../component/Modal';
import styles from './brandManage.module.scss';
import IMG_HOST from '../../../../utils/getImageHost';
import { getTableScroll } from '@/utils/countTableScroll';
import defaultImage from '@/assets/images/sushi.jpg';

class BrandManage extends Component {
  state = {
    scrollY: getTableScroll(),
  };

  handleAddBrandSetting = async () => {
    const { brandManage, handleEditBrandManage, t } = this.props;
    const res = await Modal.loadModal(<BrandInfo />, {
      width: '700px',
      footer: null,
      title: t('add-brand'),
    });
    if (res) {
      const newItem = {
        ...res,
        id: uuidv4(),
      };
      handleEditBrandManage([...brandManage, newItem]);
    }
  };

  handleRemoveBrand = (id) => {
    const { brandManage, handleEditBrandManage } = this.props;
    const newBrandManage = brandManage.filter((each) => each.id !== id);
    handleEditBrandManage(newBrandManage);
  };

  handleEditBrand = async (brandInfo) => {
    const { brandManage, handleEditBrandManage, t } = this.props;
    const res = await Modal.loadModal(<BrandInfo brandInfo={brandInfo} />, {
      width: '700px',
      footer: null,
      title: t('edit-brand'),
    });
    if (res) {
      const newBrandManage = brandManage.map((each) => {
        if (each.id === brandInfo.id)
          return {
            ...each,
            ...res,
          };
        return each;
      });
      handleEditBrandManage(newBrandManage);
    }
  };

  renderColumns = () => {
    const { t } = this.props;
    return [
      {
        title: t('table-name'),
        dataIndex: 'name',
      },
      {
        title: t('table-img'),
        dataIndex: 'imgSrc',
        render: (src) => {
          return (
            <img
              className={styles.brandItemImg}
              src={src ? `${IMG_HOST}/${src}` : defaultImage}
              alt="brand image"
            />
          );
        },
      },
      {
        title: t('table-bsTime'),
        dataIndex: 'bsTime',
        render: (bsTime) => {
          const names = bsTime.map((each) => each.name);
          return <span>{names.join('/')}</span>;
        },
      },
      {
        title: t('table-operation'),
        key: 'Operation',
        render: (_, row) => {
          const { id } = row;
          return (
            <div>
              <Button type="link" onClick={() => this.handleRemoveBrand(id)}>
                {t('operate-remove')}
              </Button>
              <Button type="link" onClick={() => this.handleEditBrand(row)}>
                {t('operate-edit')}
              </Button>
            </div>
          );
        },
      },
    ];
  };

  componentDidMount() {
    this.setState({
      scrollY: getTableScroll(),
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.scrollY !== getTableScroll()) {
      this.setState({
        scrollY: getTableScroll(),
      });
    }
  }

  render() {
    const { brandManage, t } = this.props;
    const { scrollY } = this.state;
    return (
      <div className={styles.brandManage}>
        <header className={styles.headerWrapper}>
          <div className={styles.headerInfo}>
            <span>{t('imgFormat')}: PNG、JPG、JPEG</span>
            <span>{t('imgRate')}</span>
            <span>{t('imgSize')}</span>
          </div>
          <Button className={styles.addBtn} type="primary" onClick={this.handleAddBrandSetting}>
            {t('operate-add')}
          </Button>
        </header>
        <main className={styles.tableWrapper}>
          {brandManage?.length > 0 ? (
            <Table
              pagination={false}
              dataSource={brandManage}
              rowKey="id"
              columns={this.renderColumns()}
              scroll={{ y: scrollY }}
            />
          ) : (
            <div className={styles.noData}>{t('no-data')}</div>
          )}
        </main>
      </div>
    );
  }
}

export default withRouter(withTranslation()(BrandManage));
