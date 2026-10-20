<?php

namespace App\Services;

use PhpMqtt\Client\ConnectionSettings;
use PhpMqtt\Client\MqttClient;

class MqttDeviceConfigPublisher
{
    public function publishTankHeight(string $deviceId, float $tankHeightCm): void
    {
        $client = new MqttClient(
            (string) config('services.mqtt.host'),
            (int) config('services.mqtt.port'),
            'septiguard-config-'.bin2hex(random_bytes(5)),
        );
        $settings = (new ConnectionSettings)
            ->setKeepAliveInterval(60)
            ->setUseTls((bool) config('services.mqtt.tls'));

        $client->connect($settings, true);

        try {
            $topic = sprintf(
                '%s/tanks/%s/config',
                trim((string) config('services.mqtt.topic_prefix'), '/'),
                $deviceId,
            );
            $payload = json_encode([
                'device_id' => $deviceId,
                'tank_height_cm' => $tankHeightCm,
            ], JSON_THROW_ON_ERROR);

            $client->publish($topic, $payload, 1, true);
        } finally {
            $client->disconnect();
        }
    }
}
