# Architecture Rules — Front & Back Separation

> **Leitura obrigatória complementar:** [`security.md`](./security.md) — contém todas as regras de segurança que a IA deve seguir ao gerar código. Este documento e o `security.md` são inseparáveis.

---

## 1. Firebase Rules e Segurança (`firestore.rules` & `storage.rules`)

- **Responsabilidade:** Garantir que todas as coleções do banco de dados e buckets do Storage tenham as Regras de Segurança (Security Rules) atualizadas.
- **Sempre que for criado/modificado qualquer ação direta com o Banco de Dados**, o desenvolvedor/IA **DEVE obrigatoriamente** revisar e atualizar os arquivos locais `firestore.rules` ou `storage.rules`.
- **Objetivo:** O Frontend e a lógica de Service sozinhos **não garantem segurança**. É no lado das Rules do Firebase que garantimos que um usuário não pode deletar/ler dados do outro. As regras na raiz do projeto nos permitem manter esse documento seguro para posteriormente subir ao dashboard do Firebase Console.

---

## 2. Services (`/services/[entity]Service.ts`)

- **Responsabilidade:** Interações exclusivas com o banco de dados (ex: Firebase Firestore) ou APIs externas.
- **Regras:**
  - Importe apenas funções do Firestore (`doc`, `deleteDoc`, `setDoc`, `getDocs`, etc).
  - Toda operação **deve obrigatoriamente** ter mapeamento direto na seção de Rules do arquivo `firestore.rules`.
  - Tratamento de erros severos no try/catch devem soltar exception contendo fallback para a UI (ex: `throw new Error(...)`).
  - **Proibido:** Uso de estado global, Zustand, React hooks ou dependências da UI.

---

## 3. Store (`/store/[entity]Store.ts`)

- **Responsabilidade:** Gerenciamento de estado global no lado do cliente com Zustand. Funciona como cache de dados unificado.
- **Regras:**
  - Defina a interface `State` com dados globais explícitos: lista (`notes`), estado de carregamento (`isLoading`), e erro (`error`).
  - Crie e exporte apenas funções síncronas para manipulação da store local (Ex: `removeNote: (id) => set(state => ({ notes: state.notes.filter(n => n.id !== id) }))`).
  - **Proibido:** Lógica de async, promises, ou chamadas diretas a "Services". O Store é estritamente síncrono.

---

## 4. Hooks (`/hooks/use-[entity].ts`)

- **Responsabilidade:** A camada orquestradora (BFF/Controller do client-side) que liga a UI (Visual) aos Services (Backend) e ao Store (State).
- **Regras:**
  - Utilize as instâncias do respectivo Store para ler/escrever.
  - Funções assíncronas (como `deleteNote`) devem:
    1. Ativar loading (`setLoading(true)`) e resetar erro (`setError(null)`).
    2. Chamar o Service em um `try` (`await noteService.deleteNote(id)`).
    3. Sucesso: Manipular o estado local chamando funções da store (`removeNote(id)`).
    4. Fluxo de Catch: Formatar qualquer erro usando `getErrorMessage`, setar estado (`setError(msg)`) e lançar o throw original para notificar a UI.
    5. Finally: Encerrar o loading (`setLoading(false)`).

### 4.1 Regras de Uso do `useEffect`

O `useEffect` é um dos hooks mais mal utilizados em React. Siga as regras abaixo rigorosamente para evitar bugs silenciosos, race conditions e memory leaks.

#### ✅ Quando USAR o `useEffect`

| Caso de Uso | Exemplo |
|---|---|
| Sincronizar com um sistema externo | Inicializar uma lib JS de terceiros (ex: charts, maps) |
| Fetch de dados na montagem do componente | Buscar dados ao carregar a página pela primeira vez |
| Subscrições e listeners | `addEventListener`, `onSnapshot` do Firestore, WebSockets |
| Animações imperativas | Refs DOM que precisam ser manipuladas diretamente |
| Sincronizar estado com `localStorage` | Persistir preferências do usuário |

```typescript
// ✅ BOM — sincronizar com sistema externo (Firestore listener)
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "notes"), (snapshot) => {
    setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  return () => unsubscribe(); // ✅ cleanup obrigatório
}, []);
```

#### ❌ Quando NÃO USAR o `useEffect`

| Anti-pattern | Solução Correta |
|---|---|
| Transformar/derivar dados de estado existente | Calcule direto no render ou use `useMemo` |
| Reagir a um evento de usuário (click, submit) | Coloque a lógica direto no handler do evento |
| Inicializar estado com base em props | Use o initializer do `useState` ou derive no render |
| Fazer fetch em resposta a uma ação do usuário | Chame o service direto no handler, não num effect |
| Sincronizar dois estados entre si | Unifique em um único estado ou use `useReducer` |

```typescript
// ❌ ERRADO — usar useEffect para reagir a evento de usuário
useEffect(() => {
  if (hasSubmitted) {
    submitForm(); // isso cria dependências frágeis e bugs de timing
  }
}, [hasSubmitted]);

// ✅ CORRETO — chamar direto no handler
const handleSubmit = async () => {
  await submitForm();
};
```

```typescript
// ❌ ERRADO — derivar dados dentro de useEffect
useEffect(() => {
  setFilteredNotes(notes.filter(n => n.active));
}, [notes]);

// ✅ CORRETO — derivar no render
const filteredNotes = notes.filter(n => n.active);
// ou com useMemo se for computação pesada:
const filteredNotes = useMemo(() => notes.filter(n => n.active), [notes]);
```

#### ⚠️ Regras Obrigatórias ao Usar `useEffect`

1. **Sempre inclua cleanup** quando o effect criar subscrições, timers ou listeners.
2. **Nunca ignore o array de dependências** — um array vazio `[]` significa "rodar só na montagem". Se você precisar de `[]` mas o linter reclamar, reveja sua lógica.
3. **Evite async direto no useEffect** — crie uma função interna async e chame-a.
4. **Race conditions:** Ao fazer fetch dentro de useEffect, use uma flag `isMounted` ou AbortController para cancelar requests de effects desatualizados.

```typescript
// ✅ Padrão correto para fetch dentro de useEffect com cleanup
useEffect(() => {
  let isMounted = true;
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const data = await noteService.getNotes({ signal: controller.signal });
      if (isMounted) setNotes(data);
    } catch (err) {
      if (isMounted && err.name !== "AbortError") setError(getErrorMessage(err));
    }
  };

  fetchData();

  return () => {
    isMounted = false;
    controller.abort();
  };
}, []);
```

---

## 5. Components (`/components/...` e `/app/...`)

- **Responsabilidade:** Camada Visual / View (React components puros e responsivos).
- **Regras:**
  - Consume o estado sempre via Custom Hook (`const { deleteNote } = useNotes()`).
  - Dispare funções baseadas em eventos de usuário (`onClick`, `onSubmit`).
  - Lidando com Feedbacks: Adicione `toast()` ou alertas de sucesso/erro baseados no retorno `try/catch` no front-end após a invocação do Hook.
  - **Proibido:** Realizar chamadas lógicas de Firebase diretamente nos componentes visuais.
  - **Proibido:** Colocar lógica de negócio ou transformações complexas de dados dentro dos components — isso vai no Hook ou no Service.

---

## 6. API Routes (`/app/api/...`)

- **Responsabilidade:** Endpoints backend (Serverless Functions) para lógicas que **não podem ou não devem** ser executadas no lado do cliente.
- **Quando usar:**
  1. **Segredos e Credenciais:** Quando a operação exigir chaves privadas que não devem vazar para o navegador (Ex: Stripe, OpenAI, Resend).
  2. **Interação com Firebase Admin SDK:** Ações administrativas com permissões elevadas.
  3. **Webhooks de Terceiros:** Para receber notificações de serviços externos.
  4. **Bypass de CORS:** Fazer chamadas a APIs de terceiros que bloqueiam chamadas via Client-Side.
- **Regras e Comunicação:**
  - Na API Route (`route.ts`), use o Firebase Admin SDK (não o Client SDK) se for modificar o banco.
  - O front-end (via camada de _Services_) utilizará `fetch('/api/stripe/checkout', { method: 'POST' })` para se comunicar com essas rotas.
  - **Toda API Route deve validar e sanitizar o body da requisição antes de qualquer operação.** Veja [`security.md`](./security.md) para as regras de validação.

---

## 7. Server Actions (`/actions/...`)

- **Responsabilidade:** Funções assíncronas que rodam **exclusivamente no servidor** e podem ser chamadas diretamente pelos Client ou Server Components sem precisar criar uma API HTTP manual.
- **Qual a diferença para a `/api/`?**
  - **Server Actions:** São específicas para a comunicação interna do app. Você as importa como funções JS e o Next.js cuida das requisições por baixo dos panos. Úteis para mutações (formulários, login, cookies) e revalidação de cache (`revalidatePath`).
  - **API Routes:** São URLs HTTP padronizadas. Use quando um sistema externo precisar se comunicar com você (webhooks, APIs públicas).
- **Regras:**
  - O arquivo/função deve conter a diretiva `'use server'` no topo.
  - Ideal para autenticação, manipulação de cookies e mutações complexas.
  - **Nunca confie em dados vindos do cliente sem validação.** Veja [`security.md`](./security.md).

---

## Diagrama de Fluxo da Arquitetura

```
[UI Component]
     │  evento (onClick, onSubmit)
     ▼
[Custom Hook]  ◄──── lê/escreve ────►  [Zustand Store]
     │  await
     ▼
[Service]
     │  Firestore SDK / fetch
     ▼
[Firebase / API Externa]
     │
     ▼
[firestore.rules]  ← segurança real acontece aqui
```

Para regras de validação de inputs, proteção de rotas, sanitização e boas práticas de segurança, consulte obrigatoriamente [`security.md`](./security.md).