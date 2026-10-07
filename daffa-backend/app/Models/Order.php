<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'order_number', 'service_type', 'workflow_id',
        'consultant_id', 'consultant_share',
        'subtotal', 'tax_amount', 'discount_code', 'discount_amount',
        'total', 'payment_method', 'payment_status', 'paid_at',
    ];

    public function consultant()
    {
        return $this->belongsTo(\App\Models\Consultant::class);
    }

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
