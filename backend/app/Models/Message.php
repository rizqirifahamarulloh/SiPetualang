<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $table = 'messages';
    protected $primaryKey = 'id_message';

    // Migration pakai timestamps, jadi true
    public $timestamps = true;

    protected $fillable = ['id_conversation', 'id_sender', 'message', 'is_read'];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'id_conversation', 'id_conversation');
    }

    public function sender()
    {
        return $this->belongsTo(Pengguna::class, 'id_sender', 'id_pengguna');
    }
}
