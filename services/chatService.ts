import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

export type Message = {
  id?: string;
  role: "user" | "model";
  content: string;
  createdAt: Date | string | { toDate: () => Date };
};

export type Chat = {
  id?: string;
  userId: string;
  title: string;
  createdAt: Date | string | { toDate: () => Date };
  updatedAt: Date | string | { toDate: () => Date };
  status?: "active" | "archived";
};

export const chatService = {
  async createChat(userId: string, title: string) {
    const chatRef = await addDoc(collection(db, "chats"), {
      userId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return chatRef.id;
  },

  async addMessage(chatId: string, role: "user" | "model", content: string) {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      role,
      content,
      createdAt: serverTimestamp(),
    });
  },

  async getChats(userId: string) {
    const q = query(
      collection(db, "chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const allChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
    // Filter archived chats on client side to avoid missing old documents or requiring indexes
    return allChats.filter(chat => chat.status !== "archived");
  },

  async getMessages(chatId: string) {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
  },

  async archiveChat(chatId: string) {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      status: "archived",
      updatedAt: serverTimestamp(),
    });
  },

  async deleteChat(chatId: string) {
    const chatRef = doc(db, "chats", chatId);
    // Note: This only deletes the chat doc. 
    // Sub-collections should be deleted individually or via functions.
    // For now, simple parent deletion.
    await deleteDoc(chatRef);
  }
};
