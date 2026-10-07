<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StrategicController;
use App\Http\Controllers\Api\OperationalController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Admin\ConsultantController as AdminConsultantController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\OrganizationController as AdminOrganizationController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\Admin\ContentController as AdminContentController;
use App\Http\Controllers\Api\Admin\ActivityLogController as AdminActivityLogController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\FinanceController as AdminFinanceController;
use App\Http\Controllers\Api\Admin\ReportsController as AdminReportsController;
use App\Http\Controllers\Api\Admin\QuestionnaireController as AdminQuestionnaireController;
use App\Http\Controllers\Api\Admin\SiteContentController as AdminSiteContentController;
use App\Http\Controllers\Api\Admin\PolicyDesignController as AdminPolicyDesignController;
use App\Http\Controllers\Api\QuestionnairePublicController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Api\Consultant\PortalController as ConsultantPortalController;
use Illuminate\Support\Facades\Route;

// ── Public endpoints (no auth) ────────────────────────────────────────────────
Route::get('/site-content',        [AdminSiteContentController::class, 'publicIndex']);
Route::get('/public/policy-types', [AdminContentController::class,     'policyTypes']);
Route::get('/faqs',                [FaqController::class,              'index']);
Route::post('/auth/forgot-password', [PasswordResetController::class, 'sendLink']);
Route::post('/auth/reset-password',  [PasswordResetController::class, 'reset']);

// ── Auth (public) ─────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register',     [AuthController::class, 'register']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-otp',   [AuthController::class, 'resendOtp']);
    Route::post('/login',        [AuthController::class, 'login']);
    Route::post('/google',       [AuthController::class, 'googleLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',           [AuthController::class, 'logout']);
        Route::get('/me',                [AuthController::class, 'me']);
        Route::put('/profile',           [AuthController::class, 'updateProfile']);
        Route::put('/password',          [AuthController::class, 'changePassword']);
        Route::post('/profile/avatar',   [AuthController::class, 'uploadAvatar']);
    });
});

// ── Strategic Planning (protected) ───────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('strategic')->group(function () {
    Route::get('/workflows',                 [StrategicController::class, 'listWorkflows']);
    Route::get('/consultants',               [StrategicController::class, 'consultants']);
    Route::get('/workflow',                  [StrategicController::class, 'getWorkflow']);
    Route::get('/page-data',                 [StrategicController::class, 'pageData']);
    Route::get('/workflow/progress',         [StrategicController::class, 'progress']);
    Route::get('/workflow/pdf',              [StrategicController::class, 'downloadPDF']);
    Route::get('/workflow/pdf-link',         [StrategicController::class, 'getPdfLink']);
    Route::post('/workflow/start',           [StrategicController::class, 'start']);
    Route::post('/workflow/consultant',      [StrategicController::class, 'selectConsultant']);
    Route::post('/workflow/pay',             [StrategicController::class, 'pay']);
    Route::get('/units',                     [StrategicController::class, 'units']);
    Route::get('/units/{unitNumber}',        [StrategicController::class, 'unit']);
    Route::post('/units/{unitNumber}/save',  [StrategicController::class, 'saveUnit']);
    Route::post('/units/{unitNumber}/submit',[StrategicController::class, 'submitUnit']);
});

// ── Consultant Portal (protected) ────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:consultant'])->prefix('consultant')->group(function () {
    Route::get('/me',                          [ConsultantPortalController::class, 'me']);
    Route::get('/dashboard',                   [ConsultantPortalController::class, 'dashboard']);
    Route::get('/stats',                       [ConsultantPortalController::class, 'stats']);
    Route::get('/earnings',                    [ConsultantPortalController::class, 'earnings']);
    Route::get('/clients',                     [ConsultantPortalController::class, 'clients']);
    Route::get('/reviews/pending',             [ConsultantPortalController::class, 'pendingReviews']);
    Route::get('/reviews/completed',           [ConsultantPortalController::class, 'completedReviews']);
    Route::get('/submissions/{id}',            [ConsultantPortalController::class, 'submission']);
    Route::post('/submissions/{id}/approve',   [ConsultantPortalController::class, 'approve']);
    Route::post('/submissions/{id}/revision',  [ConsultantPortalController::class, 'requestRevision']);

    // Operational reviews
    Route::get('/operational/reviews/pending',             [ConsultantPortalController::class, 'opPendingReviews']);
    Route::get('/operational/reviews/completed',           [ConsultantPortalController::class, 'opCompletedReviews']);
    Route::get('/operational/submissions/{id}',            [ConsultantPortalController::class, 'opSubmission']);
    Route::post('/operational/submissions/{id}/approve',   [ConsultantPortalController::class, 'opApprove']);
    Route::post('/operational/submissions/{id}/revision',  [ConsultantPortalController::class, 'opRequestRevision']);

    // Policy reviews
    Route::get('/policies/reviews/pending',                [ConsultantPortalController::class, 'polPendingReviews']);
    Route::get('/policies/reviews/completed',              [ConsultantPortalController::class, 'polCompletedReviews']);
    Route::get('/policies/selections/{id}',                [ConsultantPortalController::class, 'polSelection']);
    Route::post('/policies/selections/{id}/approve',       [ConsultantPortalController::class, 'polApprove']);
    Route::post('/policies/selections/{id}/revision',      [ConsultantPortalController::class, 'polRequestRevision']);

    // Policy design service
    Route::get('/policies/designs',                        [ConsultantPortalController::class, 'designRequests']);
    Route::post('/policies/designs/{id}/upload',           [ConsultantPortalController::class, 'uploadDesign']);
});

// ── Operational Planning (protected) ─────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('operational')->group(function () {
    Route::get('/workflows',                     [OperationalController::class, 'listWorkflows']);
    Route::get('/workflow',                      [OperationalController::class, 'getWorkflow']);
    Route::get('/page-data',                     [OperationalController::class, 'pageData']);
    Route::get('/consultants',                   [OperationalController::class, 'consultants']);
    Route::get('/workflow/progress',             [OperationalController::class, 'progress']);
    Route::get('/workflow/pdf-link',             [OperationalController::class, 'getPdfLink']);
    Route::get('/workflow/pdf',                  [OperationalController::class, 'downloadPDF']);
    Route::get('/strategic-initiatives',         [OperationalController::class, 'strategicInitiatives']);
    Route::post('/workflow/start',               [OperationalController::class, 'start']);
    Route::post('/workflow/consultant',          [OperationalController::class, 'selectConsultant']);
    Route::post('/workflow/pay',                 [OperationalController::class, 'pay']);
    Route::post('/workflow/arbitration',         [OperationalController::class, 'arbitration']);
    Route::get('/units',                         [OperationalController::class, 'units']);
    Route::get('/units/{unitNumber}',            [OperationalController::class, 'unit']);
    Route::post('/units/{unitNumber}/save',      [OperationalController::class, 'saveUnit']);
    Route::post('/units/{unitNumber}/submit',    [OperationalController::class, 'submitUnit']);
});

// ── Policies & Regulations (protected) ───────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('policies')->group(function () {
    Route::get('/workflows',                           [PolicyController::class, 'index']);
    Route::get('/page-data',                          [PolicyController::class, 'pageData']);
    Route::get('/policy-types',                       fn() => response()->json(PolicyController::policyTypes()));
    Route::post('/workflow/start',                    [PolicyController::class, 'start']);
    Route::post('/workflow/select-policies',          [PolicyController::class, 'selectPolicies']);
    Route::post('/workflow/pay',                      [PolicyController::class, 'pay']);
    Route::post('/workflow/design',                   [PolicyController::class, 'requestDesign']);
    Route::post('/design/approve',                    [PolicyController::class, 'approveDesign']);
    Route::post('/design/revision',                   [PolicyController::class, 'requestDesignRevision']);
    Route::get('/selections',                         [PolicyController::class, 'selections']);
    Route::get('/selections/{id}',                    [PolicyController::class, 'selection']);
    Route::post('/selections/{id}/save',              [PolicyController::class, 'saveSelection']);
    Route::post('/selections/{id}/submit',            [PolicyController::class, 'submitSelection']);
    Route::get('/workflow/pdf/{selectionId}',         [PolicyController::class, 'downloadPDF']);
    Route::get('/workflow/pdf-link/{selectionId}',    [PolicyController::class, 'getPdfLink']);
});

// ── Chat (protected) ─────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('chat')->group(function () {
    Route::get('/conversations',                    [ChatController::class, 'conversations']);
    Route::post('/conversations/start',             [ChatController::class, 'start']);
    Route::get('/conversations/{id}/messages',      [ChatController::class, 'messages']);
    Route::post('/conversations/{id}/messages',     [ChatController::class, 'send']);
    Route::get('/unread',                           [ChatController::class, 'unread']);
});

// ── Reviews (protected) ──────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('reviews')->group(function () {
    Route::post('/',      [ReviewController::class, 'store']);
    Route::get('/mine',   [ReviewController::class, 'mine']);
});

// ── Client Orders (protected) ─────────────────────────────────────────────────
Route::middleware('auth:sanctum')->get('/orders', [OrderController::class, 'myOrders']);
Route::middleware('auth:sanctum')->get('/orders/{id}/invoice-link', [OrderController::class, 'getInvoiceLink']);
Route::middleware('auth:sanctum')->get('/questionnaire/{policyTypeId}', [QuestionnairePublicController::class, 'byPolicy']);

// ── Notifications (protected) ─────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/',            [NotificationController::class, 'index']);
    Route::get('/unread-count',[NotificationController::class, 'unreadCount']);
    Route::post('/read-all',   [NotificationController::class, 'markAllRead']);
    Route::post('/{id}/read',  [NotificationController::class, 'markRead']);
});

// ── Admin (protected) ─────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/consultants',                      [AdminConsultantController::class, 'index']);
    Route::post('/consultants',                     [AdminConsultantController::class, 'store']);
    Route::get('/consultants/{consultant}',         [AdminConsultantController::class, 'show']);
    Route::put('/consultants/{consultant}',         [AdminConsultantController::class, 'update']);
    Route::delete('/consultants/{consultant}',      [AdminConsultantController::class, 'destroy']);
    Route::post('/consultants/{consultant}/toggle', [AdminConsultantController::class, 'toggle']);
    Route::post('/consultants/{consultant}/avatar', [AdminConsultantController::class, 'uploadAvatar']);

    // Users
    Route::get('/users',              [AdminUserController::class, 'index']);
    Route::post('/users',             [AdminUserController::class, 'store']);
    Route::put('/users/{id}',         [AdminUserController::class, 'update']);
    Route::post('/users/{id}/toggle', [AdminUserController::class, 'toggle']);
    Route::post('/users/{id}/avatar',       [AdminUserController::class, 'uploadAvatar']);
    Route::put('/users/{id}/permissions',   [AdminUserController::class, 'updatePermissions']);
    Route::delete('/users/{id}',      [AdminUserController::class, 'destroy']);

    // Organizations
    Route::get('/organizations',              [AdminOrganizationController::class, 'index']);
    Route::post('/organizations',             [AdminOrganizationController::class, 'store']);
    Route::get('/organizations/{id}',         [AdminOrganizationController::class, 'show']);
    Route::put('/organizations/{id}',         [AdminOrganizationController::class, 'update']);
    Route::post('/organizations/{id}/toggle', [AdminOrganizationController::class, 'toggle']);
    Route::delete('/organizations/{id}',      [AdminOrganizationController::class, 'destroy']);
    Route::post('/organizations/{id}/logo',   [AdminOrganizationController::class, 'uploadLogo']);

    // Services & Pricing
    Route::get('/services/settings',                      [AdminServiceController::class, 'indexSettings']);
    Route::put('/services/settings/{key}',                [AdminServiceController::class, 'updateSetting']);
    Route::get('/services/discounts',                     [AdminServiceController::class, 'indexDiscounts']);
    Route::post('/services/discounts',                    [AdminServiceController::class, 'storeDiscount']);
    Route::put('/services/discounts/{id}',                [AdminServiceController::class, 'updateDiscount']);
    Route::post('/services/discounts/{id}/toggle',        [AdminServiceController::class, 'toggleDiscount']);
    Route::delete('/services/discounts/{id}',             [AdminServiceController::class, 'destroyDiscount']);

    // Content Management
    Route::get('/content/strategic',              [AdminContentController::class, 'strategicUnits']);
    Route::put('/content/strategic/{id}',         [AdminContentController::class, 'updateStrategic']);
    Route::get('/content/operational',            [AdminContentController::class, 'operationalUnits']);
    Route::put('/content/operational/{id}',       [AdminContentController::class, 'updateOperational']);
    Route::get('/content/policies',               [AdminContentController::class, 'policyTypes']);
    Route::put('/content/policies/{typeId}',      [AdminContentController::class, 'updatePolicy']);

    // Notifications Management
    Route::post('/notifications/send',            [NotificationController::class, 'adminSend']);
    Route::get('/notifications/log',              [NotificationController::class, 'adminLog']);
    Route::get('/notifications/users',            [NotificationController::class, 'adminUsers']);

    // Dashboard
    Route::get('/dashboard',                      [AdminDashboardController::class, 'index']);

    // Finance
    Route::get('/finance',                        [AdminFinanceController::class, 'index']);

    // Reports
    Route::get('/reports',                        [AdminReportsController::class, 'index']);

    // Activity Log
    Route::get('/activity-log',                   [AdminActivityLogController::class, 'index']);

    // Site Content Management
    Route::get('/site-content',              [AdminSiteContentController::class, 'adminIndex']);
    Route::put('/site-content/{key}',        [AdminSiteContentController::class, 'update']);
    Route::post('/site-content/bulk',        [AdminSiteContentController::class, 'bulk']);

    // Policy Design Management (Admin handles instead of consultant)
    Route::get('/policies/designs',                    [AdminPolicyDesignController::class, 'index']);
    Route::post('/policies/designs/{id}/upload',       [AdminPolicyDesignController::class, 'upload']);

    // FAQ Management
    Route::get('/faqs',              [AdminFaqController::class, 'index']);
    Route::post('/faqs',             [AdminFaqController::class, 'store']);
    Route::put('/faqs/{id}',         [AdminFaqController::class, 'update']);
    Route::post('/faqs/{id}/toggle', [AdminFaqController::class, 'toggle']);
    Route::delete('/faqs/{id}',      [AdminFaqController::class, 'destroy']);

    // Questionnaire Builder
    Route::get('/questionnaire',                                      [AdminQuestionnaireController::class, 'index']);
    Route::post('/questionnaire/sections',                            [AdminQuestionnaireController::class, 'storeSection']);
    Route::post('/questionnaire/sections/reorder',                    [AdminQuestionnaireController::class, 'reorderSections']);
    Route::put('/questionnaire/sections/{id}',                        [AdminQuestionnaireController::class, 'updateSection']);
    Route::delete('/questionnaire/sections/{id}',                     [AdminQuestionnaireController::class, 'destroySection']);
    Route::get('/questionnaire/sections/{id}/questions',              [AdminQuestionnaireController::class, 'sectionQuestions']);
    Route::post('/questionnaire/sections/{id}/questions',             [AdminQuestionnaireController::class, 'storeQuestion']);
    Route::post('/questionnaire/questions/reorder',                   [AdminQuestionnaireController::class, 'reorderQuestions']);
    Route::put('/questionnaire/questions/{id}',                       [AdminQuestionnaireController::class, 'updateQuestion']);
    Route::delete('/questionnaire/questions/{id}',                    [AdminQuestionnaireController::class, 'destroyQuestion']);
});
