import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

// Variantes de animação do Framer Motion
const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Atraso entre a animação de cada elemento filho
    },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}

function Empty({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      data-slot="empty"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border-dashed p-6 text-center text-balance",
        className
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      data-slot="empty-header"
      variants={itemVariants}
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-18 shrink-0 items-center justify-center rounded-full bg-muted text-foreground [&_svg:not([class*='size-'])]:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: HTMLMotionProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <motion.div
      data-slot="empty-icon"
      data-variant={variant}
      variants={itemVariants}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      data-slot="empty-title"
      variants={itemVariants}
      className={cn("text-sm font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      data-slot="empty-description"
      variants={itemVariants}
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      data-slot="empty-content"
      variants={itemVariants}
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance",
        className
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}