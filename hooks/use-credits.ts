import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useAuthStore } from "@/store/authStore";

export interface UserCredits {
  amount: number;
  lastRefillMonth: number;
  lastRefillYear: number;
}

export function useCredits() {
  const { user } = useAuthStore();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize state during render when user changes
  const [prevUserId, setPrevUserId] = useState<string | undefined>(undefined);
  if (user?.uid !== prevUserId) {
    setPrevUserId(user?.uid);
    if (!user) {
      setCredits(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      doc(db, "credits", user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setCredits(snapshot.data() as UserCredits);
        } else {
          setCredits({
            amount: 1000,
            lastRefillMonth: new Date().getMonth(),
            lastRefillYear: new Date().getFullYear(),
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao escutar créditos:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  return { credits, loading };
}
