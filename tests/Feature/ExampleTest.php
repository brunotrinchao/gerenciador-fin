<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_authenticated_user_sees_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/')
            ->assertStatus(200);
    }

    public function test_login_page_is_accessible(): void
    {
        $this->get('/login')->assertStatus(200);
    }
}
