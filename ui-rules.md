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
