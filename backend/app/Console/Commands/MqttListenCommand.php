<?php

namespace App\Console\Commands;

use App\Services\SensorReadingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpMqtt\Client\ConnectionSettings;
use PhpMqtt\Client\MqttClient;
use Throwable;

class MqttListenCommand extends Command
{
    protected $signature = 'mqtt:listen';

    protected $description = 'Listen for MQTT sensor readings and store them';

    public function handle(SensorReadingService $readingService): int
    {
        $host = (string) config('services.mqtt.host');
        $port = (int) config('services.mqtt.port');
        $topic = (string) config('services.mqtt.topic');
        $clientId = 'septiguard-laravel-'.bin2hex(random_bytes(5));

        $this->info("Listening on {$host}:{$port} ({$topic})");

        $settings = (new ConnectionSettings)
            ->setKeepAliveInterval(60)
            ->setUseTls((bool) config('services.mqtt.tls'))
            ->setReconnectAutomatically(true)
            ->setMaxReconnectAttempts(3)
            ->setDelayBetweenReconnectAttempts(2000);

        while (true) {
            $client = new MqttClient($host, $port, $clientId);
            try {
                $client->connect($settings);
                $client->subscribe($topic, function (string $topic, string $message) use ($readingService): void {
                    $this->processMessage($topic, $message, $readingService);
                }, MqttClient::QOS_AT_MOST_ONCE);

                $this->info('Connected to MQTT broker and subscribed.');
                $client->loop(true);
                $this->warn('MQTT listener loop ended. Reconnecting in 5 seconds.');
            } catch (Throwable $exception) {
                Log::warning('MQTT listener disconnected; reconnecting.', [
                    'host' => $host,
                    'port' => $port,
                    'error' => $exception->getMessage(),
                ]);
                $this->warn('MQTT connection lost: '.$exception->getMessage());
                $this->line('Retrying MQTT connection in 5 seconds...');
            } finally {
                if ($client->isConnected()) {
                    try {
                        $client->disconnect();
                    } catch (Throwable $exception) {
                        Log::warning('Unable to close MQTT connection cleanly.', [
                            'error' => $exception->getMessage(),
                        ]);
                    }
                }
            }

            sleep(5);
        }
    }

    private function processMessage(string $topic, string $message, SensorReadingService $readingService): void
    {
        try {
            $payload = json_decode($message, true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($payload)) {
                throw new \InvalidArgumentException('Payload must be a JSON object.');
            }

            $validated = Validator::validate($payload, [
                'device_id' => ['required', 'string', 'max:100'],
                'fill_level_percentage' => ['nullable', 'numeric', 'between:0,100'],
                'distance_cm' => ['nullable', 'numeric', 'min:0'],
                'wifi_rssi_dbm' => ['nullable', 'integer', 'between:-127,0'],
                'measured_at' => ['nullable', 'date'],
                'notes' => ['nullable', 'string', 'max:1000'],
                'source' => ['sometimes', 'in:sensor,simulated'],
                'firmware_version' => ['sometimes', 'string', 'max:32'],
            ]);

            if (! isset($validated['fill_level_percentage']) && ! isset($validated['distance_cm'])) {
                throw new \InvalidArgumentException('Payload must contain fill_level_percentage or distance_cm.');
            }

            $readingService->store($validated, $validated['source'] ?? 'sensor');
            $this->line("Stored MQTT reading for {$validated['device_id']}.");
        } catch (Throwable $exception) {
            Log::warning('MQTT sensor message skipped.', [
                'topic' => $topic,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
