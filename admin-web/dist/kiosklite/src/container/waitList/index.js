import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import styles from './waitList.module.scss';
import Loading from '../../component/loading';
import BackIcon from '../../component/backIcon';
import Alert from '@material-ui/lab/Alert';
import { on, off } from '@/utils';

class WaitList extends Component {
  constructor() {
    super();
    this.state = {
      isShowBackIcon: true,
      errorApiMsg: '',
      errorApiShow: false,
      manualRefresh: true,
    };
    this.iframeRef = React.createRef();
    this.timer = null;
    this.t = null;
  }

  backBtnHandler = () => {
    this.props.history.goBack();
  };

  // 接口报错提示
  showApiModalTip = (errMsg) => {
    this.setState({
      manualRefresh: false,
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        errorApiMsg: '',
        errorApiShow: false,
      });
    }, 2000);
  };

  // iframe加载完成
  iframeOnload = () => {
    clearTimeout(this.t);
    this.setState({
      manualRefresh: false,
    });
  };

  getMsgData = (event) => {
    if (event.data.type == 'waitListComplete') {
      this.setState({ isShowBackIcon: false });
    } else if (event.data.type == 'waitListClose') {
      this.props.history.push('/');
    }
  };

  componentDidMount() {
    on(window, 'message', this.getMsgData);

    if (this.iframeRef.current) {
      on(this.iframeRef.current, 'load', this.iframeOnload);
    }

    // 15s，iframe还未加载完成则提示
    this.t = setTimeout(() => {
      if (this.state.manualRefresh) {
        this.showApiModalTip('Wait List system loading failed');
      }
    }, 15 * 1000);
  }

  componentWillUnmount() {
    off(window, 'message', this.getMsgData);
    off(this.iframeRef.current, 'load', this.iframeOnload);
    clearTimeout(this.t);
    clearTimeout(this.timer);
  }

  render() {
    const { merchantId } = this.props;
    const { isShowBackIcon, manualRefresh, errorApiShow, errorApiMsg } = this.state;
    const iframeSrc = `https://epager.menusifucloud.com/${merchantId}/front/partySize?mode=kiosk`;

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          {merchantId ? (
            <iframe
              ref={this.iframeRef}
              src={iframeSrc}
              frameBorder="0"
              width="100%"
              height="100%"
              scrolling="auto"
            ></iframe>
          ) : null}
        </div>

        {isShowBackIcon ? <BackIcon clickHandler={this.backBtnHandler}></BackIcon> : null}

        <Loading visible={manualRefresh} />

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    merchantId: state.merchantProfile?.merchantId,
  };
}

export default withRouter(connect(mapStateToProps)(WaitList));
