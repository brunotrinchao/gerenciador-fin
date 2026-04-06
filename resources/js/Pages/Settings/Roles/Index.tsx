import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, X, Trash2, Shield, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: string[];
    members_count?: number;
}

interface Props {
    roles: Role[];
}

// ─── Permission config ────────────────────────────────────────────────────────

const PERMISSION_GROUPS = [
    { label: 'Transações',       prefix: 'transactions',  actions: ['view', 'create', 'edit', 'delete'] },
    { label: 'Cartões',          prefix: 'credit_cards',  actions: ['view', 'create', 'edit', 'delete'] },
    { label: 'Contas Bancárias', prefix: 'bank_accounts', actions: ['view', 'create', 'edit', 'delete'] },
    { label: 'Categorias',       prefix: 'categories',    actions: ['view', 'create', 'edit', 'delete'] },
    { label: 'Relatórios',       prefix: 'reports',       actions: ['view'] },
    { label: 'Configurações',    prefix: 'settings',      actions: ['view'] },
] as const;

const ACTION_LABELS: Record<string, string> = { view: 'Ver', create: 'Criar', edit: 'Editar', delete: 'Excluir' };

// ─── PermissionsGrid ─────────────────────────────────────────────────────────

function PermissionsGrid({
    permissions,
    onChange,
}: {
    permissions: string[];
    onChange: (perms: string[]) => void;
}) {
    const toggle = (perm: string) => {
        onChange(permissions.includes(perm)
            ? permissions.filter(p => p !== perm)
            : [...permissions, perm]);
    };

    const toggleGroup = (prefix: string, actions: readonly string[]) => {
        const groupPerms = actions.map(a => `${prefix}.${a}`);
        const allChecked = groupPerms.every(p => permissions.includes(p));
        onChange(allChecked
            ? permissions.filter(p => !groupPerms.includes(p))
            : [...new Set([...permissions, ...groupPerms])]);
    };

    return (
        <div className="flex flex-col gap-3">
            {PERMISSION_GROUPS.map(({ label, prefix, actions }) => {
                const groupPerms = actions.map(a => `${prefix}.${a}`);
                const allChecked = groupPerms.every(p => permissions.includes(p));
                return (
                    <div key={prefix} className="bg-[var(--color-surface-2)] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-white text-sm font-medium">{label}</p>
                            <button
                                type="button"
                                onClick={() => toggleGroup(prefix, actions)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                    allChecked
                                        ? 'bg-[#22c55e]/10 text-[#22c55e]'
                                        : 'bg-[var(--color-border)] text-gray-400 hover:text-white'
                                }`}
                            >
                                {allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {actions.map((action) => {
                                const perm = `${prefix}.${action}`;
                                const checked = permissions.includes(perm);
                                return (
                                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggle(perm)}
                                            className="accent-green-500 w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-300">{ACTION_LABELS[action]}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── RoleCard ─────────────────────────────────────────────────────────────────

function RoleCard({
    role,
    onEdit,
    onDelete,
}: {
    role: Role;
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const canDelete = (role.members_count ?? 0) === 0;

    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--color-surface-2)]/30 transition-colors"
                onClick={() => setExpanded((e) => !e)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
                        <Shield size={16} className="text-[#22c55e]" />
                    </div>
                    <div>
                        <p className="text-white font-semibold">{role.name}</p>
                        {role.description && (
                            <p className="text-gray-500 text-xs mt-0.5">{role.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 flex-shrink-0">
                        {role.members_count ?? 0} membro{(role.members_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] bg-[var(--color-surface-2)] text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0">
                        {role.permissions?.length ?? 0} permissões
                    </span>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-5 border-t border-[var(--color-border)] pt-4 flex flex-col gap-4">
                    {/* Permissões por grupo */}
                    <div className="flex flex-col gap-3">
                        {PERMISSION_GROUPS.map(({ label, prefix, actions }) => (
                            <div key={prefix}>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">{label}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {actions.map((action) => {
                                        const perm = `${prefix}.${action}`;
                                        const active = role.permissions?.includes(perm);
                                        return (
                                            <span
                                                key={perm}
                                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                    active
                                                        ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30'
                                                        : 'bg-[var(--color-surface-2)] text-gray-600 border border-transparent'
                                                }`}
                                            >
                                                {ACTION_LABELS[action]}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ações */}
                    <div className="flex justify-end items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(role); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 text-xs font-medium transition-colors"
                        >
                            <Pencil size={13} /> Editar
                        </button>
                        {canDelete ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(role); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
                            >
                                <Trash2 size={13} /> Excluir
                            </button>
                        ) : (
                            <p className="text-gray-600 text-xs">
                                {role.members_count} membro{(role.members_count ?? 0) !== 1 ? 's' : ''} — não é possível excluir
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── RoleFormModal ────────────────────────────────────────────────────────────

function RoleFormModal({
    role,
    onClose,
}: {
    role?: Role;
    onClose: () => void;
}) {
    const isEditing = !!role;
    const { data, setData, post, patch, processing, errors } = useForm({
        name:        role?.name ?? '',
        description: role?.description ?? '',
        permissions: role?.permissions ?? [] as string[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            patch(route('settings.roles.update', role.id), { onSuccess: () => onClose() });
        } else {
            post(route('settings.roles.store'), { onSuccess: () => onClose() });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
                    <h2 className="text-white font-semibold text-lg">
                        {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Nome <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ex: Visualizador, Gestor..."
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Descrição</label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="Descreva o propósito deste perfil..."
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Permissões</label>
                        <PermissionsGrid
                            permissions={data.permissions}
                            onChange={(perms) => setData('permissions', perms)}
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({ role, onClose }: { role: Role; onClose: () => void }) {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('settings.roles.destroy', role.id), {
            onFinish: () => { setDeleting(false); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white font-semibold text-lg">Excluir perfil</h2>
                    <p className="text-gray-400 text-sm">Tem certeza que deseja excluir o perfil <span className="text-white font-medium">"{role.name}"</span>?</p>
                    <p className="text-red-400 text-xs">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 text-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold disabled:opacity-50"
                    >
                        {deleting ? 'Excluindo...' : 'Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesIndex({ roles }: Props) {
    const { flash } = usePage().props;
    const [showForm, setShowForm]       = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);

    const openNew  = () => { setEditingRole(null); setShowForm(true); };
    const openEdit = (role: Role) => { setEditingRole(role); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditingRole(null); };

    return (
        <AppLayout title="Perfis">
            <Head title="Perfis e Permissões" />
            <div className="w-full flex flex-col gap-6">
                {(flash as any)?.success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
                        {(flash as any).success}
                    </div>
                )}
                {(flash as any)?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                        {(flash as any).error}
                    </div>
                )}

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Perfis e Permissões</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {roles.length === 0
                                ? 'Nenhum perfil criado'
                                : `${roles.length} perfil${roles.length !== 1 ? 's' : ''} configurado${roles.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <Plus size={16} /> Novo Perfil
                    </button>
                </div>

                {roles.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                            <Shield size={24} className="text-gray-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">Nenhum perfil cadastrado</p>
                            <p className="text-gray-500 text-sm mt-1">Crie perfis para controlar o acesso dos membros.</p>
                        </div>
                        <button
                            onClick={openNew}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                        >
                            <Plus size={16} /> Novo Perfil
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {roles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onEdit={openEdit}
                                onDelete={setDeletingRole}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <RoleFormModal
                    role={editingRole ?? undefined}
                    onClose={closeForm}
                />
            )}
            {deletingRole && (
                <DeleteConfirmModal
                    role={deletingRole}
                    onClose={() => setDeletingRole(null)}
                />
            )}
        </AppLayout>
    );
}
