import { ShieldAlert, X, ChevronRight, Clock, ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function KtpVerificationModal({ isOpen, onClose, status }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getStatusDetails = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="w-12 h-12 text-amber-500 animate-pulse" />,
          title: "Verifikasi Sedang Diproses",
          description: "Dokumen KTP Anda telah berhasil diunggah dan sedang dalam antrean peninjauan oleh Admin. Harap tunggu persetujuan admin untuk melanjutkan penyewaan.",
          badge: "Menunggu Persetujuan",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
          actionText: "Lihat Status Verifikasi"
        };
      case "ditolak":
        return {
          icon: <ShieldX className="w-12 h-12 text-red-500" />,
          title: "Verifikasi KTP Ditolak",
          description: "Mohon maaf, pengajuan verifikasi KTP Anda sebelumnya ditolak oleh admin. Silakan periksa kembali foto KTP dan foto selfie Anda untuk mengajukan ulang.",
          badge: "Verifikasi Ditolak",
          badgeClass: "bg-red-100 text-red-800 border-red-200",
          actionText: "Verifikasi Ulang"
        };
      default:
        return {
          icon: <ShieldAlert className="w-12 h-12 text-emerald-600 animate-bounce" />,
          title: "Verifikasi KTP Diperlukan",
          description: "Untuk alasan keamanan dan kenyamanan bertransaksi di SiPetualang, Anda diwajibkan melakukan verifikasi identitas (KTP) sebelum dapat menyewa barang.",
          badge: "Belum Terverifikasi",
          badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
          actionText: "Verifikasi Sekarang"
        };
    }
  };

  const details = getStatusDetails();

  const handleAction = () => {
    onClose();
    navigate("/customer/verification");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 transform transition-all scale-100 flex flex-col items-center text-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Status Icon */}
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-4 mt-2">
          {details.icon}
        </div>

        {/* Badge */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${details.badgeClass}`}>
          {details.badge}
        </span>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {details.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-500 dark:text-zinc-400 mb-6 px-2">
          {details.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1 border-gray-200 dark:border-zinc-700 font-semibold"
          >
            Nanti Saja
          </Button>
          <Button
            onClick={handleAction}
            className="flex-1 order-1 sm:order-2 bg-[#00A779] hover:bg-[#008f68] text-white font-semibold flex items-center justify-center gap-1.5"
          >
            {details.actionText}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
