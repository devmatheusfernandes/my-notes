import { useCallback } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { settingsService } from "@/services/settingsService";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useSettings() {
  const { settings, isLoading, error, setSettings, setLoading, setError } = useSettingsStore();

  const fetchSettings = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);
      try {
        const s = await settingsService.getUserSettings(userId);
        setSettings(s);
        return s;
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, setSettings],
  );

  const setPin = useCallback(
    async (userId: string, pin: string) => {
      setLoading(true);
      setError(null);
      try {
        const s = await settingsService.setPin(userId, pin);
        setSettings(s);
        return s;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, setSettings],
  );

  const updateBiometric = useCallback(
    async (userId: string, biometricEnabled: boolean, biometricCredentialId: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const s = await settingsService.updateUserSettings(userId, { biometricEnabled, biometricCredentialId });
        setSettings(s);
        return s;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, setSettings],
  );

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    setPin,
    updateBiometric,
  };
}
