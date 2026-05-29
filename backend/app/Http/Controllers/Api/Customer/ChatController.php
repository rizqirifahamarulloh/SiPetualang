<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // Get all conversations for current user
    public function getConversations()
    {
        $conversations = Conversation::where('id_user_a', Auth::id())
            ->orWhere('id_user_b', Auth::id())
            ->with(['userA', 'userB'])
            ->orderBy('last_message_at', 'desc')
            ->get();

        foreach ($conversations as $conv) {
            $lastMessage = Message::where('id_conversation', $conv->id_conversation)
                ->latest()
                ->first();

            $conv->last_message = $lastMessage?->message;
            $conv->last_message_time = $lastMessage?->created_at;

            $conv->unread_count = Message::where('id_conversation', $conv->id_conversation)
                ->where('id_sender', '!=', Auth::id())
                ->where('is_read', false)
                ->count();
        }

        return response()->json([
            'success' => true,
            'data' => $conversations
        ]);
    }

    // Get available customers for starting new chat (SEMUA CUSTOMER LAIN)
    public function getAvailableCustomers()
    {
        // Ambil semua customer kecuali diri sendiri
        $customers = Pengguna::where('peran_pengguna', 'customer')
            ->where('id_pengguna', '!=', Auth::id())
            ->select('id_pengguna', 'nama', 'email', 'kota', 'no_telp')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    // Get or create conversation with another user
    public function getOrCreateConversation($userId)
    {
        $otherUser = Pengguna::find($userId);

        if (!$otherUser) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        // Cari existing conversation
        $conversation = Conversation::where(function($q) use ($userId) {
            $q->where('id_user_a', Auth::id())->where('id_user_b', $userId);
        })->orWhere(function($q) use ($userId) {
            $q->where('id_user_a', $userId)->where('id_user_b', Auth::id());
        })->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'id_user_a' => Auth::id(),
                'id_user_b' => $userId,
                'last_message_at' => now()
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $conversation->load(['userA', 'userB'])
        ]);
    }

    // Get messages in a conversation
    public function getMessages($conversationId)
    {
        $conversation = Conversation::where('id_conversation', $conversationId)
            ->where(function($q) {
                $q->where('id_user_a', Auth::id())->orWhere('id_user_b', Auth::id());
            })
            ->first();

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found'
            ], 404);
        }

        $messages = Message::where('id_conversation', $conversationId)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark unread messages as read
        Message::where('id_conversation', $conversationId)
            ->where('id_sender', '!=', Auth::id())
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation->load(['userA', 'userB']),
                'messages' => $messages
            ]
        ]);
    }

    // Send message
    public function sendMessage(Request $request)
    {
        $request->validate([
            'id_conversation' => 'required|exists:conversations,id_conversation',
            'message' => 'required|string|max:1000'
        ]);

        $conversation = Conversation::find($request->id_conversation);

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found'
            ], 404);
        }

        // Verify user is part of conversation
        if ($conversation->id_user_a != Auth::id() && $conversation->id_user_b != Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $message = Message::create([
            'id_conversation' => $request->id_conversation,
            'id_sender' => Auth::id(),
            'message' => $request->message,
            'is_read' => false
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => $message->load('sender')
        ], 201);
    }
}
