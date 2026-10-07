<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@daffa.sa'],
            [
                'org_name'  => 'منصة دفة',
                'org_type'  => 'منصة',
                'rep_name'  => 'مدير النظام',
                'phone'     => '0500000000',
                'sector'    => 'تقنية',
                'password'  => Hash::make('Admin@1234'),
                'role'      => 'admin',
                'is_active' => true,
            ]
        );
    }
}
