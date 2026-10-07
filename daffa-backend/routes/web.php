<?php

use App\Http\Controllers\Api\StrategicController;
use App\Http\Controllers\Api\OperationalController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// PDF download via signed URL (no session/token required — signature IS the auth)
Route::get('/pdf/strategic', [StrategicController::class, 'downloadPDFSigned'])
    ->name('pdf.strategic');

Route::get('/pdf/operational', [OperationalController::class, 'downloadPDFSigned'])
    ->name('pdf.operational');

Route::get('/pdf/policy', [PolicyController::class, 'downloadPDFSigned'])
    ->name('pdf.policy');

Route::get('/pdf/invoice', [OrderController::class, 'showInvoice'])
    ->name('pdf.invoice');
