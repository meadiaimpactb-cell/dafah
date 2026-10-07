<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceSetting extends Model
{
    protected $fillable = ['key', 'label', 'value', 'unit', 'is_active'];

    protected $casts = [
        'value'     => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public static function val(string $key, float $default = 0): float
    {
        return (float) (static::where('key', $key)->value('value') ?? $default);
    }

    public static function map(): array
    {
        return static::pluck('value', 'key')->toArray();
    }
}
