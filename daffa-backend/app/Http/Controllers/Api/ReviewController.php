<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsultantReview;
use App\Models\Consultant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    // POST /api/reviews
    public function store(Request $request)
    {
        $request->validate([
            'consultant_id' => 'required|integer|exists:consultants,id',
            'workflow_type' => 'required|in:strategic,operational,policy',
            'workflow_id'   => 'required|integer',
            'rating'        => 'required|integer|min:1|max:5',
            'comment'       => 'nullable|string|max:500',
        ]);

        $review = ConsultantReview::updateOrCreate(
            [
                'user_id'       => Auth::id(),
                'workflow_type' => $request->workflow_type,
                'workflow_id'   => $request->workflow_id,
            ],
            [
                'consultant_id' => $request->consultant_id,
                'rating'        => $request->rating,
                'comment'       => $request->comment,
            ]
        );

        // Recalculate and persist the consultant's average rating
        $avg = ConsultantReview::where('consultant_id', $request->consultant_id)->avg('rating');
        Consultant::where('id', $request->consultant_id)->update(['rating' => round($avg, 1)]);

        return response()->json($review, 201);
    }

    // GET /api/reviews/mine?workflow_type=X&workflow_id=Y
    public function mine(Request $request)
    {
        $review = ConsultantReview::where('user_id', Auth::id())
            ->where('workflow_type', $request->workflow_type)
            ->where('workflow_id', $request->workflow_id)
            ->first();

        return response()->json($review);
    }
}
