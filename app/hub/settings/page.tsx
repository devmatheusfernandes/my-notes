"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSettings } from "@/hooks/use-settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { settingsService } from "@/services/settingsService";

function isValidPin(pin: string) {
  return /^\d{4,8}$/.test(pin);
}

function hasWebAuthn() {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined" && !!navigator.credentials;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { settings, isLoading, fetchSettings, setPin, updateBiometric } = useSettings();

  const [pinInput, setPinInput] = useState("");
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchSettings(userId).catch(() => {});
  }, [fetchSettings, userId]);

  const hasPin = useMemo(() => {
    return !!settings?.pinHash && !!settings?.pinSalt;
  }, [settings?.pinHash, settings?.pinSalt]);

  const biometricEnabled = settings?.biometricEnabled ?? false;

  const handleSavePin = async () => {
    const pin = pinInput.trim();
    if (!isValidPin(pin)) {
      toast.error("PIN inválido. Use 4 a 8 dígitos.");
      return;
    }
    await toast.promise(setPin(userId, pin), {
      loading: "Salvando PIN...",
      success: "PIN salvo com sucesso.",
      error: "Não foi possível salvar o PIN.",
    });
    setPinInput("");
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    if (!hasPin) {
      toast.error("Defina um PIN antes de ativar a biometria.");
      return;
    }

    if (!hasWebAuthn()) {
      toast.error("Biometria indisponível neste navegador/dispositivo.");
      return;
    }

    if (!userId) return;

    if (!enabled) {
      await toast.promise(updateBiometric(userId, false, null), {
        loading: "Desativando biometria...",
        success: "Biometria desativada.",
        error: "Não foi possível desativar a biometria.",
      });
      return;
    }

    setIsBiometricBusy(true);
    try {
      const challenge = new Uint8Array(32);
      globalThis.crypto.getRandomValues(challenge);

      const userHandle = new TextEncoder().encode(userId);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "MyNotes" },
          user: {
            id: userHandle,
            name: user?.email ?? userId,
            displayName: user?.displayName ?? "Usuário",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60_000,
          attestation: "none",
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        toast.error("Não foi possível configurar a biometria.");
        return;
      }

      const credentialId = settingsService.encodeCredentialId(credential.rawId);
      await toast.promise(updateBiometric(userId, true, credentialId), {
        loading: "Ativando biometria...",
        success: "Biometria ativada.",
        error: "Não foi possível ativar a biometria.",
      });
    } catch (err) {
      console.error("Erro ao configurar biometria:", err);
      toast.error("Falha ao configurar biometria.");
    } finally {
      setIsBiometricBusy(false);
    }
  };

  return (
    <main className="w-full max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure PIN e preferências de desbloqueio.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-base font-semibold">PIN</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use um PIN numérico para trancar/destrancar notas.
          </p>

          <div className="mt-4 flex gap-2">
            <Input
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Digite um PIN (4 a 8 dígitos)"
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              disabled={isLoading || !userId}
            />
            <Button onClick={handleSavePin} disabled={isLoading || !userId}>
              Salvar
            </Button>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            {hasPin ? "PIN configurado." : "Nenhum PIN configurado."}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-base font-semibold">Biometria</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use biometria do dispositivo para destrancar notas.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Checkbox
              checked={biometricEnabled}
              disabled={!userId || isLoading || isBiometricBusy || !hasPin}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                handleToggleBiometric(enabled).catch(() => {});
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm">Ativar desbloqueio por biometria</span>
              {!hasPin ? (
                <span className="text-xs text-muted-foreground">
                  Defina um PIN antes de ativar.
                </span>
              ) : !hasWebAuthn() ? (
                <span className="text-xs text-muted-foreground">
                  WebAuthn indisponível neste dispositivo.
                </span>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
