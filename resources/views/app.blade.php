<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="{{ csrf_token() }}" />

        <title inertia>{{ config('app.name', 'Gerenciador Financeiro') }}</title>

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <link rel="apple-touch-icon" href="/logo.svg" />

        {{-- Aplica o tema salvo antes do React montar (evita flash branco/escuro) --}}
        <script>
            (function() {
                var t = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
            })();

            // Registra o Service Worker do PWA
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                    });
                });
            }
        </script>

        <link rel="preconnect" href="https://fonts.bunny.net" />
        {{-- Inter: padrão da indústria fintech (Stripe, Linear, Vercel) — excelente legibilidade em telas | IBM Plex Mono: projetada para dados financeiros tabulares --}}
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800|ibm-plex-mono:400,500&display=swap" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="bg-background font-sans antialiased">
        @inertia
    </body>
</html>
