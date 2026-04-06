import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="page-title mb-4">Termos e Condições de Uso</h1>
          <p className="page-description mb-8">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-foreground/80 font-medium">
            <section>
              <h2 className="text-xl font-bold text-foreground">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar o MyNotes, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com algum destes termos, não deverá utilizar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">2. Uso do Serviço</h2>
              <p>
                O MyNotes é uma plataforma de anotações pessoais. Você é responsável por todo o conteúdo que cria, armazena ou compartilha através do serviço. O uso do serviço deve estar em conformidade com as leis locais e internacionais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">3. Conta e Segurança</h2>
              <p>
                Para utilizar o MyNotes, você deve possuir uma conta Google válida. Você é responsável por manter a confidencialidade das suas informações de acesso e por todas as atividades que ocorrem sob sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">4. Propriedade Intelectual</h2>
              <p>
                Todas as notas que você cria são de sua propriedade exclusiva. O MyNotes não reivindica quaisquer direitos de propriedade sobre o seu conteúdo. No entanto, ao utilizar o serviço, você nos concede a permissão necessária para hospedar e processar seus dados para o funcionamento do aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">5. Limitação de Responsabilidade</h2>
              <p>
                O MyNotes é fornecido "como está". Embora nos esforcemos para garantir a máxima disponibilidade e segurança, não seremos responsáveis por quaisquer perdas de dados, lucros interrompidos ou outros danos decorrentes do uso do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">6. Modificações nos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Caso ocorram mudanças significativas, notificaremos os usuários através do próprio aplicativo ou por e-mail.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">7. Contato</h2>
              <p>
                Para dúvidas sobre estes Termos de Serviço, entre em contato através dos canais de suporte oficiais.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
