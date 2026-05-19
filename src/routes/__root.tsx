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
      { title: "Meu Guia 3d" },
      { property: "og:title", content: "Meu Guia 3d" },
      { name: "twitter:title", content: "Meu Guia 3d" },
      { name: "description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { property: "og:description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { name: "twitter:description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/632701a5-97f2-4bcf-ab22-7f64ce98f02c/id-preview-3e9aa53b--15974701-c0a5-406b-a75c-a813a63a4842.lovable.app-1779216975955.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/632701a5-97f2-4bcf-ab22-7f64ce98f02c/id-preview-3e9aa53b--15974701-c0a5-406b-a75c-a813a63a4842.lovable.app-1779216975955.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
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
