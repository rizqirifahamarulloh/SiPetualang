<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $table = 'conversations';
    protected $primaryKey = 'id_conversation';

    // Migration pakai timestamps, jadi true
    public $timestamps = true;

    protected $fillable = ['id_user_a', 'id_user_b', 'last_message_at'];

    public function userA()
    {
        return $this->belongsTo(Pengguna::class, 'id_user_a', 'id_pengguna');
    }

    public function userB()
    {
        return $this->belongsTo(Pengguna::class, 'id_user_b', 'id_pengguna');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'id_conversation', 'id_conversation');
    }

    public function getOtherUser($userId)
    {
        return $this->id_user_a == $userId ? $this->userB : $this->userA;
    }
}
