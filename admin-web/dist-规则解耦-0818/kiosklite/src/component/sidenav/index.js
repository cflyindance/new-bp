import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './sidenav.module.scss';
import {
  judegStepIsHasMustDish,
  allRangHandler,
  getCurrentItemLanguage,
  getDishItemLanguage,
  getComboSectionInfo,
} from '@/utils/busTools';

class SideNav extends Component {
  // 判断当前步骤下的菜是否可以重复选择
  judegStepCanRepeated = (sideNavId) => {
    const { sideNavList } = this.props;
    return getComboSectionInfo(sideNavList, sideNavId)?.allowRepeatedItems;
  };

  // // 点击上一步、下一步
  // handlePrveOrNext = (type) => {
  //   const { sectionIndex, sideNavList } = this.props;
  //   let idx = sectionIndex;
  //   if (type == 'prev') {
  //     idx--;
  //   } else if (type == 'next') {
  //     idx++;
  //   }
  //   this.props.setCurSectionId(idx, sideNavList);
  //   this.props.handleChildUpTop(idx);
  // };

  // 点击左侧栏某一步骤
  handleLeftOneStep = (idx) => {
    const { sideNavList } = this.props;
    this.props.setCurSectionId(idx, sideNavList);
    this.props.handleChildUpTop(idx);
  };

  render() {
    const {
      t,
      i18n: { language },
      sideNavList,
      sectionIndex,
      currentOrderCombo,
      isInFreeItem,
      isPromotionItem,
    } = this.props;

    let chooseTipMap = allRangHandler(sideNavList, t, {isInFreeItem, isPromotionItem});
    let o = judegStepIsHasMustDish(sideNavList, currentOrderCombo);

    return (
      <React.Fragment>
        <div id="sideNavId" className={styles.sideNav}>
          {(sideNavList || []).map((section, index) => {
            let sectionName = section.name;
            if (section.id == -1) {
              if (section?.info) {
                sectionName =
                  getDishItemLanguage(section.info.fieldDisplayNameGroups, language) ||
                  section.name;
              }
            } else if (section.id == -3) {
              sectionName = t('item_option');
            } else {
              if (section?.fieldDisplayNameGroups?.length) {
                sectionName =
                  getCurrentItemLanguage(section.fieldDisplayNameGroups, language) || section.name;
              }
            }

            let isHasMustDish = section.id > 0 && ![-98, -99].includes(section.id) && !o[section.id];
            let isCanRepeated = this.judegStepCanRepeated(section.id);

            return (
              <div
                key={section.id}
                name="section"
                className={[
                  styles.sectionInfo,
                  index === sectionIndex ? styles.sectionInfoSelected : '',
                ].join(' ')}
                onClick={() => {
                  this.handleLeftOneStep(index);
                }}
              >
                <div className={styles.sectionName}>{sectionName}</div>
                {/* {!isCanRepeated && section.id > 0 && (
                  <div className={styles.noAllow}>({t('no-allow-repeated-item')})</div>
                )} */}
                <div className={styles.rangTip}>{chooseTipMap[section.id] || ''}</div>
                <div
                  style={{
                    display: isHasMustDish ? 'block' : 'none',
                  }}
                  className={styles.mustDish}
                >
                  ({t('must-select-pre-dish')})
                </div>
              </div>
            );
          })}
        </div>

        {/* 上一步、下一步 */}
        {/*<div className={styles.sideBtnBox} ref={(el) => (this.sideBtnBoxDom = el)}>*/}
        {/*  <div*/}
        {/*    className={[*/}
        {/*      styles.btnPrev,*/}
        {/*      sectionIndex == 0 ? styles.noActivedPrev : styles.activedPrev,*/}
        {/*    ].join(' ')}*/}
        {/*    onClick={() => {*/}
        {/*      if (sectionIndex != 0) {*/}
        {/*        this.handlePrveOrNext('prev');*/}
        {/*      }*/}
        {/*    }}*/}
        {/*  >*/}
        {/*    {t('prev')}*/}
        {/*  </div>*/}

        {/*  <div*/}
        {/*    className={[*/}
        {/*      styles.btnNext,*/}
        {/*      sectionIndex == sideNavList.length - 1 ? styles.noActivedNext : styles.activedNext,*/}
        {/*    ].join(' ')}*/}
        {/*    onClick={() => {*/}
        {/*      if (sectionIndex != sideNavList.length - 1) {*/}
        {/*        this.handlePrveOrNext('next');*/}
        {/*      }*/}
        {/*    }}*/}
        {/*  >*/}
        {/*    {t('next')}*/}
        {/*  </div>*/}
        {/*</div>*/}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
    currentOrderCombo: state.currentOrderCombo,
  };
}

export default connect(mapStateToProps)(withTranslation()(SideNav));
