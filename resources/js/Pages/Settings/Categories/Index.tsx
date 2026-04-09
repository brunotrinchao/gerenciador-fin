import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormEvent, useState } from 'react';
import { CATEGORY_ICONS, ICON_NAMES } from '@/lib/categoryIcons';
import { CategoryIcon } from '@/Components/CategoryIcon';
import { ConfirmDeleteDialog } from '@/Components/ConfirmDeleteDialog';

type CategoryType = 'income' | 'expense';

interface Category {
    id: number;
    name: string;
    type: CategoryType;
    icon: string | null;
    color: string | null;
    parent_id: number | null;
    is_default: boolean;
    parent?: Category;
}

interface CategoriesIndexProps {
    categories: Category[];
    root_categories: Category[];
}

export default function CategoriesIndex({ categories, root_categories }: CategoriesIndexProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        type: 'expense' as CategoryType,
        icon: '',
        color: '',
        parent_id: '' as number | string,
    });
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post(route('categories.store'), {
            onSuccess: () => {
                reset();
            }
        });
    };

    const handleDelete = () => {
        if (!deletingCategory) return;
        setProcessingDelete(true);
        router.delete(route('categories.destroy', deletingCategory.id), {
            onFinish: () => {
                setProcessingDelete(false);
                setDeletingCategory(null);
            },
        });
    };

    return (
        <AppLayout title="Categorias">
            <div className="text-white flex flex-col gap-6">
                <Head title="Gerenciar Categorias" />
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold font-display">Categorias</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formulário de Nova Categoria */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl lg:col-span-1 h-fit">
                        <h2 className="text-lg font-semibold mb-4">Nova Categoria</h2>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value as CategoryType)}
                                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-3 py-2 text-white"
                                >
                                    <option value="expense">Despesa</option>
                                    <option value="income">Receita</option>
                                </select>
                                {errors.type && <span className="text-red-500 text-xs">{errors.type}</span>}
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-3 py-2 text-white"
                                    placeholder="Ex: Alimentação, Salário..."
                                    required
                                />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Categoria Principal (Opcional)</label>
                                <select
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-3 py-2 text-white"
                                >
                                    <option value="">Nenhuma (Categoria Raiz)</option>
                                    {root_categories.filter(c => c.type === data.type).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.parent_id && <span className="text-red-500 text-xs">{errors.parent_id}</span>}
                            </div>

                            {/* Cor */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Cor</label>
                                <input
                                    type="color"
                                    value={data.color || '#10b981'}
                                    onChange={e => setData('color', e.target.value)}
                                    className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-1 py-1 cursor-pointer"
                                />
                            </div>

                            {/* Seletor visual de ícone */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Ícone</label>
                                {data.icon && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: (data.color || '#10b981') + '33' }}
                                        >
                                            <CategoryIcon icon={data.icon} size={16} className="text-white" />
                                        </div>
                                        <span className="text-xs text-gray-400">{data.icon}</span>
                                        <button
                                            type="button"
                                            onClick={() => setData('icon', '')}
                                            className="text-xs text-red-400 hover:text-red-300"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                )}
                                <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto p-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg">
                                    {ICON_NAMES.map((name) => {
                                        const Icon = CATEGORY_ICONS[name];
                                        const isSelected = data.icon === name;
                                        return (
                                            <button
                                                key={name}
                                                type="button"
                                                title={name}
                                                onClick={() => setData('icon', name)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                                                        : 'text-gray-400 hover:text-white hover:bg-[var(--color-border)]'
                                                }`}
                                            >
                                                <Icon size={16} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-6 bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2 rounded-xl transition"
                            >
                                {processing ? 'Salvando...' : 'Adicionar Categoria'}
                            </button>
                        </form>
                    </div>

                    {/* Listagem */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Receitas */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl">
                            <h2 className="text-lg font-semibold mb-4 text-[#10b981]">Receitas</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {categories.filter(c => c.type === 'income').map(category => (
                                    <div key={category.id} className="flex justify-between items-center bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center opacity-80"
                                                style={{ backgroundColor: category.color || '#10b981' }}
                                            >
                                                {category.icon ? (
                                                    <CategoryIcon icon={category.icon} size={16} className="text-white" />
                                                ) : (
                                                    <span className="text-white text-xs font-bold">{category.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm flex items-center gap-2">
                                                    {category.name}
                                                    {category.is_default && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Padrão</span>}
                                                </div>
                                                {category.parent && <div className="text-xs text-gray-500">Filha de {category.parent.name}</div>}
                                            </div>
                                        </div>
                                        {!category.is_default && (
                                            <button
                                                onClick={() => setDeletingCategory(category)}
                                                className="text-gray-500 hover:text-red-500 transition px-2"
                                            >
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {categories.filter(c => c.type === 'income').length === 0 && (
                                    <p className="text-gray-500 text-sm">Nenhuma categoria de receita encontrada.</p>
                                )}
                            </div>
                        </div>

                        {/* Despesas */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl">
                            <h2 className="text-lg font-semibold mb-4 text-red-500">Despesas</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {categories.filter(c => c.type === 'expense').map(category => (
                                    <div key={category.id} className="flex justify-between items-center bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center opacity-80"
                                                style={{ backgroundColor: category.color || '#ef4444' }}
                                            >
                                                {category.icon ? (
                                                    <CategoryIcon icon={category.icon} size={16} className="text-white" />
                                                ) : (
                                                    <span className="text-white text-xs font-bold">{category.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm flex items-center gap-2">
                                                    {category.name}
                                                    {category.is_default && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Padrão</span>}
                                                </div>
                                                {category.parent && <div className="text-xs text-gray-500">Filha de {category.parent.name}</div>}
                                            </div>
                                        </div>
                                        {!category.is_default && (
                                            <button
                                                onClick={() => setDeletingCategory(category)}
                                                className="text-gray-500 hover:text-red-500 transition px-2"
                                            >
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {categories.filter(c => c.type === 'expense').length === 0 && (
                                    <p className="text-gray-500 text-sm">Nenhuma categoria de despesa encontrada.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDeleteDialog
                open={!!deletingCategory}
                title="Excluir categoria"
                description={`Tem certeza que deseja excluir a categoria "${deletingCategory?.name}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                loading={processingDelete}
                onConfirm={handleDelete}
                onCancel={() => setDeletingCategory(null)}
            />
        </AppLayout>
    );
}
