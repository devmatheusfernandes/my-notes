# Security Rules — Guia de Segurança para Desenvolvimento

> Este documento é complementar ao [`architecture.md`](./architecture.md). A IA **deve** seguir todas as regras aqui listadas ao gerar qualquer código que envolva dados de usuário, autenticação, banco de dados ou comunicação entre cliente e servidor.

---

## 1. Princípio Geral: Nunca Confie no Cliente

**Toda informação que vem do navegador (frontend) deve ser tratada como não confiável.**

Isso inclui:
- Campos de formulários
- Parâmetros de URL (`searchParams`, `params`)
- Body de requisições para API Routes
- Argumentos de Server Actions
- Dados do `localStorage` ou `sessionStorage`

A validação no frontend é apenas UX. A validação real acontece no servidor e nas `firestore.rules`.

---

## 2. Variáveis de Ambiente

### Regras Obrigatórias

| Tipo de Chave | Onde Usar | Prefixo |
|---|---|---|
| Pública (Firebase config, IDs públicos) | Client-side | `NEXT_PUBLIC_` |
| Privada (OpenAI, Stripe secret, Admin SDK) | Somente servidor | Sem prefixo |

```typescript
// ✅ CORRETO — chave pública visível no browser
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// ✅ CORRETO — chave privada apenas no servidor
const stripeSecret = process.env.STRIPE_SECRET_KEY; // API Route ou Server Action

// ❌ PROIBIDO — chave privada com prefixo NEXT_PUBLIC_ vaza para o bundle do cliente
const openAiKey = process.env.NEXT_PUBLIC_OPENAI_KEY; // NUNCA FAÇA ISSO
```

### Checklist de `.env`

- [ ] O `.env.local` está no `.gitignore`
- [ ] Nenhuma chave secreta tem prefixo `NEXT_PUBLIC_`
- [ ] O `.env.example` existe no repositório com as chaves (sem valores)
- [ ] Segredos são gerenciados via painel do provedor (Vercel, etc.), não hardcoded

---

## 3. Firestore Security Rules

As Security Rules são a **última linha de defesa real** do banco de dados. O frontend pode ser contornado. As Rules, não.

### Padrão Base Obrigatório

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ❌ NUNCA deixe isso em produção
    // match /{document=**} {
    //   allow read, write: if true;
    // }

    // ✅ Padrão: negar tudo por default, liberar explicitamente
    match /{document=**} {
      allow read, write: if false;
    }

    match /users/{userId} {
      // Usuário só pode ler/escrever seus próprios dados
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }

    match /notes/{noteId} {
      allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null
                    && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid; // impede troca de dono
    }
  }
}
```

### Regras de Ouro das Firestore Rules

1. **Sempre comece negando tudo** (`allow read, write: if false`) e vá abrindo explicitamente.
2. **Nunca use `if true`** em produção.
3. **Sempre valide o `userId`** comparando `resource.data.userId == request.auth.uid`.
4. **Em `update`, valide os dois lados** — o documento atual (`resource`) e o que está sendo escrito (`request.resource`) — para evitar que o usuário mude o campo `userId`.
5. **Ao criar qualquer registro**, sempre force o `userId` no cliente via hook e valide na Rule.

---

## 4. Autenticação e Proteção de Rotas

### Rotas Protegidas no Next.js

Use middleware para proteger rotas no nível do servidor, antes de renderizar qualquer página:

```typescript
// middleware.ts (raiz do projeto)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

### Regras de Autenticação

- **Nunca confie no `uid` vindo do body da requisição.** Sempre extraia o usuário do token JWT verificado pelo Firebase Admin SDK.
- **Sempre verifique o token no servidor** antes de executar qualquer operação privilegiada em API Routes.

```typescript
// ✅ CORRETO — extrair uid do token, não do body
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  const uid = decodedToken.uid; // ✅ uid confiável, extraído do token

  // use uid aqui para qualquer operação no banco
}
```

---

## 5. Validação e Sanitização de Inputs

**Toda entrada de dados deve ser validada antes de ser processada ou salva.**

### Ferramenta Recomendada: Zod

```typescript
import { z } from "zod";

const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string().max(10000).trim(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Em API Route ou Server Action:
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, content, tags } = parsed.data; // ✅ dados validados e seguros
  // ... salvar no banco
}
```

### Regras de Validação

- [ ] Valide **tipo**, **tamanho mínimo e máximo** e **formato** de todos os campos.
- [ ] Use `.trim()` para remover espaços extras em strings.
- [ ] **Nunca salve HTML cru** no banco de dados sem sanitizar (risco de XSS ao renderizar).
- [ ] Para campos que renderizam HTML (rich text editors), use `DOMPurify` no servidor antes de salvar.

```typescript
import DOMPurify from "isomorphic-dompurify";

const safeContent = DOMPurify.sanitize(rawHtmlContent); // ✅ sanitizado
```

---

## 6. Proteção contra XSS (Cross-Site Scripting)

- **No Next.js com JSX**, o React já escapa strings automaticamente ao renderizar com `{}`. Isso protege 90% dos casos.
- **Nunca use `dangerouslySetInnerHTML`** sem sanitizar o conteúdo antes com `DOMPurify`.
- **Nunca construa URLs dinamicamente** a partir de inputs do usuário sem validação.

```tsx
// ❌ PROIBIDO — XSS direto
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ CORRETO — sanitizar antes
import DOMPurify from "isomorphic-dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 7. Proteção de API Routes

### Checklist para toda API Route

- [ ] Verificar autenticação (`Authorization` header ou cookie de sessão).
- [ ] Verificar método HTTP (`GET`, `POST`, etc.) explicitamente.
- [ ] Validar e tipar o body com Zod antes de usar qualquer dado.
- [ ] Retornar mensagens de erro genéricas para o cliente (não exponha stack traces).
- [ ] Logar erros detalhados no servidor (não no cliente).

```typescript
// ✅ Estrutura padrão de uma API Route segura
export async function POST(request: Request) {
  // 1. Autenticação
  const uid = await verifyAuthToken(request);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Validação do body
  const body = await request.json().catch(() => null);
  const parsed = MySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Bad Request" }, { status: 400 });

  // 3. Lógica de negócio
  try {
    const result = await myService.doSomething(uid, parsed.data);
    return Response.json(result, { status: 200 });
  } catch (err) {
    console.error("[API /my-route]", err); // log no servidor
    return Response.json({ error: "Internal Server Error" }, { status: 500 }); // genérico pro cliente
  }
}
```

---

## 8. Exposição de Dados — O que Nunca Retornar ao Cliente

Ao retornar dados do banco para o frontend, **filtre campos sensíveis** antes de enviar:

```typescript
// ❌ ERRADO — retornar o documento inteiro pode expor campos internos
return Response.json(userDoc.data());

// ✅ CORRETO — selecionar explicitamente o que expor
const { name, avatarUrl, createdAt } = userDoc.data();
return Response.json({ name, avatarUrl, createdAt });
```

Campos que **nunca** devem chegar ao cliente:
- Senhas ou hashes de senha
- Tokens de integração internos
- Dados de outros usuários
- Campos administrativos (`role`, `isAdmin`, `stripeCustomerId` em contextos públicos)

---

## 9. Rate Limiting

Para API Routes que executam operações custosas (IA, envio de email, SMS), implemente rate limiting:

- Use `upstash/ratelimit` com Redis (Upstash) para limitar por `uid` ou IP.
- Configure limites razoáveis por endpoint (ex: 10 requisições/minuto por usuário).

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

// Na API Route:
const { success } = await ratelimit.limit(uid);
if (!success) return Response.json({ error: "Too Many Requests" }, { status: 429 });
```

---

## 10. Checklist de Segurança — Antes de fazer Deploy

### Banco de Dados
- [ ] As `firestore.rules` estão atualizadas e negam tudo por default?
- [ ] As `storage.rules` estão atualizadas?
- [ ] Nenhuma rule usa `allow read, write: if true`?

### Variáveis de Ambiente
- [ ] Nenhuma chave secreta tem prefixo `NEXT_PUBLIC_`?
- [ ] O `.env.local` está no `.gitignore`?
- [ ] As variáveis de ambiente estão configuradas no painel da Vercel/hosting?

### API e Server Actions
- [ ] Toda API Route verifica autenticação?
- [ ] Todo input é validado com Zod antes de usar?
- [ ] Erros retornados ao cliente são genéricos?

### Frontend
- [ ] Nenhuma chamada direta ao Firebase nos componentes visuais?
- [ ] Nenhum `dangerouslySetInnerHTML` sem `DOMPurify`?
- [ ] Dados sensíveis não estão no `localStorage`?

### useEffect
- [ ] Todo `useEffect` com subscriptions tem cleanup (`return () => unsubscribe()`)?
- [ ] Nenhum `useEffect` está sendo usado para substituir um event handler?
- [ ] Fetch dentro de `useEffect` usa `AbortController` ou flag `isMounted`?