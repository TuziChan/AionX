import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Space, Typography, Select } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

function TestPage() {
  const { t, i18n } = useTranslation();
  const [count, setCount] = useState(0);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-8">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title heading={2}>{t('app.welcome')}</Title>

          <Paragraph>
            这是一个测试页面，用于验证 Tauri 2.x + React + Arco Design + UnoCSS + i18next 配置是否正常。
          </Paragraph>

          <Space>
            <span>语言切换：</span>
            <Select
              defaultValue={i18n.language}
              onChange={changeLanguage}
              style={{ width: 150 }}
            >
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="zh-TW">繁體中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
              <Select.Option value="ja">日本語</Select.Option>
              <Select.Option value="ko">한국어</Select.Option>
              <Select.Option value="es">Español</Select.Option>
            </Select>
          </Space>

          <Space>
            <Button type="primary" onClick={() => setCount(count + 1)}>
              点击次数: {count}
            </Button>
            <Button onClick={() => setCount(0)}>重置</Button>
          </Space>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-blue-600">UnoCSS 样式测试</p>
            <p className="font-bold">粗体文本</p>
            <p className="text-sm text-gray-500">小号灰色文本</p>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default TestPage;
