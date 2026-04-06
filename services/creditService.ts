import * as admin from "firebase-admin";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface UserCredits {
  userId: string;
  amount: number;
  lastRefillMonth: number;
  lastRefillYear: number;
  updatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

const DEFAULT_MONTHLY_CREDITS = 1000;

export const creditService = {
  /**
   * Garante que o registro de créditos exista e esteja atualizado para o mês corrente.
   */
  async getOrCreateCredits(userId: string): Promise<UserCredits> {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    const creditRef = adminDb.collection("credits").doc(userId);
    const doc = await creditRef.get();

    if (!doc.exists) {
      const newCredits: UserCredits = {
        userId,
        amount: DEFAULT_MONTHLY_CREDITS,
        lastRefillMonth: currentMonth,
        lastRefillYear: currentYear,
        updatedAt: FieldValue.serverTimestamp(),
      };
      await creditRef.set(newCredits);
      return newCredits;
    }

    const data = doc.data() as UserCredits;

    // Verificar se virou o mês
    if (data.lastRefillMonth !== currentMonth || data.lastRefillYear !== currentYear) {
      await creditRef.update({
        amount: DEFAULT_MONTHLY_CREDITS,
        lastRefillMonth: currentMonth,
        lastRefillYear: currentYear,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        ...data,
        amount: DEFAULT_MONTHLY_CREDITS,
        lastRefillMonth: currentMonth,
        lastRefillYear: currentYear,
      };
    }

    return data;
  },

  /**
   * Deduz créditos do usuário. 
   * Se for Chat, amount = tokens / 1000.
   * Se for Vectorization, amount = 1 por item.
   */
  async deductCredits(userId: string, amount: number) {
    if (amount <= 0) return;
    
    const creditRef = adminDb.collection("credits").doc(userId);
    
    // Usamos decrement (incremento negativo)
    await creditRef.update({
      amount: FieldValue.increment(-amount),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  /**
   * Verifica se o usuário tem créditos suficientes.
   */
  async hasCredits(userId: string, minAmount: number = 1): Promise<boolean> {
    const credits = await this.getOrCreateCredits(userId);
    return credits.amount >= minAmount;
  },

  /**
   * Registra uma transação de créditos no Firestore para histórico e depuração.
   */
  async logTransaction(params: {
    userId: string;
    amount: number;
    type: "chat" | "vectorize" | "manual_process";
    details?: Record<string, unknown>;
  }) {
    const { userId, amount, type, details } = params;
    
    await adminDb.collection("credit_logs").add({
      userId,
      amount,
      type,
      details,
      timestamp: FieldValue.serverTimestamp(),
    });
  }
};
