import React, { useState, useEffect, useMemo } from 'react';
import Lottie from 'lottie-react';

const LottiePlayer = (props) => {
  const {
    animationData: propAnimationData, // 直接导入的 JSON 对象
    path, // JSON 文件的 public 路径
    loop = true,
    autoplay = true,
    speed = 1,
    renderer = 'svg', //渲染模式 'svg' | 'canvas' | 'html';
    width = '100%',
    height = 'auto',
    onLoaded, //动画加载完成回调
    onComplete, //动画播放完成回调
  } = props;
  const lottieRef = React.useRef(null);
  const [animationData, setAnimationData] = useState(propAnimationData || null);
  const [error, setError] = useState(null);

  // 当 propAnimationData 变化时更新状态
  useEffect(() => {
    if (propAnimationData) {
      setAnimationData(propAnimationData);
      onLoaded?.();
    }
  }, [propAnimationData, onLoaded]);

  // 动态加载 JSON 文件（如果使用 path）
  useEffect(() => {
    if (path) {
      fetch(path)
        .then((response) => response.json())
        .then((data) => {
          setAnimationData(data);
          onLoaded?.();
        })
        .catch((err) => setError(`加载动画失败: ${err.message}`));
    }
  }, [path, onLoaded]);

  // 合并动画配置
  const animationConfig = useMemo(
    () => ({
      loop,
      autoplay,
      animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      },
    }),
    [animationData, loop, autoplay]
  );

  // 设置播放速度
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed]);

  if (error) {
    return <div className="lottie-error">{error}</div>;
  }

  if (!animationData) {
    return <div className="lottie-loading">Loading...</div>;
  }

  return (
    <div style={{ width, height }}>
      <Lottie
        lottieRef={lottieRef}
        {...animationConfig}
        renderer={renderer}
        onComplete={onComplete}
      />
    </div>
  );
};

export default LottiePlayer;
