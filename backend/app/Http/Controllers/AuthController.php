<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user under a specific tenant.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'login' => 'required|string|max:255', // email or username
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|string|in:tenant_admin,property_manager,student',
            'tenant_code' => 'nullable|string|exists:tenants,tenant_code',
        ]);

        $tenant = null;
        if (!empty($validated['tenant_code'])) {
            $tenant = Tenant::where('tenant_code', $validated['tenant_code'])->first();
        } else {
            // Automatically resolve tenant based on logged-in user or first active tenant
            $currentUser = $request->user();
            if ($currentUser && $currentUser->tenant_id) {
                $tenant = Tenant::find($currentUser->tenant_id);
            } else {
                $tenant = Tenant::where('is_active', true)->first();
            }
        }

        if (!$tenant) {
            throw ValidationException::withMessages([
                'tenant_code' => ['A valid tenant could not be resolved. Please seed or create a tenant first.'],
            ]);
        }

        $isEmail = filter_var($validated['login'], FILTER_VALIDATE_EMAIL);
        $email = $isEmail ? $validated['login'] : null;
        $username = !$isEmail ? $validated['login'] : null;

        // Double check uniqueness within the tenant
        $existsQuery = User::where('tenant_id', $tenant->id);
        if ($isEmail) {
            $existsQuery->where('email', $email);
        } else {
            $existsQuery->where('username', $username);
        }

        if ($existsQuery->exists()) {
            throw ValidationException::withMessages([
                'login' => ['This user identifier is already registered under this tenant.'],
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'username' => $username,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'tenant_id' => $tenant->id,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'tenant_code' => $tenant->tenant_code,
        ], 201);
    }

    /**
     * Authenticate a user (email/username + password + optional tenant_code).
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'login' => 'required|string', // username or email
            'password' => 'required|string',
            'tenant_code' => 'nullable|string',
        ]);

        $isEmail = filter_var($validated['login'], FILTER_VALIDATE_EMAIL);
        $field = $isEmail ? 'email' : 'username';

        // Find user globally by email or username
        $user = User::where($field, $validated['login'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials.'],
            ]);
        }

        // If user is tenant-scoped, check if tenant is active
        if ($user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);
            if (!$tenant || !$tenant->is_active) {
                throw ValidationException::withMessages([
                    'login' => ['Specified school/tenant is invalid or inactive.'],
                ]);
            }
        }

        // If user is a property manager, verify they are associated with an active property
        if ($user->role === 'property_manager') {
            $propertyExists = \App\Models\Property::where('tenant_id', $user->tenant_id)
                ->where('property_code', $user->username)
                ->where('is_active', true)
                ->exists();
            if (!$propertyExists) {
                throw ValidationException::withMessages([
                    'login' => ['This coordinator is not associated with any active property code.'],
                ]);
            }
        }

        // Verify password
        if (!Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'tenant_code' => $user->tenant ? $user->tenant->tenant_code : null,
        ]);
    }

    /**
     * Terminate user session.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Retrieve current user profile.
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->load('tenant'));
    }

    /**
     * Batch import student accounts from a CSV file.
     */
    public function batchImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        $filePath = $file->getRealPath();

        $fileHandle = fopen($filePath, 'r');
        $header = fgetcsv($fileHandle);

        if (!$header) {
            return response()->json(['error' => 'The uploaded file is empty.'], 422);
        }

        // Clean headers (remove spaces and BOM)
        $header = array_map(function($h) {
            return strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h)));
        }, $header);

        $nameIdx = array_search('name', $header);
        $usernameIdx = array_search('username', $header);
        $passwordIdx = array_search('password', $header);

        if ($nameIdx === false) {
            fclose($fileHandle);
            return response()->json(['error' => 'CSV file must contain a "name" column.'], 422);
        }

        $activeTenant = app('active_tenant');
        $importedUsers = [];
        $errors = [];
        $rowNumber = 1;

        while (($row = fgetcsv($fileHandle)) !== false) {
            $rowNumber++;

            if (empty($row) || count($row) < 1 || empty(trim($row[$nameIdx]))) {
                continue;
            }

            $name = trim($row[$nameIdx]);

            // Read or generate username
            $username = null;
            if ($usernameIdx !== false && !empty(trim($row[$usernameIdx]))) {
                $username = trim($row[$usernameIdx]);
            } else {
                $counter = User::where('tenant_id', $activeTenant->id)->count() + count($importedUsers) + 1;
                $username = strtolower($activeTenant->tenant_code) . '_std_' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            }

            // Read or generate password
            $rawPassword = null;
            if ($passwordIdx !== false && !empty(trim($row[$passwordIdx]))) {
                $rawPassword = trim($row[$passwordIdx]);
            } else {
                $rawPassword = bin2hex(random_bytes(3)); // 6 random characters
            }

            // Verify unique username across DB
            if (User::where('username', $username)->exists()) {
                $errors[] = "Row {$rowNumber}: Username '{$username}' is already taken.";
                continue;
            }

            // Create Student
            $user = User::create([
                'name' => $name,
                'username' => $username,
                'email' => null,
                'password' => Hash::make($rawPassword),
                'role' => 'student',
                'tenant_id' => $activeTenant->id,
            ]);

            $importedUsers[] = [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'password' => $rawPassword,
            ];
        }

        fclose($fileHandle);

        return response()->json([
            'imported' => $importedUsers,
            'errors' => $errors,
        ]);
    }

    /**
     * Get list of students belonging to the active tenant.
     */
    public function getStudents()
    {
        return response()->json(User::where('role', 'student')->orderBy('name', 'asc')->get());
    }
}
