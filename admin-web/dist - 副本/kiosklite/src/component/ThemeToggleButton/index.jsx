import React from 'react';
import styles from './ThemeToggleButton.module.scss';
import { useTheme } from '@/context/ThemeContext';
import { MoonFilled, SunFilled } from '@ant-design/icons';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`${styles.switchBox} ${theme === 'Light' ? styles.Light : styles.Dark}`}
    >
      <div
        className={`${styles.occupied} ${theme === 'Dark' ? styles.Dark : ''}`}
      ></div>
      <span>{theme}</span>
      <div
        className={`${styles.occupied} ${theme === 'Light' ? styles.Light : ''}`}
      ></div>
      {theme === 'Light' ? (
        <SunFilled
          className={`${styles.icon} ${theme === 'Light' ? styles.Light : ''}`}
          style={{ color: '#fcb600', fontSize: 20 }}
          onClick={toggleTheme}
        />
      ) : (
        <MoonFilled
          className={`${styles.icon} ${theme === 'Dark' ? styles.Dark : ''}`}
          style={{ color: '#fcb600', fontSize: 20 }}
          onClick={toggleTheme}
        />
      )}
    </div>
  );
};

export default ThemeToggleButton;
