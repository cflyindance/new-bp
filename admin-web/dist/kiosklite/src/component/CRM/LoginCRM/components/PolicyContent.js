import React, { Component } from 'react';
import styles from './PolicyContent.module.scss';
import Loading from '@/component/loading';

class PolicyContent extends Component {
  state = {
    loading: true,
  };

  handleCheckLoad = () => {
    this.setState({
      loading: false,
    });
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handleLocationChange);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleLocationChange);
  }

  handleLocationChange = () => {
    if (window.location.hash === '#/') {
      this.props.onClose();
    }
  };

  render() {
    const { loading } = this.state;
    const { onClose, url, t } = this.props;

    return (
      <div className={styles.policyBox}>
        <div
          className={styles.policyContent}
          style={{
            visibility: loading ? 'hidden' : 'visible',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <iframe
            onLoad={this.handleCheckLoad}
            style={{
              height: '60vh',
              width: '85rem',
            }}
            src={url}
            frameBorder="0"
          />
          <div className={styles.footerOperation}>
            <div
              className={`${styles.policyBtn} animate-btn`}
              onClick={onClose}
            >
              {t('i-know')}
            </div>
          </div>
        </div>
        <Loading visible={loading} />
      </div>
    );
  }
}

export default PolicyContent;
