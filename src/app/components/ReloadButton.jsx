"use client";

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      🔄 Refresh Page
    </button>
  );
}
