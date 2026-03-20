import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/services/settings';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';

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
      onValueChange={async (value) => {
        try {
          await changeLanguage(value);
          await i18n.changeLanguage(value);
          toast.success('语言已切换');
        } catch (error) {
          toast.error(`语言切换失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }}
    >
      <SelectTrigger aria-label="切换语言" className="w-[160px]">
        <SelectValue placeholder="选择语言" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
