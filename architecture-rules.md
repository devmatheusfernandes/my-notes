# Feature Implementation Rules (Front & Back Separation)

Para manter a arquitetura limpa, segura e escalável, siga este padrão rigorosamente ao criar ou modificar funcionalidades de manipulação de dados na aplicação:

## 1. Services (`/services/[entity]Service.ts`)
- **Responsabilidade:** Interações exclusivas com o banco de dados (ex: Firebase Firestore) ou APIs externas.
- **Regras:**
  - Importe apenas funções do Firestore (`doc`, `deleteDoc`, `setDoc`, `getDocs`, etc).
  - Trate erros conectivamente via `try/catch`, registrando de forma controlada (`console.error`) e em seguida propague um erro usando `throw new Error("Mensagem limpa")`.
  - **Proibido:** Uso de estado global, Zustand, React hooks ou dependências da UI.

## 2. Store (`/store/[entity]Store.ts`)
- **Responsabilidade:** Gerenciamento de estado global no lado do cliente com Zustand. Funciona como cache de dados unificado.
- **Regras:**
  - Defina a interface `State` com dados globais explícitos: lista (`notes`), estado de carregamento (`isLoading`), e erro (`error`).
  - Crie e exporte apenas funções síncronas para manipulação da store local (Ex: `removeNote: (id) => set(state => ({ notes: state.notes.filter(n => n.id !== id) }))`).
  - **Proibido:** Lógica de async, promises, ou chamadas diretas a "Services". O Store é estritamente síncrono.

## 3. Hooks (`/hooks/use-[entity].ts`)
- **Responsabilidade:** A camada orquestradora (BFF/Controller do client-side) que liga a UI (Visual) aos Services (Backend) e ao Store (State).
- **Regras:**
  - Utilize as instâncias do respectivo Store para ler/escrever.
  - Funções assíncronas (como `deleteNote`) devem:
    1. Ativar loading (`setLoading(true)`) e resetar erro (`setError(null)`).
    2. Chamar o Service em um `try` (`await noteService.deleteNote(id)`).
    3. Sucesso: Manipular o estado local chamando funções da store (`removeNote(id)`).
    4. Fluxo de Catch: Formatar qualquer erro usando `getErrorMessage`, setar estado (`setError(msg)`) e lançar o throw original para notificar a UI.
    5. Finally: Encerrar o loading (`setLoading(false)`).

## 4. Components (`/components/...` e `/app/...`)
- **Responsabilidade:** Camada Visual / View (React components puros e responsivos).
- **Regras:**
  - Consume o estado sempre via Custom Hook (`const { deleteNote } = useNotes()`).
  - Dispare funções baseadas em eventos de usuário (`onClick`, `onSubmit`).
  - Lidando com Feedbacks: Adicione `toast()` ou alertas de sucesso/erro baseados no retorno `try/catch` no front-end após a invocação do Hook.
  - **Proibido:** Realizar chamadas lógicas de Firebase diretamente nos componentes visuais.

## 5. API Routes (`/app/api/...`)
- **Responsabilidade:** Endpoints backend (Serverless Functions) para lógicas que **NÃO podem ou NÃO devem** ser executadas no lado do cliente.
- **Quando usar:**
  1. **Segredos e Credenciais:** Quando a operação exigir chaves privadas que não devem vazar para o navegador do usuário (Ex: Integração com Stripe, OpenAI, Resend para envio de emails).
  2. **Interação com Firebase Admin SDK:** Algumas ações administrativas do banco de dados necessitam de permissões "Admin" restritas e garantidas pelo backend de forma elevada.
  3. **Webhooks de Terceiros:** Para receber notificações de serviços externos (Ex: O Stripe precisa avisar que a assinatura de um usuário foi paga com sucesso).
  4. **Bypass de CORS:** Fazer chamadas a APIs de terceiros que bloqueiam chamadas via Client-Side (CORS).
- **Regras e Comunicação:**
  - Na API Route (`route.ts`), não use o Firebase Client SDK. Use o Firebase Admin SDK (se for modificar banco de dados nestas rotas) ou fetch para serviços externos.
  - O front-end (via camada de _Services_) utilizará um `fetch('/api/stripe/checkout', { method: 'POST' })` para conversar constas rotas.
