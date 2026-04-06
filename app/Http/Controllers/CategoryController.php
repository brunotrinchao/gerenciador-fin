<?php

namespace App\Http\Controllers;

use App\Enums\CategoryType;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->where(function ($query) {
                $query->where('user_id', Auth::id())
                      ->orWhere('is_default', true); // Se as categorias default não tem user_id, pegamos as que são default e as do usuário.
            })
            ->with('parent')
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/Categories/Index', [
            'categories' => $categories,
            'root_categories' => $categories->whereNull('parent_id')->values(), // para o select do form
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();
        $data['is_default'] = false; // Usuários não criam categorias default.

        Category::create($data);

        return redirect()->route('categories.index')
                         ->with('success', 'Categoria criada com sucesso.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        // Validação autorizou a request. (is_default é falso e user_id pertence ao usuário auth)
        $category->update($request->validated());

        return redirect()->route('categories.index')
                         ->with('success', 'Categoria atualizada com sucesso.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->user_id !== Auth::id() || $category->is_default) {
            abort(403, 'Você não pode excluir uma categoria padrão.');
        }

        // Antes de deletar, precisaria verificar se existem transações.
        if ($category->transactions()->exists()) {
            return redirect()->route('categories.index')
                             ->with('error', 'Não é possível excluir categorias que possuem transações vinculadas.');
        }

        if ($category->children()->exists()) {
            return redirect()->route('categories.index')
                             ->with('error', 'Não é possível excluir categorias que possuem subcategorias.');
        }

        $category->delete();

        return redirect()->route('categories.index')
                         ->with('success', 'Categoria excluída com sucesso.');
    }
}
