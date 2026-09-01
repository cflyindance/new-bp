import React from 'react';
import styles from './VtKeyboard.module.scss';
import Keyboard from 'react-simple-keyboard';

class VtKeyboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layoutName: 'default',
      input: '',
    };

    this.layouts = {
      numbers: ['1 2 3', '4 5 6', '7 8 9', '{bksp} 0 @ . {enter}'],
      // 默认布局
      default: [
        '` 1 2 3 4 5 6 7 8 9 0 - = @ {bksp}',
        '{tab} q w e r t y u i o p [ ] \\',
        "a s d f g h j k l ; ' {enter}",
        '{shift} z x c v b n m , . / {shift}',
        '{space}',
      ],
      // Shift 布局
      shift: [
        '~ ! # $ % ^ & * ( ) _ + @ {bksp}',
        '{tab} Q W E R T Y U I O P { } |',
        'A S D F G H J K L : " {enter}',
        '{shift} Z X C V B N M < > ? {shift}',
        '{space}',
      ],
    };
  }
  componentDidMount() {
    this.setState({
      layoutName: this.props.keyboardType === 'number' ? 'numbers' : 'default',
    });
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (nextState.layoutName !== this.state.layoutName) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  componentDidUpdate(prevProps) {
    if (prevProps.keyboardValue !== this.props.keyboardValue) {
      this.keyboard.setInput(this.props.keyboardValue);
    }
  }

  handleKeyPress = (button) => {
    this.executeDefaultKeyLogic(button);
    if (this.props.onKeyPress) {
      this.props.onKeyPress(button);
    }
  };

  executeDefaultKeyLogic = (button) => {
    if (button === '{shift}' || button === '{lock}') {
      this.handleShift();
    } else if (button === '{enter}') {
      this.props.handlePressEnter && this.props.handlePressEnter();
    } else if (button === '{bksp}') {
      this.props.handlePressDelete && this.props.handlePressDelete();
    }
  };

  handleShift = () => {
    let layoutName = this.state.layoutName;
    this.setState({
      layoutName: layoutName === 'default' ? 'shift' : 'default',
    });
  };

  handleInputChange = (input) => {
    this.setState({ input });
    this.keyboard.setInput(input);
    this.props.changeInput && this.props.changeInput(input);
  };

  render() {
    const { VKOuterStyle } = this.props;
    return (
      <div className={styles.keyboardBox} style={VKOuterStyle || {}}>
        <div className={styles.closeKeyboard}>
          <span
            onClick={() => {
              this.props.closeKeyboard && this.props.closeKeyboard();
            }}
          ></span>
        </div>
        <Keyboard
          keyboardRef={(r) => {
            this.keyboard = r;
            this.keyboard.setInput(this.props.keyboardValue);
          }}
          layoutName={this.state.layoutName}
          layout={this.layouts}
          onKeyPress={this.handleKeyPress}
          onChange={this.handleInputChange}
        />
      </div>
    );
  }
}

export default VtKeyboard;
