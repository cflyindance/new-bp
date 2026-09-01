import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './BrandListContent.module.scss';
import { Col, Row } from 'antd';
import IMG_HOST from '@/utils/getImageHost';
import getBsTime from '@/utils/getBsTime';
import defaultImage from '@/assets/images/sushi.jpg';
import no_brand_image from '@/assets/images/no_brand.png';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { getRestaurantHour } from '@/api/kioskConfigApi';
import { detectLanguageChange } from '@/utils/detectLanguageChange';
import handleBrandDisplayCol from '@/utils/handleBrandDisplayCol';

dayjs.extend(isBetween);

const WEEK_DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

class BrandListContent extends Component {
  componentDidMount() {
    this.initBsHour();
  }

  state = {
    hourInfo: [],
    showModal: false,
  };

  initBsHour = async () => {
    const res = await getRestaurantHour();
    if (res?.data?.msg === 'success') {
      const { data } = res.data;
      const { hours } = data;
      const newHours = getBsTime(hours);
      this.setState({
        hourInfo: newHours,
      });
    }
  };

  checkIsInBsTime = (brandItem) => {
    const { bsTime = [] } = brandItem;
    const { hourInfo } = this.state;
    const day = WEEK_DAY[dayjs().day()];
    const currentBrandBsTime = hourInfo.filter((each) =>
      bsTime.map((time) => time.id).includes(each.id),
    );
    return currentBrandBsTime.find((each) => {
      if (each.bsDay.includes(day)) {
        const today = dayjs().format('YYYY/MM/DD');
        const tomorrow = dayjs().add(1, 'day').format('YYYY/MM/DD');
        const { from, to } = each;
        const isOverFrom = Number(from.replaceAll(':', '')) >= Number(to.replaceAll(':', ''));
        return dayjs().isBetween(
          `${today} ${each.from}`,
          `${isOverFrom ? tomorrow : today} ${each.to}`,
          'minutes',
          '[)',
        );
      }
      return false;
    });
  };

  renderBrandStatus = (brandItem) => {
    const { t, menuGroup } = this.props;
    const allSaleItems = [];
    menuGroup.forEach((g) => {
      g.menuCategories.forEach((c) => {
        if (c?.saleItems) {
          allSaleItems.push(...c.saleItems);
        }
      });
    });
    const saleItemIds = allSaleItems.map((each) => each.id);
    const isHasItem = saleItemIds.filter((each) => brandItem?.dishIds?.includes(each));
    const noDishIds = !brandItem.dishIds?.length;
    if (noDishIds) {
      return (
        <div className={styles.noDishIds}>
          <span>{t('wait-config')}</span>
        </div>
      );
    }
    if (!this.checkIsInBsTime(brandItem)) {
      return (
        <div className={styles.noDishIds}>
          <span>{t('not-in-time')}</span>
        </div>
      );
    }
    if (!isHasItem?.length) {
      return (
        <div className={styles.noDishIds}>
          <span>{t('menu-not-in-time')}</span>
        </div>
      );
    }
    return null;
  };

  handleSelectBrand = (brand) => {
    const { onSelectEffect } = this.props;
    const invalidStatus = this.renderBrandStatus(brand);
    if (!invalidStatus) {
      onSelectEffect?.(brand);
    }
  };

  render() {
    const { t, brandManage, selfConfig } = this.props;
    const colConfig = handleBrandDisplayCol(selfConfig);

    return (
      <main className={styles.mainWrapper}>
        {brandManage?.length > 0 ? (
          <Row className={styles.mainRow} gutter={32}>
            {brandManage.map((each) => {
              return (
                <Col
                  className={styles.brandItem}
                  key={each.id}
                  {...(colConfig.useDefault
                    ? { xs: 12, lg: 8, xl: 6 }
                    : { span: colConfig.colSpan })}
                  onClick={() => this.handleSelectBrand(each)}
                >
                  <div className={styles.imageWrapper}>
                    <img
                      className={styles.brandImage}
                      src={each.imgSrc ? `${IMG_HOST}/${each.imgSrc}` : defaultImage}
                      alt="brand image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultImage;
                      }}
                    />
                    {this.renderBrandStatus(each)}
                  </div>
                  <div className={styles.brandName}>
                    {detectLanguageChange(each.name).split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                </Col>
              );
            })}
          </Row>
        ) : (
          <div className={styles.noBrand}>
            <div className={styles.showNoBrand}>
              <img className={styles.noBrandImg} src={no_brand_image} alt="no brand" />
              <span className={styles.noBrandText}>{t('no-config-data')}</span>
            </div>
          </div>
        )}
      </main>
    );
  }
}

export default withTranslation()(BrandListContent);
