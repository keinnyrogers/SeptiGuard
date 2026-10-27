<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateHoaAdminCommand extends Command
{
    protected $signature = 'hoa-admin:create';

    protected $description = 'Create an approved HOA administrator account';

    public function handle(): int
    {
        $name = trim((string) $this->ask('Admin name'));
        $email = strtolower(trim((string) $this->ask('Admin email')));

        $validator = Validator::make(
            ['name' => $name, 'email' => $email],
            ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:255', 'unique:users,email']],
        );

        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password (minimum 12 characters)');
        if (mb_strlen($password) < 12) {
            $this->error('The password must be at least 12 characters.');

            return self::FAILURE;
        }

        if (! hash_equals($password, (string) $this->secret('Confirm password'))) {
            $this->error('The passwords do not match.');

            return self::FAILURE;
        }

        User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'hoa_admin',
            'account_status' => 'approved',
            'demo_mode' => false,
        ]);

        $this->info('HOA administrator created.');

        return self::SUCCESS;
    }
}
