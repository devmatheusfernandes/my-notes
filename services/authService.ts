import { auth } from "@/lib/firebase/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { redirect } from "next/navigation";

export const authService = {
  async logInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      // Call session API to set cookie
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },

  async logOut() {
    try {
      await signOut(auth);

      // Call session API to delete cookie
      await fetch("/api/auth/session", { method: "DELETE" });
      redirect("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },
};
