export default function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 grid-flow-dense auto-rows-[120px] gap-3 md:grid-cols-4 md:auto-rows-[140px]">
      {children}
    </div>
  );
}
