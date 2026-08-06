<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Razorpay\Api\Api;
use App\Models\Course;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    private $api;

    public function __construct()
    {
        $keyId = env('RAZORPAY_KEY', 'rzp_test_placeholder');
        $keySecret = env('RAZORPAY_SECRET', 'rzp_secret_placeholder');
        
        $this->api = new Api($keyId, $keySecret);
    }

    /**
     * Create a Razorpay Order
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id'
        ]);

        $course = Course::findOrFail($request->course_id);
        
        $price = $course->price ?? 500; 

        try {
            // MOCK PAYMENT FLOW FOR TESTING
            // Directly insert a successful purchase without calling Razorpay
            $purchase = DB::table('user_purchases')->insertGetId([
                'user_id' => auth()->id(),
                'course_id' => $course->id,
                'amount' => $price,
                'transaction_id' => 'mock_txn_' . time(),
                'payment_gateway' => 'mock_test',
                'status' => 'successful',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mock payment successful! Course unlocked.',
                'purchase_id' => $purchase
            ]);

        } catch (\Exception $e) {
            Log::error('Mock Order Creation Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to initiate mock payment.'], 500);
        }
    }

    /**
     * Verify the Razorpay Payment Signature
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string'
        ]);

        try {
            $attributes = [
                'razorpay_order_id' => $request->razorpay_order_id,
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'razorpay_signature' => $request->razorpay_signature
            ];

            $this->api->utility->verifyPaymentSignature($attributes);

            // If verification successful, update the purchase status
            DB::table('user_purchases')
                ->where('transaction_id', $request->razorpay_order_id)
                ->update([
                    'status' => 'successful',
                    'updated_at' => now()
                ]);

            return response()->json(['message' => 'Payment successful', 'success' => true]);

        } catch (\Exception $e) {
            Log::error('Razorpay Signature Verification Failed: ' . $e->getMessage());
            
            DB::table('user_purchases')
                ->where('transaction_id', $request->razorpay_order_id)
                ->update([
                    'status' => 'failed',
                    'updated_at' => now()
                ]);

            return response()->json(['message' => 'Payment verification failed.', 'success' => false], 400);
        }
    }
}
