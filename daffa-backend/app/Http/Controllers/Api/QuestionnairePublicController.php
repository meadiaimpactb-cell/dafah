<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuestionnaireSection;

class QuestionnairePublicController extends Controller
{
    // GET /api/questionnaire/{policy_type_id}
    // Returns sections + questions for a given policy type (used by client questionnaire)
    public function byPolicy(int $policyTypeId)
    {
        $sections = QuestionnaireSection::with(['questions' => function ($q) {
            $q->orderBy('sort_order')->orderBy('id');
        }])
            ->where('policy_type_id', $policyTypeId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json($sections);
    }
}
