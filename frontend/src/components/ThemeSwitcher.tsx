import React, { useContext } from 'react';
import { ThemeContext, Theme } from '../theme';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <select
      value={theme}
      onChange={e => setTheme(e.target.value as Theme)}
      style={{ marginLeft: 'auto', padding: 4 }}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="amber">Amber</option>
    </select>
  );
};

export default ThemeSwitcher;
