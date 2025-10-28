import { ReactNode } from 'react'

const PaintSplotches = () => (
  <>
    <div
      className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rotate-[12deg] bg-[radial-gradient(circle_at_30%_30%,#FFB3BA,transparent_60%)] opacity-70"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute top-24 -right-20 h-80 w-80 rotate-[-18deg] bg-[radial-gradient(circle_at_50%_50%,#FFD166,transparent_65%)] opacity-60"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute bottom-[-80px] left-1/3 h-96 w-96 rotate-[22deg] bg-[radial-gradient(circle_at_40%_40%,#9BF6FF,transparent_55%)] opacity-60"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute top-1/3 left-10 h-40 w-40 rotate-[-8deg] bg-[radial-gradient(circle_at_60%_40%,#C3F584,transparent_60%)] opacity-60"
      aria-hidden="true"
    />
  </>
)

interface FunBackgroundProps {
  children: ReactNode
  className?: string
}

export function FunBackground({ children, className = '' }: FunBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#FFF5D6] ${className}`}>
      <PaintSplotches />
      <div
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'120\\' height=\\'120\\' viewBox=\\'0 0 120 120\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23ffe9a8\\' fill-opacity=\\'0.35\\'%3E%3Ccircle cx=\\'20\\' cy=\\'20\\' r=\\'8\\'/%3E%3Ccircle cx=\\'80\\' cy=\\'50\\' r=\\'6\\'/%3E%3Ccircle cx=\\'60\\' cy=\\'100\\' r=\\'10\\'/%3E%3C/g%3E%3C/svg%3E')]"
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
