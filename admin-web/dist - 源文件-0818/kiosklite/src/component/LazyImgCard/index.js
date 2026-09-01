import React from 'react';
import { connect } from 'react-redux';
import styles from './index.module.scss';
import defaultImage from '../../assets/images/sushi.jpg';
import { getCookie } from '@/utils';

class LazyImgCard extends React.Component {
  render() {
    const { itemInfo, selfConfig } = this.props;

    // 判断图片显示效果（id:18）
    const objectFit = selfConfig?.configMap?.id_18 ? 'cover' : 'contain';

    // 判断是否存在图片地址
    let imgPath = defaultImage;
    if (itemInfo.thumbPath) {
      imgPath = getCookie('kioskServerIP') + itemInfo.thumbPath;
    }

    return (
      <div className={styles.imgBox}>
        <img
          className="dish-item-img"
          data-src={imgPath}
          ref={(el) => (this.imgDom = el)}
          style={{
            objectFit,
          }}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps, {})(LazyImgCard);
