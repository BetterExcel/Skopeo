<?php

/**
 * Nextcloud app routes for AI Calc Assistant
 */

return [
    'routes' => [
        ['name' => 'api#health', 'url' => '/api/health', 'verb' => 'GET'],
        ['name' => 'api#config', 'url' => '/api/config', 'verb' => 'GET'],
    ]
];
