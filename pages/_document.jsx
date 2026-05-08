import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <title>Áxicon</title>
        <meta name="application-name" content="Áxicon" />
        <meta name="description" content="Sistema interno Áxicon — CRM, Propostas e Financeiro" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Áxicon" />
        <meta name="theme-color" content="#001489" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />

        {/* Fontes */}
        <link
          href="https://db.onlinewebfonts.com/c/9366bd460113d8bf675fd2bdfe1ce764?family=The+Seasons"
          rel="stylesheet"
        />
        <link
          href="https://db.onlinewebfonts.com/c/f7d34c9e4c3102c89048d775c27a78f3?family=The+Seasons+Bold"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* Registrar Service Worker */}
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(e) {
                console.warn('SW registro falhou:', e);
              });
            });
          }
        `}} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
