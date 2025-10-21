import { ReactNode } from 'react'

interface BoardLayoutProps {
  children: ReactNode
  modal: ReactNode
}

export default function BoardLayout({ children, modal }: BoardLayoutProps) {
  return (
    <>
      {modal}
      {children}
    </>
  )
}
