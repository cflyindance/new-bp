import React, { Component } from 'react';

const COUNT_DOWN_TIME = 60;

class CountDown extends Component {
  state = {
    time: this.props.countDownTime || COUNT_DOWN_TIME,
    isFinished: false,
  };

  timer = null;

  onBeforeStart = () => {
    this.resetCountDownState();
  };

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  start = () => {
    this.onBeforeStart();
    this.timer = setInterval(() => {
      this.setState(
        (prev) => ({
          time: prev.time - 1,
        }),
        () => {
          if (this.state.time === 0) {
            this.stop();
          }
        },
      );
    }, 1000);
  };

  stop = () => {
    const { onFinishedEffect } = this.props;
    this.resetCountDownState(true);
    onFinishedEffect?.();
  };

  resetCountDownState = (isFinished = false) => {
    const { countDownTime } = this.props;
    this.setState({
      isFinished,
      time: countDownTime || COUNT_DOWN_TIME,
    });
    this.timer && clearInterval(this.timer);
    this.timer = null;
  };

  render() {
    const { t } = this.props;
    const { time, isFinished } = this.state;
    if (isFinished) {
      return <span>{t('reSendCode')}</span>;
    }

    return (
      <span>
        ({time}s){t('timeLeft')}
      </span>
    );
  }
}

export default CountDown;
