import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Hapus Pengguna?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Apakah Kamu yakin ingin menghapus <strong className="text-gray-800">{itemName}</strong>? Tindakan ini bersifat permanen dan seluruh data yang terkait akan ikut terhapus.
          </p>
          <div className="flex gap-3 justify-center w-full">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-foreground bg-card border border-gray-300 rounded-xl hover:bg-muted transition shadow-sm"
            >
              Batal
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-sm"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
