import { Select } from 'antd';
const { Option } = Select;

// Принимаем lang и setLang как параметры
export const LanguageSwitcher = ({ currentLang, onLangChange }) => {
  return (
    <Select 
      defaultValue="ru" 
      value={currentLang} 
      onChange={onLangChange} 
      style={{ width: 120, marginLeft: 10 }} 
      variant="borderless"
    >
        <Option value="uz">🇺🇿 O'zbek</Option>
        <Option value="ru">🇷🇺 Русский</Option>
        <Option value="en">🇬🇧 English</Option>
    </Select>
  );
};