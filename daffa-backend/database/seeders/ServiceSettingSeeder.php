<?php

namespace Database\Seeders;

use App\Models\DiscountCode;
use App\Models\ServiceSetting;
use Illuminate\Database\Seeder;

class ServiceSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'strategic_base',      'label' => 'نظام التخطيط الاستراتيجي',        'value' => 5000, 'unit' => 'SAR', 'is_active' => true],
            ['key' => 'operational_base',    'label' => 'نظام التخطيط التشغيلي',           'value' => 3500, 'unit' => 'SAR', 'is_active' => true],
            ['key' => 'addon_certification', 'label' => 'اعتماد الخطة من جهة استشارية',   'value' => 2000, 'unit' => 'SAR', 'is_active' => true],
            ['key' => 'addon_design',        'label' => 'تصميم احترافي للوثائق',           'value' => 1500, 'unit' => 'SAR', 'is_active' => true],
            ['key' => 'policy_arbitration',  'label' => 'تحكيم السياسات من مستشار',        'value' => 2000, 'unit' => 'SAR', 'is_active' => true],
            ['key' => 'policy_design',       'label' => 'تصميم احترافي للوثائق (سياسات)', 'value' => 1500, 'unit' => 'SAR', 'is_active' => true],
            ['key' => 'tax_rate',            'label' => 'نسبة ضريبة القيمة المضافة',       'value' => 15,   'unit' => '%',   'is_active' => true],
        ];

        foreach ($settings as $s) {
            ServiceSetting::updateOrCreate(['key' => $s['key']], $s);
        }

        $codes = [
            ['code' => 'DAFFA10',  'type' => 'percentage', 'value' => 10, 'expires_at' => null,         'is_active' => true],
            ['code' => 'DAFFA2024','type' => 'percentage', 'value' => 20, 'expires_at' => '2024-12-31', 'is_active' => false],
            ['code' => 'LAUNCH',   'type' => 'percentage', 'value' => 15, 'expires_at' => '2024-06-30', 'is_active' => false],
        ];

        foreach ($codes as $c) {
            DiscountCode::updateOrCreate(['code' => $c['code']], $c);
        }
    }
}
