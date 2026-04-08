<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * @property int         $id
 * @property string      $name
 * @property string      $email
 * @property string|null $avatar
 * @property int|null    $admin_id
 * @property int|null    $role_id
 * @property string|null $google_calendar_token
 * @property bool        $google_calendar_enabled
 */
#[Fillable(['name', 'email', 'password', 'avatar', 'admin_id', 'role_id', 'google_calendar_token', 'google_calendar_enabled'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'password'                => 'hashed',
            'google_calendar_token'   => 'encrypted',
            'google_calendar_enabled' => 'boolean',
        ];
    }

    public function hasCalendarConnected(): bool
    {
        return $this->google_calendar_enabled && ! empty($this->google_calendar_token);
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(BankAccount::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function creditCards(): HasMany
    {
        return $this->hasMany(CreditCard::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function guests(): HasMany
    {
        return $this->hasMany(User::class, 'admin_id');
    }

    public function getOwnerIdAttribute(): int
    {
        return $this->admin_id ?? $this->id;
    }

    public function getIsAdminAttribute(): bool
    {
        return is_null($this->admin_id);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->is_admin) {
            return true;
        }

        if (!$this->role || !is_array($this->role->permissions)) {
            return false;
        }

        return in_array($permission, $this->role->permissions);
    }
}
