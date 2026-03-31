"use client";

import { useState, useCallback } from "react";
import { backupService } from "@/services/backupService";
import { toast } from "sonner";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { settingsService } from "@/services/settingsService";
import { auth } from "@/lib/firebase";
import type { UserCredential } from "firebase/auth";

export interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

export const useBackup = (userId: string) => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<DriveFile[]>([]);

  const fetchBackups = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const list = await backupService.listBackupsOnDrive();
      setBackups(list);
    } catch (err: unknown) {
      const errorMessage = backupService.getErrorDetail(err);
      console.warn("Could not fetch backups from Drive:", errorMessage);
      // We don't toast on auto-fetch to avoid annoying the user if not linked
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const backupNow = async () => {
    if (!userId) return;
    setLoading(true);
    const result = await backupService.driveBackupNow(userId);
    if (result.success) {
      toast.success("Backup concluído com sucesso no Google Drive!");
      fetchBackups();
    } else {
      toast.error(`Erro no backup: ${result.error}`);
    }
    setLoading(false);
    return result;
  };

  const restoreBackup = async (driveFileId: string) => {
    if (!userId) return;
    if (!confirm("Isso apagará todas as suas notas atuais e as substituirá pelo backup. Tem certeza?")) return;

    setLoading(true);
    const result = await backupService.restoreFromDrive(userId, driveFileId);
    if (result.success) {
      toast.success("Dados restaurados com sucesso! Recarregando...");
      window.location.reload();
    } else {
      toast.error(`Erro na restauração: ${result.error}`);
    }
    setLoading(false);
    return result;
  };

  const linkGoogleDrive = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");

      // Attempt to get refresh token for GH Actions
      // NOTE: This requires the App to be configured as a Web App in Google Cloud Console
      // and the redirect URI to be reachable. Firebase handles this mostly.
      provider.setCustomParameters({
        access_type: 'offline',
        prompt: 'consent'
      });

      const result = await signInWithPopup(auth, provider);

      // Attempt to get refresh token for GH Actions
      // In Firebase _tokenResponse usually contains the refreshToken if offline is requested
      const refreshToken = (result as UserCredential & { _tokenResponse?: { refreshToken?: string } })._tokenResponse?.refreshToken || null;

      await settingsService.updateUserSettings(userId, {
        driveRefreshToken: refreshToken
      });

      toast.success("Google Drive vinculado com sucesso!");
      fetchBackups();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao vincular: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    backups,
    fetchBackups,
    backupNow,
    restoreBackup,
    linkGoogleDrive
  };
};
