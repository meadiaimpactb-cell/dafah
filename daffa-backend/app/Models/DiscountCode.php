<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscountCode extends Model
{
    protected $fillable = ['code', 'type', 'value', 'expires_at', 'is_active', 'max_uses', 'used_count'];

    protected $casts = [
        'value'      => 'decimal:2',
        'is_active'  => 'boolean',
        'expires_at' => 'date',
    ];

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;
        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) return false;
        return true;
    }

    public function calcDiscount(float $subtotal): float
    {
        return $this->type === 'percentage'
            ? round($subtotal * ($this->value / 100), 2)
            : min((float) $this->value, $subtotal);
    }
}
