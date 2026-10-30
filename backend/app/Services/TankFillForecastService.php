<?php

namespace App\Services;

use App\Models\SepticSystem;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class TankFillForecastService
{
    /**
     * @return array<string, mixed>
     */
    public function forecast(SepticSystem $system): array
    {
        $url = rtrim((string) config('services.prediction.url'), '/');
        $apiKey = (string) config('services.prediction.api_key');

        if ($url === '' || $apiKey === '') {
            throw new RuntimeException('The prediction service is not configured.');
        }

        $now = now();
        $latestDesludging = $system->desludgings()->latest('performed_on')->first();
        $readings = $system->tankReadings()
            ->where('measured_at', '>=', $now->copy()->subDays(30));

        if ($latestDesludging !== null) {
            $readings->whereDate('measured_at', '>', $latestDesludging->performed_on);
        }

        $latestCurrentSource = (clone $readings)
            ->orderByDesc('measured_at')
            ->orderByDesc('id')
            ->value('source');
        $simulationForecast = $latestCurrentSource === 'simulated';

        $priorHistory = [];
        if ($latestDesludging !== null) {
            $serviceDate = $latestDesludging->performed_on;
            $priorReadings = $system->tankReadings()
                ->where('measured_at', '>=', Carbon::parse($serviceDate)->subDays(30)->startOfDay())
                ->whereDate('measured_at', '<', $serviceDate);
            $previousDesludging = $system->desludgings()
                ->where('performed_on', '<', $serviceDate)
                ->latest('performed_on')
                ->first();

            if ($previousDesludging !== null) {
                $priorReadings->whereDate('measured_at', '>', $previousDesludging->performed_on);
            }

            $priorSimulation = $latestCurrentSource === null
                ? (clone $priorReadings)
                    ->orderByDesc('measured_at')
                    ->orderByDesc('id')
                    ->value('source') === 'simulated'
                : $simulationForecast;
            $priorHistory = $priorReadings
                ->where('source', $priorSimulation ? '=' : '!=', 'simulated')
                ->selectRaw('DATE(measured_at) as reading_date, AVG(fill_level_percentage) as fill_percentage, COUNT(*) as readings_count, MAX(measured_at) as measured_at')
                ->groupByRaw('DATE(measured_at)')
                ->orderBy('reading_date')
                ->get()
                ->map(fn ($reading): array => [
                    'reading_date' => $reading->reading_date,
                    'measured_at' => $reading->measured_at,
                    'fill_percentage' => round((float) $reading->fill_percentage, 2),
                    'readings_count' => (int) $reading->readings_count,
                ])
                ->values()
                ->all();
        }

        $history = $readings
            ->where('source', $simulationForecast ? '=' : '!=', 'simulated')
            ->selectRaw('DATE(measured_at) as reading_date, AVG(fill_level_percentage) as fill_percentage, COUNT(*) as readings_count, MAX(measured_at) as measured_at')
            ->groupByRaw('DATE(measured_at)')
            ->orderBy('reading_date')
            ->get()
            ->map(fn ($reading): array => [
                'reading_date' => $reading->reading_date,
                'measured_at' => $reading->measured_at,
                'fill_percentage' => round((float) $reading->fill_percentage, 2),
                'readings_count' => (int) $reading->readings_count,
            ])
            ->values()
            ->all();

        $response = Http::acceptJson()
            ->withToken($apiKey)
            ->connectTimeout(min(3, (int) config('services.prediction.timeout', 5)))
            ->timeout((int) config('services.prediction.timeout', 5))
            ->post($url.'/forecast', [
                'as_of' => $now->toISOString(),
                'history' => $history,
                'prior_history' => $priorHistory,
            ])
            ->throw();

        $forecast = $response->json('data');
        if (! is_array($forecast)) {
            throw new RuntimeException('The prediction service returned an invalid response.');
        }

        $forecast['data_source'] = $simulationForecast ? 'simulated' : 'live';

        return $forecast;
    }
}
