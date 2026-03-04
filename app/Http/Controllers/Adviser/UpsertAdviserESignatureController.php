<?php

namespace App\Http\Controllers\Adviser;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adviser\UpsertAdviserESignatureRequest;
use App\Models\ESignature;
use Illuminate\Http\RedirectResponse;

class UpsertAdviserESignatureController extends Controller
{
    public function __invoke(UpsertAdviserESignatureRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            return back()->withErrors([
                'signature_data' => 'Unable to save e-signature for unauthenticated user.',
            ]);
        }

        $validated = $request->validated();

        ESignature::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'signature_data' => $validated['signature_data'],
                'mime_type' => $validated['mime_type'],
            ],
        );

        return back()->with('success', 'E-signature saved successfully.');
    }
}
