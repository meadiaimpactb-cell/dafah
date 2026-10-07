<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    protected $fillable = ['user_id', 'role', 'action', 'category', 'details', 'ip'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Quick static helper used throughout all controllers.
     *
     * @param int|null  $userId
     * @param string    $action   e.g. 'login', 'unit_submit'
     * @param string    $category auth | workflow | payment | review | admin | policy | consultant
     * @param string    $role     admin | consultant | client | system
     * @param string|null $details Human-readable detail string
     */
    public static function record(
        ?int $userId,
        string $action,
        string $category,
        string $role,
        ?string $details = null
    ): void {
        try {
            self::create([
                'user_id'  => $userId,
                'action'   => $action,
                'category' => $category,
                'role'     => $role,
                'details'  => $details,
                'ip'       => Request::ip(),
            ]);
        } catch (\Throwable) {
            // never let logging break the main request
        }
    }
}
