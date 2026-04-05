import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/firebase-admin";

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("Não autorizado: Sessão não encontrada.");
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error("Erro ao verificar sessão do Firebase:", error);
    throw new Error("Não autorizado: Sessão inválida ou expirada.");
  }
}
