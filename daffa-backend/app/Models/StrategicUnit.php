<?php

namespace App\Models;

use App\Support\StrategicContent;
use Illuminate\Database\Eloquent\Model;

class StrategicUnit extends Model
{
    protected $fillable = [
        'unit_number', 'name', 'template_type', 'video_duration',
        'overview', 'overview2', 'table_headers', 'table_rows',
        'topics', 'steps', 'tip',
        'written_description', 'tips', 'video_url', 'content',
    ];

    protected $casts = [
        'table_headers' => 'array',
        'table_rows'    => 'array',
        'topics'        => 'array',
        'steps'         => 'array',
        'tips'          => 'array',
        'content'       => 'array',
    ];

    // روابط ملفات PDF المرفوعة من لوحة التحكم (null = الملف المعتمد الافتراضي في الواجهة)
    protected $appends = ['pdf_urls'];

    public function getPdfUrlsAttribute(): array
    {
        return StrategicContent::pdfUrls($this->content);
    }
}
