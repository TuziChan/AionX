import { Message, Select } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/services/settings';

const options = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
  { label: 'Español', value: 'es' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      options={options}
      onChange={async (value) => {
        try {
          await changeLanguage(String(value));
          await i18n.changeLanguage(String(value));
          Message.success('语言已切换');
        } catch (error) {
          Message.error(`语言切换失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }}
    />
  );
}
