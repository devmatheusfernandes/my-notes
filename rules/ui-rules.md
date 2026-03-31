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

- **Paddings:** Padrão `p-4` ou `p-5` no mobile, escalando para `sm:p-6` no desktop.
- **Containers:** Use `w-full max-w-2xl mx-auto` para centralizar páginas de formulário e configurações. O conteúdo não deve esticar infinitamente em telas ultra-wide.
- **Inputs e Botões:** Em formulários curtos, empilhe em telas pequenas (`flex-col`) e coloque lado a lado em telas médias (`sm:flex-row`). Botões no mobile costumam ter `w-full`, passando para `sm:w-auto` no desktop.

## 📏 2. Espaçamento e Tipografia

- **Gaps (Espaçamento entre itens):** Use a escala padrão do Tailwind.
  - `gap-2` para ícone + texto.
  - `gap-3` ou `gap-4` para inputs empilhados.
  - `space-y-6` ou `space-y-8` para separar seções (Cards) de uma página.
- **Títulos:** `text-2xl` no mobile e `sm:text-3xl font-bold tracking-tight` para títulos de página (h1). `text-lg font-semibold` para títulos de Cards (h2).
- **Subtítulos/Apoio:** Use sempre `text-muted-foreground` com tamanho `text-sm`.

## 🎛️ 3. Componentes e Cards (Superfícies)

- **Cards Padrão:** Use `rounded-2xl border bg-card p-5 sm:p-6 shadow-sm`.
- **Interatividade Visual:** Adicione `transition-all hover:shadow-md` em Cards que possam ter alguma interatividade secundária para dar sensação de profundidade.
- **Status Visual:** Para indicar se algo está ativo/inativo, evite depender só de texto. Use pequenos indicadores de cor (ex: bolinhas `bg-emerald-500` para ativo, `bg-amber-500` para atenção).
- **Desativação (Disabled State):** Se algo não puder ser clicado (ex: ativar biometria sem PIN), explique o _motivo_ imediatamente abaixo com um texto de feedback (`text-xs text-destructive` ou `text-amber-500`).

## ✨ 4. Animações (Framer Motion)

Todas as animações principais devem ser importadas de `animations.ts`.

- **Entrada de Página:** A página deve revelar seu conteúdo em cascata (_stagger_).
- **Cards/Seções:** Use o `itemFadeInUpVariants` (fade in de baixo para cima) com um leve efeito _spring_ para dar uma sensação orgânica, fluida e não-robótica.
- **Evite excessos:** Animações servem para guiar o olhar, não para distrair. Mantenha a duração curta (`stiffness: 300, damping: 24`).

## ⏳ 5. Estados de Carregamento

- Nunca mostre uma tela vazia em branco ou quebrada enquanto busca os dados da API/Firebase.
- Use a verificação `if (isLoading) return <Loading />` envolta em um container centralizado (`min-h-[50vh] flex items-center justify-center`) para garantir que o layout não "pisque" de forma brusca.
