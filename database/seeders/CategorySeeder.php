<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // ── ALIMENTAÇÃO ──────────────────────────────────────────────
            ['name' => 'Alimentação',                'icon' => 'utensils',         'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Supermercado',               'icon' => 'shopping-cart',    'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Restaurante',                'icon' => 'utensils',         'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Lanchonete e Fast Food',     'icon' => 'utensils',         'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Delivery de Comida',         'icon' => 'bike',             'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Padaria e Confeitaria',      'icon' => 'coffee',           'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Hortifrúti e Feira',         'icon' => 'leaf',             'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Bar e Bebidas',              'icon' => 'wine',             'color' => '#ef4444', 'type' => CategoryType::Expense],
            ['name' => 'Cafeteria',                  'icon' => 'coffee',           'color' => '#ef4444', 'type' => CategoryType::Expense],

            // ── TRANSPORTE ───────────────────────────────────────────────
            ['name' => 'Transporte',                 'icon' => 'car',              'color' => '#eab308', 'type' => CategoryType::Expense],
            ['name' => 'Combustível',                'icon' => 'fuel',             'color' => '#f59e0b', 'type' => CategoryType::Expense],
            ['name' => 'Uber e Táxi',                'icon' => 'car',              'color' => '#eab308', 'type' => CategoryType::Expense],
            ['name' => 'Transporte Público',         'icon' => 'bus',              'color' => '#eab308', 'type' => CategoryType::Expense],
            ['name' => 'Estacionamento e Pedágio',   'icon' => 'parking-circle',   'color' => '#eab308', 'type' => CategoryType::Expense],
            ['name' => 'Manutenção de Veículo',      'icon' => 'wrench',           'color' => '#eab308', 'type' => CategoryType::Expense],

            // ── MORADIA ──────────────────────────────────────────────────
            ['name' => 'Moradia',                    'icon' => 'home',             'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Aluguel',                    'icon' => 'home',             'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Condomínio',                 'icon' => 'building-2',       'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Energia Elétrica',           'icon' => 'zap',              'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Água e Saneamento',          'icon' => 'droplets',         'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Gás',                        'icon' => 'flame',            'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Reforma e Decoração',        'icon' => 'hammer',           'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Limpeza e Domésticos',       'icon' => 'sparkles',         'color' => '#f97316', 'type' => CategoryType::Expense],

            // ── SAÚDE ────────────────────────────────────────────────────
            ['name' => 'Saúde',                      'icon' => 'heart-pulse',      'color' => '#22c55e', 'type' => CategoryType::Expense],
            ['name' => 'Farmácia e Medicamentos',    'icon' => 'pill',             'color' => '#22c55e', 'type' => CategoryType::Expense],
            ['name' => 'Consulta Médica',            'icon' => 'stethoscope',      'color' => '#22c55e', 'type' => CategoryType::Expense],
            ['name' => 'Dentista',                   'icon' => 'smile',            'color' => '#22c55e', 'type' => CategoryType::Expense],
            ['name' => 'Exame e Laboratório',        'icon' => 'microscope',       'color' => '#22c55e', 'type' => CategoryType::Expense],
            ['name' => 'Academia e Esporte',         'icon' => 'dumbbell',         'color' => '#22c55e', 'type' => CategoryType::Expense],
            ['name' => 'Plano de Saúde',             'icon' => 'shield-plus',      'color' => '#22c55e', 'type' => CategoryType::Expense],
            ['name' => 'Psicólogo e Terapia',        'icon' => 'brain',            'color' => '#22c55e', 'type' => CategoryType::Expense],

            // ── LAZER E ENTRETENIMENTO ───────────────────────────────────
            ['name' => 'Lazer',                      'icon' => 'gamepad-2',        'color' => '#a855f7', 'type' => CategoryType::Expense],
            ['name' => 'Streaming',                  'icon' => 'tv-2',             'color' => '#a855f7', 'type' => CategoryType::Expense],
            ['name' => 'Cinema e Teatro',            'icon' => 'clapperboard',     'color' => '#a855f7', 'type' => CategoryType::Expense],
            ['name' => 'Games e Jogos',              'icon' => 'gamepad-2',        'color' => '#a855f7', 'type' => CategoryType::Expense],
            ['name' => 'Shows e Eventos',            'icon' => 'music',            'color' => '#a855f7', 'type' => CategoryType::Expense],
            ['name' => 'Livros e Revistas',          'icon' => 'book-open',        'color' => '#a855f7', 'type' => CategoryType::Expense],
            ['name' => 'Música e Podcasts',          'icon' => 'headphones',       'color' => '#a855f7', 'type' => CategoryType::Expense],

            // ── EDUCAÇÃO ─────────────────────────────────────────────────
            ['name' => 'Educação',                   'icon' => 'book-open',        'color' => '#3b82f6', 'type' => CategoryType::Expense],
            ['name' => 'Mensalidade Escolar',        'icon' => 'graduation-cap',   'color' => '#3b82f6', 'type' => CategoryType::Expense],
            ['name' => 'Cursos e Treinamentos',      'icon' => 'monitor',          'color' => '#3b82f6', 'type' => CategoryType::Expense],
            ['name' => 'Material Escolar',           'icon' => 'pencil',           'color' => '#3b82f6', 'type' => CategoryType::Expense],

            // ── VESTUÁRIO ────────────────────────────────────────────────
            ['name' => 'Vestuário',                  'icon' => 'shirt',            'color' => '#ec4899', 'type' => CategoryType::Expense],
            ['name' => 'Calçados',                   'icon' => 'footprints',       'color' => '#ec4899', 'type' => CategoryType::Expense],
            ['name' => 'Acessórios e Bolsas',        'icon' => 'watch',            'color' => '#ec4899', 'type' => CategoryType::Expense],

            // ── TECNOLOGIA ───────────────────────────────────────────────
            ['name' => 'Tecnologia e Eletrônicos',   'icon' => 'laptop',           'color' => '#06b6d4', 'type' => CategoryType::Expense],
            ['name' => 'Internet e Telefone',        'icon' => 'smartphone',       'color' => '#8b5cf6', 'type' => CategoryType::Expense],
            ['name' => 'Aplicativos e Software',     'icon' => 'app-window',       'color' => '#06b6d4', 'type' => CategoryType::Expense],

            // ── VIAGENS ──────────────────────────────────────────────────
            ['name' => 'Viagens',                    'icon' => 'plane',            'color' => '#0ea5e9', 'type' => CategoryType::Expense],
            ['name' => 'Hotel e Hospedagem',         'icon' => 'hotel',            'color' => '#0ea5e9', 'type' => CategoryType::Expense],
            ['name' => 'Passagem Aérea',             'icon' => 'plane',            'color' => '#0ea5e9', 'type' => CategoryType::Expense],
            ['name' => 'Aluguel de Carro',           'icon' => 'car',              'color' => '#0ea5e9', 'type' => CategoryType::Expense],

            // ── BELEZA ───────────────────────────────────────────────────
            ['name' => 'Beleza e Cuidados Pessoais', 'icon' => 'scissors',         'color' => '#f472b6', 'type' => CategoryType::Expense],
            ['name' => 'Salão e Barbearia',          'icon' => 'scissors',         'color' => '#f472b6', 'type' => CategoryType::Expense],
            ['name' => 'Cosméticos e Perfumaria',    'icon' => 'sparkles',         'color' => '#f472b6', 'type' => CategoryType::Expense],

            // ── ASSINATURAS E SERVIÇOS ───────────────────────────────────
            ['name' => 'Assinaturas',                'icon' => 'credit-card',      'color' => '#64748b', 'type' => CategoryType::Expense],
            ['name' => 'Serviços e Utilities',       'icon' => 'zap',              'color' => '#06b6d4', 'type' => CategoryType::Expense],

            // ── SEGUROS E FINANCEIRO ─────────────────────────────────────
            ['name' => 'Seguros',                    'icon' => 'shield',           'color' => '#10b981', 'type' => CategoryType::Expense],
            ['name' => 'IOF e Taxas Bancárias',      'icon' => 'landmark',         'color' => '#64748b', 'type' => CategoryType::Expense],
            ['name' => 'Juros e Encargos',           'icon' => 'percent',          'color' => '#64748b', 'type' => CategoryType::Expense],

            // ── PET ──────────────────────────────────────────────────────
            ['name' => 'Pet',                        'icon' => 'paw-print',        'color' => '#78716c', 'type' => CategoryType::Expense],
            ['name' => 'Veterinário',                'icon' => 'stethoscope',      'color' => '#78716c', 'type' => CategoryType::Expense],

            // ── COMPRAS ONLINE E MERCADO ──────────────────────────────────
            ['name' => 'Compras Online',             'icon' => 'shopping-bag',     'color' => '#f97316', 'type' => CategoryType::Expense],
            ['name' => 'Eletrônicos e Informática',  'icon' => 'monitor',          'color' => '#06b6d4', 'type' => CategoryType::Expense],
            ['name' => 'Casa e Utilidades',          'icon' => 'sofa',             'color' => '#f97316', 'type' => CategoryType::Expense],

            // ── OUTROS ───────────────────────────────────────────────────
            ['name' => 'Transferência',              'icon' => 'arrow-left-right', 'color' => '#6b7280', 'type' => CategoryType::Expense],
            ['name' => 'Saque',                      'icon' => 'banknote',         'color' => '#6b7280', 'type' => CategoryType::Expense],
            ['name' => 'Outros Gastos',              'icon' => 'more-horizontal',  'color' => '#6b7280', 'type' => CategoryType::Expense],

            // ── RECEITAS ─────────────────────────────────────────────────
            ['name' => 'Salário',                    'icon' => 'briefcase',        'color' => '#22c55e', 'type' => CategoryType::Income],
            ['name' => 'Freelance',                  'icon' => 'laptop',           'color' => '#10b981', 'type' => CategoryType::Income],
            ['name' => 'Rendimentos Financeiros',    'icon' => 'trending-up',      'color' => '#3b82f6', 'type' => CategoryType::Income],
            ['name' => 'Dividendos',                 'icon' => 'bar-chart-2',      'color' => '#6366f1', 'type' => CategoryType::Income],
            ['name' => 'Aluguel Recebido',           'icon' => 'key-round',        'color' => '#f59e0b', 'type' => CategoryType::Income],
            ['name' => 'Bônus',                      'icon' => 'star',             'color' => '#eab308', 'type' => CategoryType::Income],
            ['name' => 'Reembolso',                  'icon' => 'rotate-ccw',       'color' => '#06b6d4', 'type' => CategoryType::Income],
            ['name' => 'Outros Recebimentos',        'icon' => 'wallet',           'color' => '#8b5cf6', 'type' => CategoryType::Income],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                [
                    'name'       => $category['name'],
                    'user_id'    => User::first()->id,
                    'is_default' => true,
                ],
                [
                    'icon'      => $category['icon'],
                    'color'     => $category['color'],
                    'type'      => $category['type'],
                    'parent_id' => null,
                ]
            );
        }
    }
}
