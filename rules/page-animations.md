# Regras para Animações de Página (Framer Motion)

Para manter a consistência visual e a fluidez da interface, todas as páginas principais do Hub devem implementar animações de entrada utilizando o Framer Motion e as variantes pré-definidas em `@/lib/animations`.

## 1. Estrutura Básica do Container

Toda página deve utilizar o componente `motion.main` ou `motion.div` como container principal com as variantes de container:

```tsx
import { motion } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";

export default function SuaPagina() {
  return (
    <motion.main
      className="page-container" // Classe CSS global para containers de página
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Conteúdo da página */}
    </motion.main>
  );
}
```

## 2. Animação de Elementos Filhos

Para que o efeito de "stagger" (atraso sequencial entre elementos) funcione, os elementos filhos diretos ou seções devem utilizar a variante `itemFadeInUpVariants`:

```tsx
<motion.div variants={itemFadeInUpVariants}>
  <h1 className="page-title">Título da Página</h1>
  <p className="page-description">Descrição da página.</p>
</motion.div>

<motion.section variants={itemFadeInUpVariants} className="card-section">
  {/* Conteúdo da seção */}
</motion.section>
```

## 3. Variantes Disponíveis em `@/lib/animations`

- `pageContainerVariants`: Controla a opacidade global e o `staggerChildren` (atualmente definido como 0.1s).
- `itemFadeInUpVariants`: Faz o elemento surgir de baixo para cima (y: 20 -> 0) com fade in. Utilize em `motion.div`, `motion.section`, `motion.header`, etc.

## 4. Boas Práticas

- **Use `page-container`**: Sempre aplique a classe `page-container` no elemento principal para garantir o padding e largura consistentes.
- **Hierarquia**: Evite animar muitos elementos individualmente se eles puderem ser agrupados em um único `motion.div` com `itemFadeInUpVariants`.
- **Condicionais**: Se a página tiver estados de "Loading", aplique a animação no container que renderiza o conteúdo final após o carregamento.
