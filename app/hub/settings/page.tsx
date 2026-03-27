"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useSettings } from "@/hooks/use-settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { settingsService } from "@/services/settingsService";
import { hasWebAuthn, isValidPin } from "@/lib/utils";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";
import { Loading } from "@/components/ui/loading";
import { StorageWidget } from "@/components/hub/storage-widget";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { settings, isLoading, fetchSettings, setPin, updateBiometric } =
    useSettings();

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
    toast.promise(setPin(userId, pin), {
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
      toast.promise(updateBiometric(userId, false, null), {
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
      toast.promise(updateBiometric(userId, true, credentialId), {
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

  // Previne a renderização do layout antes de buscar as configurações iniciais
  const isInitializing = isLoading && !settings;

  if (isInitializing) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <motion.main
      className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-6 sm:py-8"
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemFadeInUpVariants} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Configurações
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Configure seu PIN de segurança e preferências de desbloqueio do
          aplicativo.
        </p>
      </motion.div>

      <div className="space-y-6 sm:space-y-8">
        {/* Sessão de PIN */}
        <motion.section
          variants={itemFadeInUpVariants}
          className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              PIN de Acesso
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use um PIN numérico para proteger suas anotações sensíveis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              className="flex-1"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Digite um PIN (4 a 8 dígitos)"
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              disabled={isLoading || !userId}
            />
            <Button
              className="w-full sm:w-auto"
              onClick={handleSavePin}
              disabled={isLoading || !userId}
            >
              Salvar PIN
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span
              className={`flex h-2 w-2 rounded-full ${hasPin ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span className="text-muted-foreground font-medium">
              {hasPin
                ? "PIN atualmente configurado e ativo."
                : "Nenhum PIN configurado no momento."}
            </span>
          </div>
        </motion.section>

        {/* Sessão de Biometria */}
        <motion.section
          variants={itemFadeInUpVariants}
          className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">Biometria</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Utilize o Face ID, Touch ID ou a biometria do seu dispositivo para
              um desbloqueio rápido.
            </p>
          </div>

          <div className="flex items-start gap-4 rounded-xl border border-dashed p-4">
            <Checkbox
              id="biometric-toggle"
              className="mt-1"
              checked={biometricEnabled}
              disabled={!userId || isLoading || isBiometricBusy || !hasPin}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                handleToggleBiometric(enabled).catch(() => {});
              }}
            />
            <div className="flex flex-col gap-1">
              <label
                htmlFor="biometric-toggle"
                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ativar desbloqueio por biometria
              </label>

              {!hasPin ? (
                <span className="text-xs text-destructive font-medium mt-1">
                  * É necessário definir um PIN antes de ativar.
                </span>
              ) : !hasWebAuthn() ? (
                <span className="text-xs text-amber-500 font-medium mt-1">
                  * WebAuthn indisponível neste navegador/dispositivo.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground mt-1">
                  Requer confirmação no dispositivo ao ativar.
                </span>
              )}
            </div>
          </div>
        </motion.section>
        <StorageWidget />
      </div>
    </motion.main>
  );
}
