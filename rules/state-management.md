# State Management Rules — Zustand vs. SWR

> **Complementar a:** [`architecture-rules.md`](./architecture-rules.md) — este documento detalha **quando e por quê** usar cada estratégia de estado. O `architecture-rules.md` define **como** implementar cada camada.

---

## A Pergunta Central

> *"Esse dado precisa ser compartilhado entre múltiplas partes da aplicação, ou é isolado a um único componente/rota?"*

Essa é a decisão principal. Use a tabela abaixo como guia rápido e aprofunde nos critérios de cada seção.

---

## Guia de Decisão Rápida

| Critério | Zustand | SWR / `fetch` direto |
|---|---|---|
| Dado é compartilhado entre rotas/componentes distantes? | ✅ Sim | ❌ Não |
| Dado é mutado pelo próprio app (CRUD do usuário)? | ✅ Sim | ⚠️ Evitar |
| Dado exige **atualização otimista** instantânea da UI? | ✅ Sim | ⚠️ Possível, mas verboso |
| Lógica de lock/unlock ou estado efêmero de sessão? | ✅ Sim | ❌ Não |
| Dado é **somente leitura** e vem de uma API externa? | ❌ Não | ✅ Sim |
| Dado pertence somente a **uma página/rota** específica? | ❌ Não | ✅ Sim |
| Precisa de **revalidação automática** (stale-while-revalidate)? | ❌ Não | ✅ Sim |
| Dados que expiram ou mudam com frequência sem ação do usuário? | ❌ Não | ✅ Sim |

---

## 1. Use Zustand quando…

### 1.1 O dado é global e compartilhado entre componentes distantes

Se múltiplos componentes em partes distintas da árvore React precisam ler ou escrever o mesmo estado, coloque-o no Zustand.

**Exemplos reais no projeto:**
- `noteStore` — a lista de notas é consumida no sidebar, no editor, na busca, e nos filtros por tag ao mesmo tempo.
- `tagStore` — tags são listadas no painel de gerenciamento *e* nos chips dentro de cada nota.
- `folderStore` — a pasta ativa é lida tanto no header quanto no conteúdo principal.

```typescript
// ✅ BOM — dado global acessado em N lugares
const { notes } = useNoteStore();
const { tags } = useTagStore();
```

### 1.2 O dado é resultado de uma **mutação do próprio usuário**

Sempre que o usuário cria, edita ou deleta algo, atualize o Zustand imediatamente após o sucesso do Service. Isso evita refetch desnecessário e mantém a UI responsiva.

```typescript
// ✅ Padrão correto — Hook orquestra Service + Store
const createNote = async (userId: string, data: CreateNoteDTO) => {
  const newNote = await noteService.createNote(userId, data);
  addNote(newNote); // ← atualiza o store local, UI reage instantaneamente
};
```

### 1.3 Estado efêmero de sessão (não persiste no banco)

Estado que existe apenas enquanto a sessão está ativa e não representa um documento no banco deve ir no Zustand.

**Exemplos reais no projeto:**
- `unlockedNotes` no `noteStore` — controla quais notas protegidas por senha foram desbloqueadas nessa sessão. Isso nunca vai ao Firestore.
- `settingsStore` — preferências de UI como tema ou layout que o usuário ajusta na sessão.

```typescript
// ✅ Estado de sessão puro — só existe no cliente
unlockNote: (noteId) => set((state) => {
  const next = new Set(state.unlockedNotes);
  next.add(noteId);
  return { unlockedNotes: next };
}),
```

### 1.4 Você precisa de **atualização otimista** previsível

Zustand permite reverter o estado com facilidade em caso de erro, já que você controla cada ação de forma explícita e síncrona.

---

## 2. Use SWR (ou `fetch` direto) quando…

> ⚠️ **Este projeto não usa SWR atualmente.** Esta seção define os critérios para adotá-lo ou para uso de `fetch` simples em Server Components/API Routes.

### 2.1 O dado pertence a **somente uma página ou rota**

Se um dado é usado apenas em um lugar e não será compartilhado, não polua o store global com ele. Use `fetch` em um Server Component ou SWR em um Client Component isolado.

```typescript
// ✅ BOM — dado isolado de uma página específica, sem necessidade de store global
// Em um Server Component:
async function AnalyticsPage() {
  const stats = await fetch('/api/analytics').then(r => r.json());
  return <StatsPanel data={stats} />;
}
```

### 2.2 O dado é **somente leitura** e vem de uma API externa

Dados consumidos de APIs de terceiros (clima, câmbio, notícias) que o usuário não muta diretamente são candidatos ideais ao SWR. O SWR cuida do cache, revalidação e estados de loading/error automaticamente.

```typescript
// ✅ BOM — dado externo somente leitura, com revalidação automática
const { data: exchangeRate, isLoading } = useSWR('/api/exchange-rate', fetcher, {
  refreshInterval: 60_000, // revalida a cada 1 minuto
});
```

### 2.3 O dado expira ou muda frequentemente **sem ação do usuário**

Se o dado precisa ser "fresco" periodicamente (ex: contagem de notificações, status de um job em background), o SWR com `refreshInterval` é mais adequado do que manter um polling manual no Zustand.

### 2.4 Server Components no Next.js App Router

Dados que podem ser buscados no servidor durante o render **nunca devem ir para o Zustand**. Use `fetch` com `cache` ou `revalidate` do Next.js diretamente no Server Component.

```typescript
// ✅ BOM — fetch com cache no servidor, zero overhead no cliente
async function NoteList({ userId }: { userId: string }) {
  const notes = await noteService.getNotesByUser(userId); // chamado no servidor
  return <ul>{notes.map(n => <li key={n.id}>{n.title}</li>)}</ul>;
}
```

---

## 3. O que **nunca** fazer

### ❌ Não duplique dados entre Zustand e SWR para a mesma entidade

Se `notes` está no `noteStore`, não crie um `useSWR('/api/notes')` que retorna a mesma lista. Isso gera duas fontes da verdade (_sources of truth_) que vão divergir.

```typescript
// ❌ ERRADO — duas fontes da verdade para o mesmo dado
const { notes } = useNoteStore();
const { data: swrNotes } = useSWR('/api/notes', fetcher); // conflito garantido
```

### ❌ Não use Zustand para dado que só existe em um formulário

Estado de formulário (valores de inputs, validação, step de wizard) deve ser `useState` local ou uma lib de formulário (ex: React Hook Form). Poluir o store global com isso é over-engineering.

```typescript
// ❌ ERRADO — estado de formulário no store global
const { title, setTitle } = useNoteStore(); // desnecessário

// ✅ CORRETO — estado local no componente
const [title, setTitle] = useState('');
```

### ❌ Não use Zustand para dado derivado

Não armazene no store algo que pode ser calculado a partir de outro dado já no store.

```typescript
// ❌ ERRADO — armazenar dado derivado
noteCount: notes.length, // isso fica desincronizado
filteredNotes: notes.filter(n => n.folderId === activeFolder), // idem

// ✅ CORRETO — derive no render ou com useMemo
const noteCount = notes.length;
const filteredNotes = useMemo(
  () => notes.filter(n => n.folderId === activeFolderId),
  [notes, activeFolderId]
);
```

---

## 4. Árvore de Decisão

```
Preciso exibir/usar um dado na UI
           │
           ▼
   Esse dado é resultado de uma mutação do usuário
   ou é compartilhado entre componentes distantes?
           │
    ┌──────┴──────┐
   SIM            NÃO
    │              │
    ▼              ▼
[Zustand Store]   Esse dado vem de uma API externa
via Hook +        ou pertence só a esta rota?
Service                    │
                    ┌──────┴──────┐
                   SIM            NÃO
                    │              │
                    ▼              ▼
              [SWR ou fetch]   [useState local]
              em Client ou     no componente
              Server Component
```

---

## 5. Resumo das Responsabilidades por Camada

| Camada | Responsabilidade | NÃO deve conter |
|---|---|---|
| `useState` local | Estado de UI efêmero (modais, inputs, hover) | Dados persistidos ou compartilhados |
| `Zustand Store` | Cache global de entidades mutadas pelo usuário | Lógica async, chamadas a Services |
| `SWR` | Dados somente leitura externos com revalidação | Entidades que o usuário muta diretamente |
| `Server Component fetch` | Dados do servidor no primeiro render | Estado reativo do cliente |
| `Custom Hook` | Orquestrador: liga Service + Store + tratamento de erro | Lógica de renderização |
