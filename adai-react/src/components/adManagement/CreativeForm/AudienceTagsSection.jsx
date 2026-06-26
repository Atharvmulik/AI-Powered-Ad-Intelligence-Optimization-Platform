// ============================================================
// src/components/adManagement/CreativeForm/AudienceTagsSection.jsx
// ============================================================

export default function AudienceTagsSection({
  tags,
  onRemoveTag,
  showAddTag,
  onShowAddTagChange,
  newTagInput,
  onNewTagInputChange,
  tagAutocompleteSuggestions,
  onAddTag,
  tagValidationError,
}) {
  return (
    <div className="col-span-2 space-y-2">
      <label className="text-label-md text-on-surface-variant">Target Audience Tags</label>
      <div className="flex flex-wrap gap-2 p-3 bg-surface-container-lowest border border-outline-variant rounded-lg items-center">
        {tags.map((tag) => (
          <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded text-xs flex items-center space-x-2 border border-primary/20">
            <span>{tag}</span>
            <span
              className="material-symbols-outlined text-[14px] cursor-pointer hover:text-white"
              onClick={() => onRemoveTag(tag)}
            >
              close
            </span>
          </span>
        ))}
        {showAddTag ? (
          <div className="relative flex-1">
            <input
              autoFocus
              className="bg-surface-container-high border border-outline-variant text-xs text-on-surface rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-full"
              placeholder="Search audience segment..."
              type="text"
              value={newTagInput}
              onChange={(e) => onNewTagInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (tagAutocompleteSuggestions.length > 0) {
                    onAddTag(tagAutocompleteSuggestions[0])
                  } else {
                    onAddTag(newTagInput)
                  }
                }
                if (e.key === 'Escape') onShowAddTagChange(false)
              }}
            />
            {tagAutocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {tagAutocompleteSuggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="px-3 py-2 text-xs text-on-surface hover:bg-surface-bright cursor-pointer"
                    onClick={() => onAddTag(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            className="text-primary text-xs hover:underline flex items-center ml-2"
            type="button"
            onClick={() => onShowAddTagChange(true)}
          >
            <span className="material-symbols-outlined text-[14px] mr-1">add_circle</span> Add Segment
          </button>
        )}
      </div>
      {tagValidationError && <p className="text-red-400 text-xs mt-1">{tagValidationError}</p>}
    </div>
  )
}
