import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SingIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Sign In
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Welcome back!
        </p>
        <Link href="/hub/items">
          <Button variant="default" size="lg">
            Sign In with Google
          </Button>
        </Link>
      </div>
    </div>
  );
}
