import { NextResponse } from "next/server";
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  query,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { NOTES_COLLECTION_NAME } from "@/lib/firebase/collections-name";
import { tokenize } from "@/lib/utils/tokenizer";
import { extractTextFromTiptap } from "@/lib/notes/extract-text";
import { Note } from "@/schemas/noteSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch notes to process
    // We fetch a batch to avoid timeouts. 
    // In a real scenario, we might want to filter more aggressively.
    const notesRef = collection(db, NOTES_COLLECTION_NAME);
    const q = query(notesRef, limit(100)); // Process 100 at a time
    const querySnapshot = await getDocs(q);

    const notesToUpdate: Note[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Note;
      
      const needsUpdate = 
        !data.searchTokens || 
        !data.searchTokensUpdatedAt || 
        new Date(data.updatedAt) > new Date(data.searchTokensUpdatedAt);

      if (needsUpdate) {
        notesToUpdate.push(data);
      }
    });

    if (notesToUpdate.length === 0) {
      return NextResponse.json({ message: "No notes need tokenization." });
    }

    // 2. Process and update in batches
    const batch = writeBatch(db);
    let processedCount = 0;

    for (const note of notesToUpdate) {
      const rawText = `${note.title || ""}\n${extractTextFromTiptap(note.content)}`;
      const tokens = tokenize(rawText);
      
      const noteRef = doc(db, NOTES_COLLECTION_NAME, note.id);
      batch.update(noteRef, {
        searchTokens: tokens,
        searchTokensUpdatedAt: new Date().toISOString(),
      });
      processedCount++;
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      totalChecked: querySnapshot.size 
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Cron Tokenize Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
