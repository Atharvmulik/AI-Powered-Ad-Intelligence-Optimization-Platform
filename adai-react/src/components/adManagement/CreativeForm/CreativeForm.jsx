// ============================================================
// src/components/adManagement/CreativeForm/CreativeForm.jsx
// ============================================================

import CampaignDetailsSection from './CampaignDetailsSection'
import BudgetAndFormatSection from './BudgetAndFormatSection'
import CampaignDurationSection from './CampaignDurationSection'
import AudienceTagsSection from './AudienceTagsSection'
import CategoryKeywordsSection from './CategoryKeywordsSection'
import CreativeAssetUpload from './CreativeAssetUpload'
import ConfigurationSummary from './ConfigurationSummary'

export default function CreativeForm({
  onDeploy,
  deployLoading,
  campaignTitle,
  onCampaignTitleChange,
  dailyBudget,
  onDailyBudgetChange,
  adFormat,
  onAdFormatChange,
  bidStrategy,
  onBidStrategyChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  dateError,
  tags,
  onAddTag,
  onRemoveTag,
  showAddTag,
  onShowAddTagChange,
  newTagInput,
  onNewTagInputChange,
  tagAutocompleteSuggestions,
  tagValidationError,
  adCategory,
  onAdCategoryChange,
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  showKeywordInput,
  onShowKeywordInputChange,
  newKeywordInput,
  onNewKeywordInputChange,
  keywordSuggestions,
  durationDays,
  isDeployDisabled,
  onDiscardDraft,
}) {
  return (
    <div className="glass-card rounded-xl p-8 glow-indigo relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          <h3 className="font-title-lg text-title-lg text-on-surface">Create AI-Optimized Creative</h3>
        </div>
        <form className="grid grid-cols-2 gap-stack-lg" onSubmit={(e) => e.preventDefault()}>
          <CampaignDetailsSection
            campaignTitle={campaignTitle}
            onCampaignTitleChange={onCampaignTitleChange}
            dailyBudget={dailyBudget}
            onDailyBudgetChange={onDailyBudgetChange}
          />

          <BudgetAndFormatSection
            adFormat={adFormat}
            onAdFormatChange={onAdFormatChange}
            bidStrategy={bidStrategy}
            onBidStrategyChange={onBidStrategyChange}
          />

          <CampaignDurationSection
            startDate={startDate}
            onStartDateChange={onStartDateChange}
            endDate={endDate}
            onEndDateChange={onEndDateChange}
            dateError={dateError}
          />

          <AudienceTagsSection
            tags={tags}
            onRemoveTag={onRemoveTag}
            showAddTag={showAddTag}
            onShowAddTagChange={onShowAddTagChange}
            newTagInput={newTagInput}
            onNewTagInputChange={onNewTagInputChange}
            tagAutocompleteSuggestions={tagAutocompleteSuggestions}
            onAddTag={onAddTag}
            tagValidationError={tagValidationError}
          />

          <CategoryKeywordsSection
            adCategory={adCategory}
            onAdCategoryChange={onAdCategoryChange}
            keywords={keywords}
            onRemoveKeyword={onRemoveKeyword}
            showKeywordInput={showKeywordInput}
            onShowKeywordInputChange={onShowKeywordInputChange}
            newKeywordInput={newKeywordInput}
            onNewKeywordInputChange={onNewKeywordInputChange}
            onAddKeyword={onAddKeyword}
            keywordSuggestions={keywordSuggestions}
          />

          <CreativeAssetUpload />

          <ConfigurationSummary
            campaignTitle={campaignTitle}
            dailyBudget={dailyBudget}
            adFormat={adFormat}
            bidStrategy={bidStrategy}
            adCategory={adCategory}
            durationDays={durationDays}
            dateError={dateError}
            tagsCount={tags.length}
          />

          <div className="col-span-2 flex justify-end space-x-4 pt-4 border-t border-outline-variant mt-2">
            <button
              className="px-6 py-3 text-on-surface-variant font-bold hover:text-on-surface transition-all"
              type="reset"
              onClick={onDiscardDraft}
            >
              Discard Draft
            </button>
            // FIND this button and replace it:
            <button
              className={`bg-primary text-on-primary-container px-8 py-3 rounded-xl font-bold transition-transform shadow-lg shadow-primary/10 ${
                isDeployDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
              type="button"
              disabled={isDeployDisabled}
              onClick={onDeploy}
            >
              {deployLoading ? 'Deploying...' : 'Deploy Ad Intelligence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
