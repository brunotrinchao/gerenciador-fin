<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Invite;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function index()
    {
        $adminId = auth()->user()->owner_id;

        return Inertia::render('Settings/Members/Index', [
            'members' => User::where('admin_id', $adminId)->with('role')->get(),
            'invites' => Invite::where('admin_id', $adminId)->with('role')->get(),
            'roles' => Role::where('admin_id', $adminId)->get(),
        ]);
    }

    public function storeInvite(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'role_id' => 'required|exists:roles,id'
        ]);

        Invite::updateOrCreate(
            ['email' => $validated['email']],
            [
                'admin_id' => auth()->user()->owner_id,
                'role_id' => $validated['role_id'],
                'token' => Str::random(32),
                'status' => 'pending'
            ]
        );

        return back()->with('success', 'Convite criado com sucesso! Peça ao usuário para logar com '. $validated['email']);
    }
}
