# Regras de Tipagem (TypeScript)

1. **Preocupação Máxima com Tipagem**:
   Sempre que modificarmos ou criarmos novo código, a qualidade e robustez da tipagem deve ser uma prioridade alta. Jamais devemos comprometer a segurança de tipos para uma correção rápida.

2. **Proibição Estrita do Uso de `any`**:
   O padrão do projeto proíbe o uso arbitrário de explícitos `any`. O uso de `any` derrota todo o propósito de usar o TypeScript:
   - Se os tipos exatos de uma API de terceiros ou evento do DOM não forem conhecidos, busque os tipos corretos exportados pelas bibliotecas ou use `unknown` combinando asserção de tipos (Type Guards) em tempo de execução se estritamente necessário.
   - Entenda a origem dos dados e construa interfaces coerentes e extensíveis.

3. **Herança e Extensão de Props**:
   Ao estender elementos nativos ou bibliotecas base, utilize corretamente `React.ComponentProps<T>`, `React.HTMLAttributes<T>`, etc. Se o componente precisa receber *props* customizadas além das nativas, intercepte e adicione os tipos através de interseções.
   Exemplo correto:
   ```typescript
   type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
     variant?: "custom" | "default";
   };
   // Em vez de props as any, expanda o tipo.
   ```

Essa regra garante legibilidade, previsibilidade de bugs e que o autocomplete nas IDEs continue funcionando corretamente para todos os componentes.
