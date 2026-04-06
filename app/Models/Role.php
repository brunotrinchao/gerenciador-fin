<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['admin_id', 'name', 'description', 'permissions'];

    protected $casts = [
        'permissions' => 'array',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
