import { ArrowCircleLeft } from '@icon-park/react';
import { useNavigate } from 'react-router-dom';

export function SettingsBackLink() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="settings-back-link"
      onClick={() => navigate('/guid')}
    >
      <ArrowCircleLeft theme="outline" size="18" className="settings-back-link__icon" />
      <span className="settings-back-link__label">返回应用</span>
    </button>
  );
}
