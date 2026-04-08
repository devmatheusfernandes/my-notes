"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Network, BookOpen, BrainCircuit } from "lucide-react";
import Header from "@/components/hub/hub-header";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    disabled?: boolean;
}

function FeatureCard({ title, description, href, icon: Icon, disabled = false }: FeatureCardProps) {
    const content = (
        <div className={cn(
            "group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300",
            !disabled ? "hover:border-primary/50 hover:bg-card/80 hover:shadow-2xl hover:shadow-primary/5" : "opacity-60 cursor-not-allowed"
        )}>
            <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground/90">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed italic">
                        {description}
                    </p>
                </div>
            </div>

            {/* Subtle bottom accent line */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary/50 to-transparent transition-all duration-500 group-hover:w-full" />
        </div>
    );

    if (disabled) {
        return (
            <motion.div variants={itemFadeInUpVariants}>
                {content}
            </motion.div>
        );
    }

    return (
        <motion.div variants={itemFadeInUpVariants} whileHover={{ y: -5 }}>
            <Link href={href}>
                {content}
            </Link>
        </motion.div>
    );
}

export default function PerspicazPage() {
    const features = [
        {
            title: "Genealogia",
            description: "Visualize as conexões e linhagens entre suas notas e ideias de forma dinâmica.",
            href: "/hub/perspicaz/genealogy",
            icon: Network,
        },
        {
            title: "Análise Semântica",
            description: "Em breve: Descubra tópicos ocultos e relações conceituais inteligentes em seus documentos.",
            href: "#",
            icon: BrainCircuit,
            disabled: true,
        },
        {
            title: "Síntese de Conhecimento",
            description: "Em breve: Agrupe informações fragmentadas em visões consolidadas e acionáveis.",
            href: "#",
            icon: BookOpen,
            disabled: true,
        },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header
                showSearch={false}
                showBreadcrumb={false}
            />

            <motion.main
                className="page-container"
                variants={pageContainerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex flex-col gap-8">
                    <motion.div variants={itemFadeInUpVariants} className="space-y-4">
                        <h1 className="page-title">
                            Perspicaz
                        </h1>
                        <p className="page-description">
                            Expanda sua compreensão através de visualizações avançadas e processamento inteligente de informações.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                </div>
            </motion.main>
        </div>
    );
}