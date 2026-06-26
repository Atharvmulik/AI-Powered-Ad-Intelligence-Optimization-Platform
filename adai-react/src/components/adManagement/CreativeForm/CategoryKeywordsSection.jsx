// ============================================================
// src/components/adManagement/CreativeForm/CategoryKeywordsSection.jsx
// ============================================================

export default function CategoryKeywordsSection({
  adCategory,
  onAdCategoryChange,
  keywords,
  onRemoveKeyword,
  showKeywordInput,
  onShowKeywordInputChange,
  newKeywordInput,
  onNewKeywordInputChange,
  onAddKeyword,
  keywordSuggestions,
}) {
  return (
    <div className="col-span-2 space-y-2">
      <div className="flex gap-4">
        <div className="w-2/5 space-y-1">
          <label className="text-label-md text-on-surface-variant">Ad Category</label>
          <select
            value={adCategory}
            onChange={(e) => onAdCategoryChange(e.target.value)}
            className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
          >
            <option>Technology</option>
            <option>Sports & Fitness</option>
            <option>Fashion & Lifestyle</option>
            <option>Food & Beverage</option>
            <option>Finance</option>
            <option>Gaming</option>
            <option>Travel</option>
            <option>Health & Wellness</option>
            <option>Automotive</option>
            <option>Education</option>
          </select>
        </div>
        <div className="w-3/5 space-y-1">
          <label className="text-label-md text-on-surface-variant">Keywords</label>
          <div className="flex flex-wrap gap-2 p-2 bg-surface-container-lowest border border-outline-variant rounded-lg items-center min-h-[52px]">
            {keywords.map((keyword) => (
              <span key={keyword} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs flex items-center space-x-1 border border-primary/20">
                <span>{keyword}</span>
                <span
                  className="material-symbols-outlined text-[12px] cursor-pointer hover:text-white"
                  onClick={() => onRemoveKeyword(keyword)}
                >
                  close
                </span>
              </span>
            ))}
            {showKeywordInput ? (
              <input
                autoFocus
                className="bg-surface-container-high border border-outline-variant text-xs text-on-surface rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Type and press Enter..."
                type="text"
                value={newKeywordInput}
                onChange={(e) => onNewKeywordInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddKeyword(newKeywordInput)
                  }
                  if (e.key === 'Escape') onShowKeywordInputChange(false)
                }}
              />
            ) : (
              <button
                className="text-primary text-xs hover:underline flex items-center ml-1"
                type="button"
                onClick={() => onShowKeywordInputChange(true)}
              >
                <span className="material-symbols-outlined text-[14px] mr-0.5">add</span> Add
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {keywordSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onAddKeyword(suggestion)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
