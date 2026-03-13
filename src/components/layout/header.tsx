interface HeaderProps {
  title: string
  alertCount?: number
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center border-b bg-card px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
    </header>
  )
}
