import { useCallback, useEffect, useState } from 'react';
import { getSetting, updateSetting } from '@/services/settings';

export function useSettingValue<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getSetting<T>(key, fallback);
      setValue(next);
    } finally {
      setLoading(false);
    }
  }, [fallback, key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (next: T) => {
      setValue(next);
      await updateSetting(key, next);
    },
    [key],
  );

  return {
    value,
    setValue,
    save,
    reload,
    loading,
  };
}
