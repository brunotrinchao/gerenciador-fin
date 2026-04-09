import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';

interface ConfirmDeleteDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDeleteDialog({
    open,
    title,
    description,
    confirmLabel = 'Remover',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-md"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)',
                }}
            >
                <DialogHeader>
                    <DialogTitle style={{ color: 'var(--md-color-on-surface)' }}>
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription style={{ color: 'var(--md-color-on-surface-variant)' }}>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex items-center justify-center px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--md-color-on-surface-variant)',
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: 'var(--md-color-error)' }}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
