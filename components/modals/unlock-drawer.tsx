"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { useSettings } from "@/hooks/use-settings";
import { settingsService } from "@/services/settingsService";
import { useNoteStore } from "@/store/noteStore";
import { useFolderStore } from "@/store/folderStore";
import { hasWebAuthn } from "@/lib/utils";

type UnlockDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { kind: "note"; id: string } | { kind: "folder"; id: string };
  onUnlocked: () => void;
};

export function UnlockDrawer({
  open,
  onOpenChange,
  item,
  onUnlocked,
}: UnlockDrawerProps) {
  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { settings, isLoading, fetchSettings } = useSettings();
  const unlockNote = useNoteStore((s) => s.unlockNote);
  const unlockFolder = useFolderStore((s) => s.unlockFolder);

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [biometricAttempted, setBiometricAttempted] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
      setError(null);
      setIsBusy(false);
      setBiometricAttempted(false);
      return;
    }

    if (!userId) return;

    fetchSettings(userId).catch(() => {});
  }, [fetchSettings, open, userId]);

  const canUseBiometric = useMemo(() => {
    return (
      !!settings?.biometricEnabled &&
      !!settings?.biometricCredentialId &&
      hasWebAuthn()
    );
  }, [settings?.biometricCredentialId, settings?.biometricEnabled]);

  const handleUnlockSuccess = useCallback(() => {
    if (item.kind === "note") unlockNote(item.id);
    if (item.kind === "folder") unlockFolder(item.id);
    onUnlocked();
  }, [item.id, item.kind, onUnlocked, unlockFolder, unlockNote]);

  const handlePinSubmit = useCallback(async () => {
    if (!settings) return;
    setIsBusy(true);
    setError(null);
    try {
      const ok = await settingsService.verifyPin(settings, pin.trim());
      if (!ok) {
        setError("PIN incorreto.");
        return;
      }
      handleUnlockSuccess();
    } catch {
      setError("Não foi possível validar o PIN.");
    } finally {
      setIsBusy(false);
    }
  }, [handleUnlockSuccess, pin, settings]);

  const handleBiometric = useCallback(async () => {
    if (!settings?.biometricCredentialId) return;
    if (!hasWebAuthn()) {
      setError("Biometria indisponível neste dispositivo.");
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      const challenge = new Uint8Array(32);
      globalThis.crypto.getRandomValues(challenge);

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              type: "public-key",
              id: settingsService.decodeCredentialId(
                settings.biometricCredentialId,
              ),
            },
          ],
          userVerification: "required",
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        setError("Falha ao autenticar com biometria.");
        return;
      }

      handleUnlockSuccess();
    } catch (err) {
      console.error("Erro ao autenticar com biometria:", err);
      setError("Falha ao autenticar com biometria.");
    } finally {
      setIsBusy(false);
    }
  }, [handleUnlockSuccess, settings?.biometricCredentialId]);

  useEffect(() => {
    if (!open) return;
    if (!canUseBiometric) return;
    if (isLoading || isBusy) return;
    if (biometricAttempted) return;

    setBiometricAttempted(true);
    handleBiometric();
  }, [
    biometricAttempted,
    canUseBiometric,
    handleBiometric,
    isBusy,
    isLoading,
    open,
  ]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              {item.kind === "folder" ? "Pasta trancada" : "Nota trancada"}
            </DrawerTitle>
            <DrawerDescription>
              Digite seu PIN para acessar{" "}
              {item.kind === "folder" ? "esta pasta" : "esta nota"}.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-2">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              disabled={isLoading || isBusy}
            />
            {error ? (
              <div className="mt-2 text-sm text-destructive">{error}</div>
            ) : null}
          </div>

          <DrawerFooter>
            <Button
              onClick={handlePinSubmit}
              disabled={!pin.trim() || isLoading || isBusy || !settings}
            >
              Destrancar
            </Button>
            {canUseBiometric ? (
              <Button
                variant="outline"
                onClick={handleBiometric}
                disabled={isBusy || isLoading}
              >
                Usar biometria
              </Button>
            ) : null}
            <DrawerClose asChild>
              <Button variant="outline" disabled={isBusy}>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
