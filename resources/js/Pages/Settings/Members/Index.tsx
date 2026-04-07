import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { UserPlus, Users, Mail, Trash2, X, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    role?: { id: number; name: string } | null;
    joined_at?: string | null;
}

interface Invite {
    id: number;
    email: string;
    role?: { id: number; name: string } | null;
    created_at: string;
}

interface Role {
    id: number;
    name: string;
}

interface Props {
    members: Member[];
    invites: Invite[];
    roles: Role[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


function Avatar({ name, avatar, size = 36 }: { name: string; avatar: string | null; size?: number }) {
    if (avatar) {
        return <img src={avatar} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
    }
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div
            className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-[#22c55e]/20 text-[#22c55e]"
            style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
            {initials}
        </div>
    );
}

// ─── InviteModal ──────────────────────────────────────────────────────────────

function InviteModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', role_id: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.members.invite'), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-white font-semibold text-lg">Convidar Membro</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
                    {roles.length === 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm rounded-xl px-4 py-3">
                            Crie um perfil antes de convidar alguém.
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">E-mail <span className="text-red-400">*</span></label>
                        <input
                            type="email" value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="email@exemplo.com"
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Perfil <span className="text-red-400">*</span></label>
                        <select
                            value={data.role_id} onChange={e => setData('role_id', e.target.value)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            <option value="">Selecionar perfil</option>
                            {roles.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                        </select>
                        {errors.role_id && <p className="text-red-400 text-xs">{errors.role_id}</p>}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 text-sm font-medium transition-colors">Cancelar</button>
                        <button type="submit" disabled={processing || roles.length === 0}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50">
                            {processing ? 'Enviando...' : 'Enviar Convite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersIndex({ members, invites, roles }: Props) {
    const { flash } = usePage().props;
    const [showInvite, setShowInvite] = useState(false);

    const handleRemoveMember = (id: number) => {
        if (confirm('Tem certeza que deseja remover este membro?')) {
            router.delete(route('settings.members.destroy', id));
        }
    };

    const handleCancelInvite = (id: number) => {
        if (confirm('Cancelar este convite?')) {
            router.delete(route('settings.invites.destroy', id));
        }
    };

    return (
        <AppLayout title="Membros">
            <Head title="Membros" />
            <div className="w-full flex flex-col gap-6">
                {/* Flash messages */}
                {(flash as any)?.success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">{(flash as any).success}</div>
                )}
                {(flash as any)?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{(flash as any).error}</div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Membros</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {members.length} membro{members.length !== 1 ? 's' : ''} · {invites.length} convite{invites.length !== 1 ? 's' : ''} pendente{invites.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowInvite(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <UserPlus size={16} /> Convidar
                    </button>
                </div>

                {/* Membros ativos */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
                        <Users size={16} className="text-[#22c55e]" />
                        <h2 className="text-white font-semibold">Membros Ativos</h2>
                    </div>
                    {members.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <p className="text-gray-500 text-sm">Nenhum membro ainda. Convide alguém!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-border)]">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface-2)]/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={member.name} avatar={member.avatar} size={36} />
                                        <div>
                                            <p className="text-white font-medium text-sm">{member.name}</p>
                                            <p className="text-gray-500 text-xs">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {member.role && (
                                            <span className="text-xs bg-[var(--color-surface-2)] text-gray-300 px-2.5 py-1 rounded-full">
                                                {member.role.name}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Remover membro"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Convites pendentes */}
                {invites.length > 0 && (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
                            <Clock size={16} className="text-amber-400" />
                            <h2 className="text-white font-semibold">Convites Pendentes</h2>
                        </div>
                        <div className="divide-y divide-[var(--color-border)]">
                            {invites.map((invite) => (
                                <div key={invite.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface-2)]/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                            <Mail size={15} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{invite.email}</p>
                                            <p className="text-gray-500 text-xs">Enviado em {formatDate(invite.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {invite.role && (
                                            <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full">
                                                {invite.role.name}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleCancelInvite(invite.id)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Cancelar convite"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showInvite && <InviteModal roles={roles} onClose={() => setShowInvite(false)} />}
        </AppLayout>
    );
}
