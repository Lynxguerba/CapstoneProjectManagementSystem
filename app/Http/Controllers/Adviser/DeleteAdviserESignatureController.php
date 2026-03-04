<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class DeleteAdviserESignatureController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        $user = auth()->user();

        if ($user === null) {
            return back()->withErrors([
                'signature_data' => 'Unable to remove e-signature for unauthenticated user.',
            ]);
        }

        $user->eSignature()->delete();

        return back()->with('success', 'E-signature removed successfully.');
    }
}
