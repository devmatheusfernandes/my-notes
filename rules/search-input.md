# Regras para Search Inputs

1. **Uso de Empty States**: 
   Sempre que um campo de busca/pesquisa (Search Input) for implementado para filtrar uma lista de itens, e essa lista puder ficar vazia devido ao filtro aplicado, **é obrigatório** implementar um "Empty State" (estado vazio).

2. **Componentes Obrigatórios**:
   Deve-se utilizar o componente `Empty` do design system da aplicação (`@/components/ui/empty`). O Empty state precisa incluir:
   - `<Empty>` como container principal.
   - `<EmptyContent>` para agrupar o conteúdo.
   - `<EmptyMedia>` (idealmente com `variant="icon"`) exibindo um ícone representativo, como `SearchX` do pacote `lucide-react`.
   - `<EmptyTitle>` com a mensagem principal (ex: "Nenhum resultado encontrado").
   - `<EmptyDescription>` informando qual termo foi buscado, se aplicável, ou uma mensagem orientadora.

3. **Exemplo de Implementação**:
   ```tsx
   import { SearchX } from "lucide-react";
   import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

   // ...
   {searchQuery && resultados.length === 0 ? (
     <Empty className="mt-8">
       <EmptyContent>
         <EmptyMedia variant="icon">
           <SearchX />
         </EmptyMedia>
         <EmptyTitle>Nenhum resultado encontrado</EmptyTitle>
         <EmptyDescription>
           Sua busca por "{searchQuery}" não retornou resultados.
         </EmptyDescription>
       </EmptyContent>
     </Empty>
   ) : (
     <SuaListaDeResultados items={resultados} />
   )}
   ```
