# UI Rules

## 1. Experiência de Usuário e UI (Usabilidade)

- **Responsabilidade:** Garantir um design responsivo, tátil e seguro (mobile-first).
- **Regras de Confirmação (Destructive Actions):**
  - NUNCA utilize funções nativas do navegador como `window.confirm()` ou `alert()` para validar ações.
  - Para ações destrutivas (Ex: "Anotação será excluída", "Tem certeza que deseja sair?"), utilize **SEMPRE** o componente `<Drawer>` do `shadcn/ui`. O `<Drawer>` provê uma experiência mobile-first infinitamente superior, subindo do rodapé da tela com os botões "Confirmar Exclusão" (Destructive) e "Cancelar" (Outline).

## 2. Sempre use Drawer ao invés de Modal ou Dialog

- **Responsabilidade:** Garantir um design responsivo, tátil e seguro (mobile-first).
- **Regras:**
  - Sempre utilize o componente `<Drawer>` do `shadcn/ui` em vez de `<Modal>` ou `<Dialog>`.

# 🎨 Regras de Design & UI/UX (Design System)

Este documento define as regras de consistência visual, responsividade e animações para manter a interface uniforme.

## 📱 1. Abordagem Mobile-First

Todas as interfaces devem ser desenhadas primariamente para telas pequenas e adaptadas para telas maiores usando os prefixos do Tailwind.

- **Paddings:** O `.page-container` já define um `px-4` ou `p-5` (`py-6`) no mobile, escalando para `sm:px-6` e `sm:py-8` no desktop.
- **Containers:** Utilize a classe utilitária `.page-container` (definida em `globals.css`) nos elementos principais (`<main>`). Ela garante o alinhamento centralizado (`mx-auto`), largura total (`w-full`) e um limite de largura confortável (`max-w-7xl`).
- **Inputs e Botões:** Em formulários curtos, empilhe em telas pequenas (`flex-col`) e coloque lado a lado em telas médias (`sm:flex-row`). Botões no mobile costumam ter `w-full`, passando para `sm:w-auto` no desktop.

## 📏 2. Espaçamento e Tipografia

- **Gaps (Espaçamento entre itens):** Use a escala padrão do Tailwind.
  - `gap-2` para ícone + texto.
  - `gap-3` ou `gap-4` para inputs empilhados.
  - `space-y-6` ou `space-y-8` para separar seções (Cards) de uma página.
- **Títulos e Descrições de Página:** Utilize `.page-title` para o título principal (h1) e `.page-description` para o texto de apoio logo abaixo.
- **Títulos e Descrições de Card:** Utilize `.card-title` para o título de seção (h2) e `.card-description` para o texto explicativo dentro do card.
- **Estilos de Apoio:** Continue usando `text-muted-foreground` quando for necessário um texto de apoio fora das classes padronizadas acima.

## 🎛️ 3. Componentes e Cards (Superfícies)

- **Cards Padrão:** Use sempre a classe utilitária `.card-section` (definida em `globals.css`). Ela garante o estilo padronizado: `rounded-2xl border bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md`.
- **Interatividade Visual:** O `.card-section` já inclui por padrão uma animação de profundidade no hover (`hover:shadow-md`). Mantenha este comportamento para cards interativos.
- **Status Visual:** Para indicar se algo está ativo/inativo, evite depender só de texto. Use pequenos indicadores de cor (ex: bolinhas `bg-emerald-500` para ativo, `bg-amber-500` para atenção).
- **Desativação (Disabled State):** Se algo não puder ser clicado (ex: ativar biometria sem PIN), explique o _motivo_ imediatamente abaixo com um texto de feedback (`text-xs text-destructive` ou `text-amber-500`).

## ✨ 4. Animações (Framer Motion)

Todas as animações principais devem ser importadas de `animations.ts`.

- **Entrada de Página:** A página deve revelar seu conteúdo em cascata (_stagger_).
- **Cards/Seções:** Use o `itemFadeInUpVariants` (fade in de baixo para cima) com um leve efeito _spring_ para dar uma sensação orgânica, fluida e não-robótica.
- **Evite excessos:** Animações servem para guiar o olhar, não para distrair. Mantenha a duração curta (`stiffness: 300, damping: 24`).

## ⏳ 5. Estados de Carregamento e Feedback

- **SWR Patterns:** Aproveite o comportamento `stale-while-revalidate`. Se o cache já possui dados, mostre-os imediatamente enquanto revalida em background. Isso evita telas de carregamento bloqueantes.
- **First Load:** Use skeletons ou spinners apenas no primeiro carregamento onde não há cache disponível (`if (isLoading && !data)`).
- **Optimistic UI:** Para ações de CRUD, priorize atualizações otimistas. O usuário deve sentir que o app é instantâneo, sem spinners desnecessários.
- **Toasts:** Use `toast.promise` para dar feedback visual de operações que levam tempo (ex: upload de PDF, exclusão).
