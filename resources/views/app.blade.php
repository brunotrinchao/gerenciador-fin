<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="{{ csrf_token() }}" />

        <title inertia>{{ config('app.name', 'Gerenciador Financeiro') }}</title>

        {{-- Aplica o tema salvo antes do React montar (evita flash branco/escuro) --}}
        <script>
            (function() {
                var t = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
            })();
        </script>

        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="bg-background font-sans antialiased">
        @inertia
    </body>
</html>
