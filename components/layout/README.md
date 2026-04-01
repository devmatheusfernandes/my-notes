# SidebarLayout Documentation

O `SidebarLayout` é um componente de layout de alto nível projetado para criar interfaces divididas (Split View). Ele resolve problemas comuns de sobreposição entre cabeçalhos e painéis laterais, oferecendo uma experiência responsiva e fluida.

## Como Usar

O componente deve envolver tanto o conteúdo principal quanto o conteúdo da sidebar. Para evitar que o `Header` seja sobreposto pela Sidebar no desktop, **insira o Header como o primeiro filho do SidebarLayout**.

```tsx
import { SidebarLayout } from "@/components/layout/SidebarLayout";

export default function MyPage() {
  const sidebarContent = (
    <div>Conteúdo da Lateral (Notas, Metadados, etc)</div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent}>
      {/* Coluna da Esquerda (Principal) */}
      <MyHeader /> 
      
      <main className="flex-1 overflow-y-auto">
        {/* Conteúdo do Artigo/Página */}
      </main>
    </SidebarLayout>
  );
}
```

## Comportamento Responsivo

- **Desktop**: 
  - Cria duas colunas reais (`flex-row`).
  - A coluna da esquerda (`flex-1`) contém o Header e o Conteúdo.
  - A coluna da direita tem largura fixa de `350px` (configurável via prop `desktopWidth`).
  - A Sidebar **não tampa** o conteúdo; ela o empurra.

- **Mobile**:
  - Empilha o conteúdo verticalmente (`flex-col`).
  - O conteúdo principal ocupa o topo.
  - A Sidebar aparece na parte inferior com **35% de altura**, permitindo que o usuário continue vendo a parte superior do artigo enquanto consulta a nota.

## Propriedades (Props)

| Prop | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | - | Conteúdo da coluna principal (inclua o Header aqui). |
| `sidebarContent` | `ReactNode` | - | Conteúdo que aparecerá no painel lateral. |
| `desktopWidth` | `string` | `"350px"` | Largura da sidebar no desktop. |
| `className` | `string` | - | Classes CSS adicionais para o contêiner pai. |

## Regras de Ouro
1. **Z-Index**: O layout gerencia o z-index internamente. Evite setar z-index altos nos filhos para não quebrar a lógica de empilhamento do Mobile Split-View.
2. **Scroll**: O `SidebarLayout` gerencia o overflow. Se precisar de scroll interno na coluna principal, verifique se o pai tem altura definida (ex: `h-screen`).
