import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  MapPin,
  X,
  Check,
} from "lucide-react";
import { destinationService } from "@/features/admin/services/destinationService";

export default function DestinationModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen) {
      setName(editData?.nama_destinasi || "");
      setError("");
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Destination name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        const res = await destinationService.updateDestination(
          editData.id_destinasi,
          {
            nama_destinasi: name,
          }
        );

        if (res?.status !== "success") {
          throw new Error("Failed to update destination.");
        }
      } else {
        const res = await destinationService.createDestination({
          nama_destinasi: name,
        });

        if (res?.status !== "success") {
          throw new Error("Failed to add destination.");
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || err?.message || "Unable to save destination. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin
              size={18}
              className="text-emerald-700"
            />

            {isEdit
              ? "Edit Destination"
              : "Add Destination"}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Destination Name
          </label>

          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Mount Rinjani..."
          />

          {error && (
            <p className="text-xs text-red-500 mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
            onClick={handleSave}
          >
            <Check size={15} />

            {loading
              ? "Saving..."
              : isEdit
              ? "Save Changes"
              : "Add Destination"}
          </Button>
        </div>
      </div>
    </div>
  );
}
