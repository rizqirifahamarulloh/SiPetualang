import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Trash2 } from "lucide-react";
import { categoryService } from "../../services/categoryService";

export default function DeleteCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  item,
  categoryList,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !item) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      await categoryService.deleteCategory(item.id_kategori);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2
            size={28}
            className="text-red-500"
          />
        </div>

        <h2 className="text-xl font-bold mb-2">
          Delete Category?
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Category{" "}
          <strong>{item.nama_kategori}</strong> will
          be deleted.
        </p>

        {error && (
          <p className="text-xs text-red-500 mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
