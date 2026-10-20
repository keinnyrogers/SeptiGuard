<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
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

    'sensor' => [
        'api_key' => env('SENSOR_API_KEY'),
    ],

    'prediction' => [
        'url' => env('PREDICTION_SERVICE_URL'),
        'api_key' => env('PREDICTION_SERVICE_API_KEY'),
        'timeout' => (int) env('PREDICTION_SERVICE_TIMEOUT', 5),
    ],

    'mqtt' => [
        'host' => env('MQTT_HOST', 'broker.hivemq.com'),
        'port' => (int) env('MQTT_PORT', 1883),
        'topic_prefix' => env('MQTT_TOPIC_PREFIX', 'septiguard-test-aggin'),
        'topic' => env('MQTT_TOPIC', 'septiguard-test-aggin/tanks/+/readings'),
        'tls' => filter_var(env('MQTT_TLS', false), FILTER_VALIDATE_BOOLEAN),
    ],

];
