import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          My Notes
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          A simple note-taking app
        </p>
        <Link href="/signin">
          <Button variant="default" size="lg">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}
