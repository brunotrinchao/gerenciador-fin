<?php

namespace Tests\Feature\Import;

use App\Models\CreditCard;
use App\Models\CreditCardStatement;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImportControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Storage::fake('local');
        Queue::fake();
    }

    // ─────────────────────────────────────────────
    // index
    // ─────────────────────────────────────────────

    public function test_import_index_requires_auth(): void
    {
        $this->get(route('imports.index'))->assertRedirect('/login');
    }

    public function test_import_index_renders_for_authenticated_user(): void
    {
        $this->actingAs($this->user)
            ->get(route('imports.index'))
            ->assertStatus(200);
    }

    // ─────────────────────────────────────────────
    // upload
    // ─────────────────────────────────────────────

    public function test_upload_rejects_non_file(): void
    {
        $this->actingAs($this->user)
            ->post(route('imports.upload'), [])
            ->assertSessionHasErrors('file');
    }

    public function test_upload_rejects_disallowed_extension(): void
    {
        $file = UploadedFile::fake()->create('invoice.xlsx', 100, 'application/vnd.ms-excel');

        $this->actingAs($this->user)
            ->post(route('imports.upload'), ['file' => $file])
            ->assertSessionHasErrors('file');
    }

    public function test_upload_csv_stores_session_and_redirects(): void
    {
        // A minimal CSV with one transaction line
        $csvContent = "date,description,amount\n2026-01-15,\"Supermercado\",150.00\n";
        $file = UploadedFile::fake()->createWithContent('fatura.csv', $csvContent);

        $response = $this->actingAs($this->user)
            ->post(route('imports.upload'), ['file' => $file]);

        $response->assertRedirect(route('imports.index'));
    }

    // ─────────────────────────────────────────────
    // process
    // ─────────────────────────────────────────────

    public function test_process_without_session_redirects_with_error(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $this->actingAs($this->user)
            ->post(route('imports.process'), [
                'credit_card_id' => $card->id,
            ])
            ->assertRedirect(route('imports.index'))
            ->assertSessionHas('error');
    }

    public function test_process_with_session_creates_statement_and_dispatches_job(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $userId = $this->user->id;
        $items  = [
            [
                'date'          => '2026-01-15',
                'description'   => 'Restaurante',
                'amount'        => 75.00,
                'is_parcelado'  => false,
                'parcela_atual' => null,
                'parcela_total' => null,
                'status_import' => 'new',
                'category_id'   => null,
                'category_name' => null,
            ],
        ];

        // Seed session manually
        session([
            "import_preview_{$userId}"   => $items,
            "import_filename_{$userId}"  => 'fatura.csv',
            "import_file_path_{$userId}" => "imports/{$userId}/fatura.csv",
        ]);

        $this->actingAs($this->user)
            ->post(route('imports.process'), [
                'credit_card_id' => $card->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('credit_card_statements', [
            'credit_card_id' => $card->id,
            'user_id'        => $userId,
        ]);

        Queue::assertPushed(\App\Jobs\ProcessStatementImport::class);
    }

    // ─────────────────────────────────────────────
    // review
    // ─────────────────────────────────────────────

    public function test_review_shows_waiting_when_processing(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $statement = CreditCardStatement::create([
            'user_id'         => $this->user->id,
            'credit_card_id'  => $card->id,
            'reference_month' => '2026-01',
            'total_amount'    => 100,
            'paid_amount'     => 0,
            'status'          => 'open',
            'import_status'   => 'processing',
            'imported_at'     => now(),
        ]);

        $this->actingAs($this->user)
            ->get(route('imports.review', $statement->id))
            ->assertStatus(200);
    }

    public function test_review_redirects_on_failed_status(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $statement = CreditCardStatement::create([
            'user_id'         => $this->user->id,
            'credit_card_id'  => $card->id,
            'reference_month' => '2026-02',
            'total_amount'    => 100,
            'paid_amount'     => 0,
            'status'          => 'open',
            'import_status'   => 'failed',
            'imported_at'     => now(),
        ]);

        $this->actingAs($this->user)
            ->get(route('imports.review', $statement->id))
            ->assertRedirect(route('imports.index'))
            ->assertSessionHas('error');
    }

    public function test_review_forbidden_for_other_user(): void
    {
        $otherUser = User::factory()->create();
        $card = CreditCard::factory()->create([
            'user_id'         => $otherUser->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $statement = CreditCardStatement::create([
            'user_id'         => $otherUser->id,
            'credit_card_id'  => $card->id,
            'reference_month' => '2026-03',
            'total_amount'    => 200,
            'paid_amount'     => 0,
            'status'          => 'open',
            'import_status'   => 'processing',
            'imported_at'     => now(),
        ]);

        $this->actingAs($this->user)
            ->get(route('imports.review', $statement->id))
            ->assertStatus(403);
    }

    // ─────────────────────────────────────────────
    // statusJson
    // ─────────────────────────────────────────────

    public function test_status_json_returns_import_status(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $statement = CreditCardStatement::create([
            'user_id'         => $this->user->id,
            'credit_card_id'  => $card->id,
            'reference_month' => '2026-04',
            'total_amount'    => 50,
            'paid_amount'     => 0,
            'status'          => 'open',
            'import_status'   => 'review_pending',
            'imported_at'     => now(),
        ]);

        $this->actingAs($this->user)
            ->getJson(route('imports.status', $statement->id))
            ->assertOk()
            ->assertJson(['import_status' => 'review_pending']);
    }

    public function test_status_json_forbidden_for_other_user(): void
    {
        $otherUser = User::factory()->create();
        $card = CreditCard::factory()->create([
            'user_id'         => $otherUser->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $statement = CreditCardStatement::create([
            'user_id'         => $otherUser->id,
            'credit_card_id'  => $card->id,
            'reference_month' => '2026-05',
            'total_amount'    => 80,
            'paid_amount'     => 0,
            'status'          => 'open',
            'import_status'   => 'processing',
            'imported_at'     => now(),
        ]);

        $this->actingAs($this->user)
            ->getJson(route('imports.status', $statement->id))
            ->assertStatus(403);
    }

    // ─────────────────────────────────────────────
    // store (import transactions)
    // ─────────────────────────────────────────────

    public function test_store_creates_single_transactions(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $transactions = [
            [
                'date'          => '2026-01-10',
                'description'   => 'Farmácia',
                'amount'        => 45.50,
                'is_parcelado'  => false,
                'parcela_atual' => null,
                'parcela_total' => null,
                'category_id'   => null,
            ],
            [
                'date'          => '2026-01-12',
                'description'   => 'Uber',
                'amount'        => 22.00,
                'is_parcelado'  => false,
                'parcela_atual' => null,
                'parcela_total' => null,
                'category_id'   => null,
            ],
        ];

        $this->actingAs($this->user)
            ->post(route('imports.store'), [
                'credit_card_id' => $card->id,
                'transactions'   => $transactions,
            ])
            ->assertRedirect(route('transactions.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseCount('transactions', 2);
    }

    public function test_store_deduplicates_identical_hashes(): void
    {
        $card = CreditCard::factory()->create([
            'user_id'         => $this->user->id,
            'closing_day'     => 20,
            'due_day'         => 27,
            'credit_limit'    => 5000,
            'available_limit' => 5000,
        ]);

        $tx = [
            'date'          => '2026-01-10',
            'description'   => 'Cinema',
            'amount'        => 30.00,
            'is_parcelado'  => false,
            'parcela_atual' => null,
            'parcela_total' => null,
            'category_id'   => null,
        ];

        // First import
        $this->actingAs($this->user)
            ->post(route('imports.store'), [
                'credit_card_id' => $card->id,
                'transactions'   => [$tx],
            ]);

        // Second import — same transaction
        $this->actingAs($this->user)
            ->post(route('imports.store'), [
                'credit_card_id' => $card->id,
                'transactions'   => [$tx],
            ]);

        // Should still be only 1
        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_store_requires_credit_card_id(): void
    {
        $this->actingAs($this->user)
            ->post(route('imports.store'), [
                'transactions' => [
                    [
                        'date'        => '2026-01-10',
                        'description' => 'Test',
                        'amount'      => 10.00,
                    ],
                ],
            ])
            ->assertSessionHasErrors('credit_card_id');
    }
}
