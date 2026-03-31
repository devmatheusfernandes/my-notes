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
import { useBackup } from "@/hooks/use-backup";
import {
  Cloud,
  RefreshCw,
  Link as LinkIcon,
  Clock,
  Calendar,
  AlertTriangle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { settings, isLoading, error, fetchSettings, setPin, updateBiometric, updateSettings } =
    useSettings();

  const [pinInput, setPinInput] = useState("");
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);
  const {
    loading: isBackupLoading,
    backups,
    fetchBackups,
    backupNow,
    restoreBackup,
    linkGoogleDrive
  } = useBackup(userId);

  useEffect(() => {
    if (userId) {
      fetchBackups();
    }
  }, [userId, fetchBackups]);

  useEffect(() => {
    if (!userId) return;
    fetchSettings(userId).catch((err) => {
      console.error("Settings load error:", err);
    });
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

  const isInitializing = isLoading && !settings;

  if (error && !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar configurações</h3>
          <p className="text-sm text-muted-foreground max-w-[300px]">{error}</p>
        </div>
        <Button onClick={() => userId && fetchSettings(userId)} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <Loading />
    );
  }

  return (
    <motion.main
      className="page-container"
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemFadeInUpVariants} className="mb-8">
        <h1 className="page-title">
          Configurações
        </h1>
        <p className="page-description">
          Configure seu PIN de segurança e preferências de desbloqueio do
          aplicativo.
        </p>
      </motion.div>

      <div className="space-y-6 sm:space-y-8">
        <motion.section
          variants={itemFadeInUpVariants}
          className="card-section"
        >
          <div className="mb-5">
            <h2 className="card-title">
              PIN de Acesso
            </h2>
            <p className="card-description">
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

        <motion.section
          variants={itemFadeInUpVariants}
          className="card-section"
        >
          <div className="mb-5">
            <h2 className="card-title">Biometria</h2>
            <p className="card-description">
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
                handleToggleBiometric(enabled).catch(() => { });
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
        <motion.section
          variants={itemFadeInUpVariants}
          className="card-section"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                Backups (Google Drive)
              </h2>
              <p className="card-description">
                Salve e restaure seus dados diretamente na sua conta do Google.
              </p>
            </div>
            {!settings?.driveRefreshToken && (
              <Button
                variant="outline"
                size="sm"
                onClick={linkGoogleDrive}
                className="gap-2"
                disabled={isBackupLoading}
              >
                <LinkIcon className="w-4 h-4" />
                Vincular Drive
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border bg-accent/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Backup Automático</label>
                    <p className="text-xs text-muted-foreground">Sincroniza seus dados no horário definido.</p>
                  </div>
                  <Checkbox
                    checked={settings?.autoBackupEnabled}
                    onCheckedChange={(checked: boolean) => {
                      toast.promise(
                        updateSettings(userId, { autoBackupEnabled: checked }),
                        {
                          loading: "Alterando...",
                          success: "Configuração atualizada!",
                          error: "Falha ao atualizar."
                        }
                      );
                    }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1.5 opacity-80">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Horário (Fixo)
                    </label>
                    <div className="h-8 px-3 flex items-center bg-accent/50 rounded-md border text-xs font-medium text-muted-foreground">
                      02:00 (Madrugada)
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Frequência
                    </label>
                    <Select
                      value={settings?.autoBackupFrequency}
                      onValueChange={(val: "daily" | "weekly" | "monthly") => updateSettings(userId, { autoBackupFrequency: val })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 md:pl-6 md:border-l">
                <Button
                  onClick={backupNow}
                  disabled={isBackupLoading || !userId}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isBackupLoading ? 'animate-spin' : ''}`} />
                  Fazer Backup Agora
                </Button>
                {settings?.lastBackupAt && (
                  <p className="text-xs text-center text-muted-foreground">
                    Último backup: {new Date(settings.lastBackupAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Histórico de Backups</h3>
              {backups.length === 0 ? (
                <div className="text-center p-8 border rounded-xl border-dashed">
                  <p className="text-sm text-muted-foreground">Nenhum backup encontrado no Google Drive.</p>
                </div>
              ) : (
                <div className="max-height-[300px] overflow-y-auto space-y-2 pr-2">
                  {backups.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/20 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.createdTime).toLocaleString()} • {(Number(b.size) / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreBackup(b.id)}
                          className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                <strong>Atenção:</strong> Restaurar um backup irá <strong>substituir permanentemente</strong> todas as suas notas, pastas e tags atuais. Recomendamos fazer um backup manual antes de restaurar.
              </p>
            </div>
          </div>
        </motion.section>
        <StorageWidget />
      </div>
    </motion.main>
  );
}
