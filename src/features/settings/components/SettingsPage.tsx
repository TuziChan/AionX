import { Card } from '@arco-design/web-react';
import { SettingsField, type SettingsFieldDefinition } from './SettingsField';

export interface SettingsSectionDefinition {
  key: string;
  title: string;
  fields: SettingsFieldDefinition[];
}

interface SettingsPageProps {
  sections: SettingsSectionDefinition[];
}

export function SettingsPage({ sections }: SettingsPageProps) {
  return (
    <div className="settings-page-shell">
      {sections.map((section) => (
        <Card key={section.key} className="settings-card" bordered={false}>
          <div className="settings-card__header">
            <h2>{section.title}</h2>
          </div>
          <div className="settings-card__body">
            {section.fields.map((field) => (
              <SettingsField key={field.key} field={field} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
