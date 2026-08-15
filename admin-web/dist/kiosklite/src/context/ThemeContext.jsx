import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    themeName: 'default',
    primary: '#FFB702',
    secondary: '#FFD754',
  }); // 默认主题

  useEffect(() => {
    // 后期可以配置主题色or切换某些主题色
    // toggleTheme({
    //   themeName: '#f9810c',
    //   primary: '#f9810c',
    //   secondary: '#fcc086',
    // });
  }, []);

  const toggleTheme = (newTheme) => {
    console.log('切换主题：', newTheme);
    //考虑保存本地，保留上一次选择？
    setTheme(() => newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
