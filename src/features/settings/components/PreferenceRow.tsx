import type { ReactNode } from 'react';

interface PreferenceRowProps {
  label: string;
  description?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}

export function PreferenceRow({ label, description, extra, children }: PreferenceRowProps) {
  return (
    <div className="settings-preference-row">
      <div className="settings-preference-row__meta">
        <div className="settings-preference-row__label-wrap">
          <span className="settings-preference-row__label">{label}</span>
          {extra}
        </div>
        {description ? <div className="settings-preference-row__description">{description}</div> : null}
      </div>
      <div className="settings-preference-row__control">{children}</div>
    </div>
  );
}
