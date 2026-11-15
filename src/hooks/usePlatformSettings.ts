import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import type { SystemSettingsState } from '../components/admin/types';

const DEFAULT_PUBLIC_SETTINGS: SystemSettingsState = {
  integrations: {
    googleDrive: false,
    googleCalendar: true,
    googleMeet: true,
    trelloImport: true,
  },
  notifications: {
    emailEnabled: true,
    inAppEnabled: true,
  },
  platform: {
    allowPublicRegistrations: true,
    maintenanceBanner: '',
  },
};

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<SystemSettingsState>(DEFAULT_PUBLIC_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: SystemSettingsState }>('/api/system/settings/public');
      if (res?.data) {
        setSettings(res.data);
      }
    } catch {
      // Mantener valores por defecto si falla la lectura pública
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const handleChanged = () => {
      void load();
    };
    window.addEventListener('platform-settings-changed', handleChanged);
    return () => window.removeEventListener('platform-settings-changed', handleChanged);
  }, [load]);

  return { settings, loading, refresh: load };
};
