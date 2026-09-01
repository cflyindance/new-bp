import React from 'react';
import { ConfigProvider } from 'antd';
import {
  StyleProvider,
  legacyLogicalPropertiesTransformer,
} from '@ant-design/cssinjs';

const AntdWrapper = (props) => {
  const { children } = props;

  const countGrid = () => {
    const dpr = window.devicePixelRatio;
    return {
      screenXSMin: 480 * dpr,
      screenXS: 480 * dpr,
      screenXSMax: 575 * dpr,
      screenSMMin: 576 * dpr,
      screenSM: 576 * dpr,
      screenSMMax: 767 * dpr,
      screenMDMin: 768 * dpr,
      screenMD: 768 * dpr,
      screenMDMax: 991 * dpr,
      screenLGMin: 992 * dpr,
      screenLG: 992 * dpr,
      screenLGMax: 1199 * dpr,
      screenXLMin: 1200 * dpr,
      screenXL: 1200 * dpr,
      screenXLMax: 1599 * dpr,
      screenXXLMin: 1600 * dpr,
      screenXXL: 1600 * dpr,
    };
  };

  const getPrimaryColor = () => {
    // 确保在客户端环境下获取变量
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-selected-color')
        .trim();
    }
    return '#FFB600'; // 默认回退颜色
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: getPrimaryColor(),
          ...countGrid(),
        },
      }}
    >
      <StyleProvider
        transformers={[legacyLogicalPropertiesTransformer]}
        hashPriority="high"
      >
        {children}
      </StyleProvider>
    </ConfigProvider>
  );
};

export default AntdWrapper;
