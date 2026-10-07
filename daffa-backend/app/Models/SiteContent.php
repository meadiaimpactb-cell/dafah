<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    protected $fillable = ['key', 'group', 'label', 'value', 'type'];

    public static function val(string $key, string $default = ''): string
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function map(): array
    {
        return static::pluck('value', 'key')->toArray();
    }
}
