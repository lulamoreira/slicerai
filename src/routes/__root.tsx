import { createRootRouteWithContext, Outlet, ScrollRestoration, HeadContent, Scripts } from '@tanstack/react-router'
import * as React from 'react'
import { useStore } from '../lib/store'
import '../styles.css'

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SlicerAI for Bambu Studio',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const theme = useStore((state) => state.app.theme)
  
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <html className={theme}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground transition-colors duration-300">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
