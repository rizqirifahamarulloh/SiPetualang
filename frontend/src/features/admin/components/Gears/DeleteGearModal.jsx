import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DeleteGearModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hapus Alat?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Apakah kamu yakin ingin menghapus <strong className="text-gray-800">{itemName}</strong>? Tindakan ini bersifat permanen dan seluruh data yang terkait akan ikut terhapus.
          </p>
          <div className="flex gap-3 justify-center w-full">
            <button onClick={onClose} className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              Batal
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition">
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
