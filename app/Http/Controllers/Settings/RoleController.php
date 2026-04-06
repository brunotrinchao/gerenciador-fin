<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Roles/Index', [
            'roles' => Role::where('admin_id', auth()->user()->owner_id)->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);

        Role::create([
            'admin_id' => auth()->user()->owner_id,
            'name' => $validated['name'],
            'description' => $validated['description'],
            'permissions' => $validated['permissions'] ?? [],
        ]);

        return back()->with('success', 'Perfil criado com sucesso!');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'permissions' => ['nullable', 'array'],
        ]);

        $role->update([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? $role->description,
            'permissions' => $validated['permissions'] ?? [],
        ]);

        return back()->with('success', 'Perfil atualizado com sucesso!');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->users()->exists()) {
            return back()->with('error', 'Não é possível excluir — existem membros com este perfil.');
        }

        $role->delete();

        return back()->with('success', 'Perfil excluído com sucesso!');
    }
}
