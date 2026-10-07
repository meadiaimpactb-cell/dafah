<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ConsultantSeeder extends Seeder
{
    public function run(): void
    {
        $consultants = [
            [
                'name'               => 'أحمد الشمري',
                'specialty'          => 'تخطيط استراتيجي',
                'rating'             => 4.8,
                'experience_years'   => 12,
                'completed_projects' => 34,
                'available'          => true,
                'bio'                => 'خبير في التخطيط الاستراتيجي للمنظمات غير الربحية مع خبرة تزيد عن 12 عاماً',
                'avatar_initial'     => 'أ',
            ],
            [
                'name'               => 'سارة العتيبي',
                'specialty'          => 'تخطيط وسياسات',
                'rating'             => 4.6,
                'experience_years'   => 8,
                'completed_projects' => 22,
                'available'          => true,
                'bio'                => 'متخصصة في بناء السياسات واللوائح وتطوير الأطر التنظيمية',
                'avatar_initial'     => 'س',
            ],
            [
                'name'               => 'خالد المالكي',
                'specialty'          => 'تخطيط تشغيلي',
                'rating'             => 4.9,
                'experience_years'   => 15,
                'completed_projects' => 45,
                'available'          => false,
                'bio'                => 'استشاري متمرس في التخطيط التشغيلي وإدارة المشاريع',
                'avatar_initial'     => 'خ',
            ],
            [
                'name'               => 'نورة القحطاني',
                'specialty'          => 'حوكمة وتطوير',
                'rating'             => 4.5,
                'experience_years'   => 10,
                'completed_projects' => 28,
                'available'          => true,
                'bio'                => 'خبيرة في الحوكمة والتطوير المؤسسي للقطاع غير الربحي',
                'avatar_initial'     => 'ن',
            ],
        ];

        foreach ($consultants as $data) {
            \App\Models\Consultant::updateOrCreate(['name' => $data['name']], $data);
        }
    }
}
