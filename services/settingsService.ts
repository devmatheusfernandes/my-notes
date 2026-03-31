import { db } from "@/lib/firebase";
import { USER_SETTINGS_COLLECTION_NAME } from "@/lib/collections-name";
import { UserSettings, userSettings } from "@/schemas/userSettingsSchema";
import { doc, getDoc, setDoc } from "firebase/firestore";

function bytesToBase64(bytes: Uint8Array) {
  if (typeof btoa === "function") {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(base64: string) {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}

function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(base64Url: string) {
  const padded = base64Url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  return base64ToBytes(padded);
}

function getSubtleCrypto() {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle)
    throw new Error("Web Crypto API indisponível neste ambiente.");
  return cryptoObj.subtle;
}

async function derivePinHash({
  pin,
  saltBytes,
  iterations,
}: {
  pin: string;
  saltBytes: Uint8Array;
  iterations: number;
}) {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const pinKey = await subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes as unknown as BufferSource,
      iterations,
    },
    pinKey,
    256,
  );
  return new Uint8Array(derived);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const PIN_HASH_ITERATIONS = 100_000;
const PIN_SALT_BYTES = 16;

export const settingsService = {
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const ref = doc(db, USER_SETTINGS_COLLECTION_NAME, userId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const now = new Date().toISOString();
        const raw: UserSettings = {
          userId,
          pinSalt: null,
          pinHash: null,
          biometricEnabled: false,
          biometricCredentialId: null,
          autoBackupEnabled: false,
          autoBackupTime: "02:00",
          autoBackupFrequency: "daily",
          lastBackupAt: null,
          driveRefreshToken: null,
          createdAt: now,
          updatedAt: now,
        };
        const parsed = userSettings.parse(raw);
        await setDoc(ref, parsed);
        return parsed;
      }

      return userSettings.parse(snap.data());
    } catch (error) {
      console.error("Erro ao buscar configurações do usuário:", error);
      throw new Error("Não foi possível carregar suas configurações.");
    }
  },

  async updateUserSettings(
    userId: string,
    data: Partial<UserSettings>,
  ): Promise<UserSettings> {
    try {
      const ref = doc(db, USER_SETTINGS_COLLECTION_NAME, userId);
      await setDoc(
        ref,
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      const updated = await getDoc(ref);
      return userSettings.parse(updated.data());
    } catch (error) {
      console.error("Erro ao atualizar configurações do usuário:", error);
      throw new Error("Não foi possível salvar suas configurações.");
    }
  },

  async setPin(userId: string, pin: string): Promise<UserSettings> {
    try {
      const ref = doc(db, USER_SETTINGS_COLLECTION_NAME, userId);
      const cryptoObj = globalThis.crypto;
      if (!cryptoObj?.getRandomValues)
        throw new Error("Web Crypto API indisponível.");

      const salt = new Uint8Array(PIN_SALT_BYTES);
      cryptoObj.getRandomValues(salt);

      const derived = await derivePinHash({
        pin,
        saltBytes: salt,
        iterations: PIN_HASH_ITERATIONS,
      });

      const now = new Date().toISOString();
      await setDoc(
        ref,
        {
          userId,
          pinSalt: bytesToBase64(salt),
          pinHash: bytesToBase64(derived),
          updatedAt: now,
        },
        { merge: true },
      );

      const updated = await getDoc(ref);
      return userSettings.parse(updated.data());
    } catch (error) {
      console.error("Erro ao salvar PIN:", error);
      throw new Error("Não foi possível salvar seu PIN.");
    }
  },

  async verifyPin(settings: UserSettings, pin: string): Promise<boolean> {
    if (!settings.pinSalt || !settings.pinHash) return false;

    const saltBytes = base64ToBytes(settings.pinSalt);
    const expectedBytes = base64ToBytes(settings.pinHash);
    const derived = await derivePinHash({
      pin,
      saltBytes,
      iterations: PIN_HASH_ITERATIONS,
    });

    return constantTimeEqual(expectedBytes, derived);
  },

  encodeCredentialId(rawId: ArrayBuffer) {
    return bytesToBase64Url(new Uint8Array(rawId));
  },

  decodeCredentialId(credentialId: string) {
    return base64UrlToBytes(credentialId).buffer;
  },
};
