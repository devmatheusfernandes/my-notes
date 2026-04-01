# Official Rule: Security & Data Integrity

This rule defines the mandatory security protocols for handling user data, authentication, and server-client communication. **Never trust data originating from the client.**

## 🏗 Anatomy
All data operations must adhere to this multi-layer defense:

1. **Client-Side UX**: Basic validation for user experience (e.g., Zod, required fields).
2. **Server-Side Validation**: Strict verification of all inputs in API Routes and Server Actions.
3. **Firestore Security Rules**: Final enforcement layer within `firestore.rules`.
4. **Auth Verification**: Extraction of `uid` from verified JWT tokens, never from the request body.

## 💻 Standard Implementation (API Route / Server Action)

```typescript
import { z } from "zod";
import { adminAuth } from "@/lib/firebase-admin";

const Schema = z.object({ title: z.string().min(1).trim() });

export async function POST(request: Request) {
  // 1. Verify Authentication
  const uid = await verifyAuthToken(request); // Helper to verify JWT via Firebase Admin
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Validate Input
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Bad Request" }, { status: 400 });

  // 3. Process with verified UID
  const result = await myService.create(uid, parsed.data);
  return Response.json(result);
}
```

## 🎯 Constraints
- **Env Variables**: ❌ Never prefix secret keys with `NEXT_PUBLIC_`. Secret keys (OpenAI, Stripe, Admin SDK) MUST remain server-side.
- **XSS Prevention**: ❌ Never use `dangerouslySetInnerHTML` without first sanitizing content with `DOMPurify`.
- **Firestore Rules**: 
  - Always default to `allow read, write: if false;`.
  - Validate owner via `resource.data.userId == request.auth.uid`.
  - In `update`, ensure `request.resource.data.userId` matches the original owner to prevent document takeover.
- **Data Filtering**: ❌ Never return full documents to the client. Explicitly pick fields: `const { name, avatarUrl } = doc.data();`.
- **Sensitive Fields**: Passwords, integration tokens, and admin roles MUST NEVER reach the frontend.
- **Cleanup**: Always include cleanup functions (e.g., `return () => unsubscribe()`) for all subscriptions.
- **Error Messages**: Return only generic error messages to the client; log detailed stack traces only on the server.
