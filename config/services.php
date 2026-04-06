<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', '/auth/google/callback'),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => 'gemini-1.5-flash',
        'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
    ],

    'claudflare' => [
        'key' => env('CLOUDFLARE_API_KEY'),
        'model' => env('CLOUDFLARE_AI_MODEL'),
        'base_url' => sprintf('https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s', env('CLOUDFLARE_ACCOUNT_ID'), env('CLOUDFLARE_AI_MODEL')),
        'fallback_regex' => env('CLOUDFLARE_FALLBACK_REGEX'),
    ],

];