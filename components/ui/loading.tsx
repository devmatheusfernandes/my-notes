import { Spinner } from "./spinner";

export function Loading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Spinner className="size-10" />
        </div>
    );
}