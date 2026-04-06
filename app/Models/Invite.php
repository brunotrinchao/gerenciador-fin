<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invite extends Model
{
    protected $fillable = ['email', 'admin_id', 'role_id', 'token', 'status'];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}
