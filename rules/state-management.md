# State Management Rules — SWR vs. Zustand

> **Complementar a:** [`architecture-rules.md`](./architecture-rules.md) — este documento detalha **quando e por quê** usar cada estratégia de estado. O `architecture-rules.md` define **como** implementar cada camada.

---

## A Pergunta Central

> *"Esse dado representa um documento no banco de dados (Server State) ou é apenas um controle da interface (UI State)?"*

Esta é a decisão principal. O projeto utiliza **SWR** como a "Fonte da Verdade" para dados do servidor e **Zustand** para estados efêmeros do cliente.

---

## Guia de Decisão Rápida

| Critério | SWR (Primary Cache) | Zustand (UI State) |
|---|---|---|
| O dado vem do Firestore ou API externa? | ✅ Sim | ❌ Não |
| O dado precisa de cache automático e revalidação? | ✅ Sim | ❌ Não |
| O dado exige **atualização otimista** (Instant UI)? | ✅ Sim (via `mutate`) | ⚠️ Manual e complexo |
| O dado é compartilhado entre múltiplas rotas? | ✅ Sim (via Cache Key) | ✅ Sim |
| Estado de Lock/Unlock de notas na sessão? | ❌ Não | ✅ Sim |
| Estado de seleção de itens (Selection Mode)? | ❌ Não | ✅ Sim |
| Preferências de tema ou layout temporário? | ❌ Não | ✅ Sim |
| O dado deve sumir ao atualizar a página (F5)? | ❌ Não | ✅ Sim |

---

## 1. Use SWR (Recomendado para 90% dos dados)

O SWR é o responsável por buscar, guardar em cache e sincronizar os dados do servidor. Ele elimina a necessidade de `useEffect` para fetch de dados.

### 1.1 Entidades do Banco (Notes, Folders, Tags)

Tudo que possui um ID no banco de dados deve ser gerenciado pelo SWR.

```typescript
// ✅ PADRÃO — O hook encapsula o SWR
const { notes, isLoading, mutate } = useNotes(userId);
```

### 1.2 Atualizações Otimistas (Optimistic UI)

Sempre que o usuário realizar uma ação (Criar, Deletar, Editar), utilize o `mutate` do SWR com `optimisticData`. Isso faz a UI reagir instantaneamente antes da resposta do servidor.

```typescript
// ✅ PADRÃO — Mutação Otimista no Hook
const deleteNote = async (id: string) => {
  await mutate(
    cacheKey,
    async () => {
      await noteService.deleteNote(id);
      return notes.filter(n => n.id !== id);
    },
    {
      optimisticData: notes.filter(n => n.id !== id),
      rollbackOnError: true,
      revalidate: false,
    }
  );
};
```

---

## 2. Use Zustand (Apenas para UI State)

O Zustand deve ser usado **apenas** para estados que não pertencem ao banco de dados ou que são puramente interativos.

### 2.1 Estados Efêmeros de Sessão

Dados que não persistem no Firestore e servem apenas para a experiência atual do usuário.

**Exemplos reais no projeto:**
- `unlockedNotes`: IDs de notas que o usuário desbloqueou com senha nesta sessão.
- `selectionState`: Quais IDs estão selecionados no "Selection Mode".
- `isSidebarOpen`: Estado visual do menu lateral.

```typescript
// ✅ BOM — Estado de UI puro
const { unlockedNotes, lockNote } = useNoteStore();
```

---

## 3. O que **NUNCA** fazer

### ❌ Não duplique dados do SWR no Zustand
Nunca crie um "fetch" que baixa os dados da API e os salva em um `setNotes()` do Zustand. Isso cria duas fontes da verdade que ficarão desincronizado. Use o cache do SWR diretamente.

### ❌ Não use Zustand para dados de Server Components
Dados que podem ser resolvidos no servidor (Server Components) não precisam de Zustand nem de SWR inicial. Busque os dados no servidor e passe para os componentes. Use SWR apenas se precisar de interatividade/revalidação no cliente.

### ❌ Não use SWR para estado de formulário
Inputs e validações de formulário devem usar `useState` local ou `react-hook-form`. O SWR entra apenas no envio final dos dados.

---

## 4. Resumo das Responsabilidades

| Camada | Responsabilidade | Ferramenta |
|---|---|---|
| **Server State** | Notas, Pastas, Tags, Perfil | `useSWR` + `Service` |
| **UI State Global** | Locks, Seleção, Modais | `Zustand` |
| **UI State Local** | Toggles, Hover, Inputs | `useState` |
| **Persistência** | Firestore, Storage | `Service` |
| **Validação** | Schemas e DTOs | `Zod` |

---

## 5. Performance e Segurança

1. **Cache Keys:** Use chaves deterministas no SWR (ex: `['notes', userId]`). Sempre envolva a `cacheKey` em um `useMemo` se ela for um objeto ou array para evitar re-runs infinitos.
2. **Revalidação:** Desative `revalidateOnFocus` ou `revalidateOnReconnect` se o dado mudar muito pouco, economizando banda e Firebase Read Quotas.
3. **Segurança:** Nunca execute mutações otimistas sem validar os dados no `Service` correspondente. A UI "mente" para ser rápida, mas o `Service` e as `firestore.rules` garantem a verdade.
