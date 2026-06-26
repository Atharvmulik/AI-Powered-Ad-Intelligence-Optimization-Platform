// ============================================================
// src/components/adManagement/CreativeForm/CreativeAssetUpload.jsx
// ============================================================

export default function CreativeAssetUpload() {
  return (
    <div className="col-span-2 space-y-2">
      <label className="text-label-md text-on-surface-variant">Creative Asset</label>
      <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary transition-all mb-2">
          cloud_upload
        </span>
        <p className="text-on-surface font-medium">
          Drag &amp; drop or <span className="text-primary">browse</span>
        </p>
        <p className="text-on-surface-variant text-xs mt-1">Supports AI scaling (PNG, JPG, MP4)</p>
      </div>
    </div>
  )
}
