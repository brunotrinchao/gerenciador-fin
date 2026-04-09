# Design: Padronização de Padrões CRUD

**Data:** 2026-04-09
**Status:** Aprovado
**Escopo:** 1 componente novo + 5 páginas modificadas + 3 páginas de Settings auditadas

---

## Problema

O sistema possui inconsistências nos padrões de CRUD entre as páginas:

| Página | Problema |
|---|---|
| `TaxPlanning` | Formulário inline (deveria ser modal); delete via `window.confirm()` (sem estilo); sem edição |
| `Recurrences` | Confirmação de cancelamento com botões inline na linha da tabela |
| `BankAccounts` | Flash messages com classes Tailwind hardcoded (`bg-green-500/10`) — deveria usar tokens M3 |
| `Settings/*` | Possível uso de `window.confirm()` ou padrões inline — a auditar |

O padrão correto (já usado em BankAccounts, Investments, CreditCards, Transactions, Invoices) é:
- Criar/Editar: `showFormModal` + `editingEntity` state → modal custom
- Deletar: `deletingEntity` state → modal de confirmação dedicado
- Flash: classes `.alert-success` / `.alert-error` com tokens M3

---

## Solução

### Abordagem escolhida: Componentes Compartilhados Cirúrgicos

Criar um componente `ConfirmDeleteDialog` reutilizável e corrigir apenas as páginas problemáticas. Páginas que já seguem o padrão correto não são alteradas.

---

## 1. Novo Componente: `ConfirmDeleteDialog`

**Caminho:** `resources/js/Components/ConfirmDeleteDialog.tsx`

**Interface:**
```tsx
interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;    // default: "Remover"
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Comportamento:**
- Usa `Dialog` do shadcn/ui (já instalado em `resources/js/Components/ui/dialog.tsx`)
- Botão confirmar: cor `--md-color-error`, texto branco
- Botão cancelar: estilo secundário (surface + border)
- Estado `loading`: exibe `Loader2` animado no botão confirmar, desabilita ambos os botões
- Fecha ao pressionar Escape (comportamento padrão do Dialog)
- Não fecha ao clicar fora (evitar deleção acidental)

**Uso padrão:**
```tsx
<ConfirmDeleteDialog
  open={!!deletingItem}
  title="Remover item?"
  description="Esta ação não pode ser desfeita."
  onConfirm={handleDelete}
  onCancel={() => setDeletingItem(null)}
  loading={processing}
/>
```

---

## 2. Mudanças por Página

### 2.1 `TaxPlanning/Index.tsx`

**Problemas:** formulário inline, `window.confirm()`, sem edição.

**Estado novo:**
```tsx
const [showFormModal, setShowFormModal] = useState(false);
const [editingEvent, setEditingEvent] = useState<TaxEvent | null>(null);
const [deletingEvent, setDeletingEvent] = useState<TaxEvent | null>(null);
```

**Mudanças:**
- Remover `showForm` boolean e o bloco de formulário inline do JSX principal
- Mover o formulário para dentro de um modal custom (mesmo padrão de BankAccounts)
- `openCreate()`: `setEditingEvent(null); setShowFormModal(true)`
- `openEdit(event)`: `setEditingEvent(event); setShowFormModal(true)`
- `handleDelete()`: `router.delete(...)` chamado de dentro do `ConfirmDeleteDialog`
- Botão delete na `TaxEventRow`: `onClick={() => setDeletingEvent(event)}`
- Botão edit na `TaxEventRow`: novo botão Pencil → `onClick={() => openEdit(event)}`
- Adicionar `ConfirmDeleteDialog` no JSX com `open={!!deletingEvent}`
- Header: botão "Adicionar Imposto" sempre visível (não toggle)

**Rota de edição necessária no backend:** verificar se `tax-planning.update` existe; se não, criar.

### 2.2 `Recurrences/Index.tsx`

**Problema:** confirmação inline com botões "Confirmar/Voltar" na linha da tabela.

**Mudanças:**
- Manter `confirmCancelId` state (já existe)
- Remover bloco condicional de botões inline da coluna "Ações"
- Substituir por botão único "Cancelar série" → `setConfirmCancelId(rec.id)`
- Adicionar `ConfirmDeleteDialog` com:
  - `open={confirmCancelId !== null}`
  - `title="Cancelar recorrência?"`
  - `description="Todas as transações futuras desta série serão canceladas. Transações já pagas não são afetadas."`
  - `confirmLabel="Cancelar série"`
  - `onConfirm={() => handleCancel(confirmCancelId!)}`
  - `onCancel={() => setConfirmCancelId(null)}`

### 2.3 `BankAccounts/Index.tsx`

**Problema:** flash messages com classes Tailwind hardcoded.

**Mudanças:**
```tsx
// Antes
<div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
// Depois
<div className="alert-success p-4 rounded-xl text-sm">

// Antes
<div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
// Depois
<div className="alert-error p-4 rounded-xl text-sm">
```

### 2.4 `Settings/Categories/Index.tsx`, `Settings/Members/Index.tsx`, `Settings/Roles/Index.tsx`

**Ação:** auditar cada arquivo e:
- Substituir qualquer `window.confirm()` por `ConfirmDeleteDialog`
- Substituir botões inline de confirmação por `ConfirmDeleteDialog`
- Corrigir flash messages hardcoded se encontradas

---

## 3. Padrão de Referência (não alterar)

As páginas a seguir já seguem o padrão correto e **não devem ser modificadas**:
- `Transactions/Index.tsx`
- `Invoices/Index.tsx`
- `Investments/Index.tsx`
- `CreditCards/Index.tsx`

---

## 4. Critérios de Aceitação

- [ ] `ConfirmDeleteDialog` criado e funcionando com estado `loading`
- [ ] `TaxPlanning`: formulário em modal, edição disponível, delete via `ConfirmDeleteDialog`
- [ ] `Recurrences`: sem botões inline de confirmação, usa `ConfirmDeleteDialog`
- [ ] `BankAccounts`: flash messages usando tokens M3
- [ ] `Settings/*`: sem `window.confirm()`, usa `ConfirmDeleteDialog`
- [ ] Build passa sem erros TypeScript
- [ ] Nenhuma página que já funciona foi alterada

---

## 5. Arquivos Afetados

**Novo:**
- `resources/js/Components/ConfirmDeleteDialog.tsx`

**Modificados:**
- `resources/js/Pages/TaxPlanning/Index.tsx`
- `resources/js/Pages/Recurrences/Index.tsx`
- `resources/js/Pages/BankAccounts/Index.tsx`
- `resources/js/Pages/Settings/Categories/Index.tsx`
- `resources/js/Pages/Settings/Members/Index.tsx`
- `resources/js/Pages/Settings/Roles/Index.tsx`
