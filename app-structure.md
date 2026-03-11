meu-app/
│ ├── actions/ (Mutações seguras no servidor, se precisar esconder lógica do client)
│ ├── app/ (O roteador do Next.js: páginas, layouts e rotas de API)
│ ├── components/ (Toda a interface visual)
│ ├── hooks/ (A ponte entre a UI, a Store e os Services)
│ ├── lib/ (Configuração de bibliotecas de terceiros)
│ ├── schemas/ (Regras do Zod para validar dados)
│ ├── services/ (Acesso a dados: Firebase, APIs, leitura de arquivos locais)
│ ├── store/ (Gerenciamento de estado global com Zustand)
│ ├── types/ (Definições de interfaces do TypeScript)
│ └── utils/ (Funções puras e genéricas, como formatadores de data)
├── .env (Suas variáveis de ambiente do Firebase)

app/: Fica apenas a casca visual das rotas. Exemplo: app/notes/page.tsx chama os componentes, mas não faz a lógica de buscar notas no banco.

components/: Organize por domínio para não virar bagunça. Crie subpastas como components/ui (para botões e inputs do Shadcn), components/notes e components/bible.

lib/: Aqui entram arquivos como lib/firebase.ts (para inicializar a conexão) e lib/utils.ts (que o próprio Shadcn usa para mesclar classes do Tailwind).

schemas/: Arquivos como schemas/noteSchema.ts usando Zod para garantir que ninguém crie uma nota sem título.

services/: Arquivos como services/noteService.ts com funções que fazem o "trabalho sujo" de ir até o Firestore criar, ler, atualizar ou deletar documentos.

store/: Arquivos como store/useNoteStore.ts (usando Zustand) para guardar as notas baixadas na memória e evitar consultas repetidas ao banco.

types/: Interfaces puras, como types/note.ts definindo que uma nota tem id: string e content: string.

Design da página de notas
https://dribbble.com/shots/22188919-Samsung-Notes-App-Redesign-Concept
