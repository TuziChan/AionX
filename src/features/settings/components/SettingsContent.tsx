import { Card, Input, Select, Slider, Switch, Tag } from '@arco-design/web-react';
import { getSettingsTabById } from './settingsConfig';
import { getSettingsSections, type SettingsFieldDefinition } from './settingsSchema';

function renderField(field: SettingsFieldDefinition) {
  switch (field.type) {
    case 'input':
      return <Input value={String(field.value)} readOnly />;
    case 'select':
      return (
        <Select
          disabled
          value={String(field.value)}
          options={(field.options || []).map((option) => ({ label: option, value: option }))}
        />
      );
    case 'switch':
      return <Switch checked={Boolean(field.value)} disabled />;
    case 'slider':
      return <Slider value={Number(field.value)} disabled />;
    default:
      return null;
  }
}

export function SettingsContent({ tabId }: { tabId: string }) {
  const tab = getSettingsTabById(tabId);
  const sections = getSettingsSections(tabId);

  return (
    <div className="settings-page">
      <div className="settings-page__hero">
        <div>
          <p className="settings-page__eyebrow">{tab ? tab.label : 'Extension'}</p>
          <h1 className="settings-page__title">{tab ? tab.title : `扩展设置 · ${tabId}`}</h1>
          <p className="settings-page__subtitle">
            {tab ? tab.description : '扩展设置页已预留和内置页同级的视觉包裹层。'}
          </p>
        </div>
        <Tag color="blue">{tab ? 'Built-in Tab' : 'Extension Tab'}</Tag>
      </div>

      <div className="settings-page__grid">
        {sections.map((section) => (
          <Card key={section.title} className="settings-card" bordered={false}>
            <div className="settings-card__header">
              <h2>{section.title}</h2>
            </div>
            <div className="settings-card__body">
              {section.fields.map((field) => (
                <div key={field.label} className="settings-field">
                  <div className="settings-field__meta">
                    <div className="settings-field__label">{field.label}</div>
                  </div>
                  <div className="settings-field__control">{renderField(field)}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
