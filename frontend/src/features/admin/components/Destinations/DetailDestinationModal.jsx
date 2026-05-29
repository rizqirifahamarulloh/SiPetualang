import { Button } from "@/components/ui/button";

import {
  MapPin,
  Eye,
  Edit,
  X,
  Map,
} from "lucide-react";

export default function DetailDestinationModal({
  isOpen,
  onClose,
  onEdit,
  item,
}) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Eye
                size={18}
                className="text-emerald-700"
              />
            </div>

            <div>
              <h2 className="font-bold text-lg">
                Destination Detail
              </h2>

              <p className="text-xs text-muted-foreground">
                Detail information destination
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Destination */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <MapPin
                size={30}
                className="text-emerald-600"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Destination Name
              </p>

              <h3 className="text-2xl font-bold">
                {item.nama_destinasi}
              </h3>
            </div>
          </div>

          {/* Stats */}
          <div className="border rounded-xl p-4 bg-muted/20">
            <div className="flex items-center gap-2 mb-1">
              <Map
                size={14}
                className="text-blue-600"
              />

              <p className="text-xs text-muted-foreground">
                Destination ID
              </p>
            </div>

            <h4 className="font-bold text-lg">
              #{item.id_destinasi}
            </h4>
          </div>

          {/* Description */}
          <div className="border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Description
            </p>

            <p className="text-sm leading-relaxed text-gray-700">
              This destination is available for hiking, camping, and outdoor activities.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/10">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
            onClick={() => onEdit(item)}
          >
            <Edit size={15} />
            Edit Destination
          </Button>
        </div>
      </div>
    </div>
  );
}
