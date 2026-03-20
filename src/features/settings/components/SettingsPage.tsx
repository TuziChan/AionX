import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
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
        <Card key={section.key} className="settings-card">
          <CardHeader className="settings-card__header">
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="settings-card__body">
            {section.fields.map((field) => (
              <SettingsField key={field.key} field={field} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
