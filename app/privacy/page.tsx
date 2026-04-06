import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="page-container max-w-4xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="card-section">
          <h1 className="page-title mb-4">Política de Privacidade</h1>
          <p className="page-description mb-8">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Informações que Coletamos</h2>
              <p>
                No MyNotes, a sua privacidade é nossa prioridade. Coletamos apenas as informações estritamente necessárias para o funcionamento do serviço, como seu endereço de e-mail e nome (fornecidos pelo Google Login) para identificar sua conta e sincronizar suas notas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Uso das Notas</h2>
              <p>
                O conteúdo das suas notas é privado e criptografado. Nós não acessamos, lemos ou compartilhamos o conteúdo das suas notas com terceiros. Seus dados são armazenados de forma segura em nossos servidores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Cookies e Rastreamento</h2>
              <p>
                Utilizamos cookies apenas para manter sua sessão ativa e garantir a segurança da conta. Não utilizamos cookies para fins publicitários ou rastreamento de comportamento fora do aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Seus Direitos</h2>
              <p>
                Você tem o direito de acessar, corrigir ou excluir seus dados a qualquer momento. Caso deseje encerrar sua conta, todas as suas notas e informações pessoais serão removidas permanentemente de nossos sistemas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Segurança</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Contato</h2>
              <p>
                Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco através do suporte oficial do projeto.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
