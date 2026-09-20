export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', confirmStyle = 'bg-[#D94A5A]', onConfirm, onCancel, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="bg-[#151116] border border-[#5A1020]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#F5F1F2]">{title}</h3>
        <p className="text-sm text-[#A8A0A3] leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#5A1020]/20">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-[#A8A0A3] hover:text-[#F5F1F2] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl transition disabled:opacity-50 shadow-md ${confirmStyle}`}
          >
            {loading ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
