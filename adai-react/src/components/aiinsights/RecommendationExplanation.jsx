// src/components/aiinsights/RecommendationExplanation.jsx
// Static recommendation explanation card — Nike shoes example.

export default function RecommendationExplanation() {
  return (
    <section className="col-span-12 lg:col-span-7 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg">
      <div className="flex items-center mb-6">
        <span
          className="material-symbols-outlined text-primary mr-3"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          lightbulb
        </span>
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
          Recommendation Explanation
        </h3>
      </div>

      <div className="flex flex-col md:flex-row gap-gutter">
        {/* Ad thumbnail */}
        <div className="w-full md:w-1/3 shrink-0">
          <div className="aspect-square bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden relative group">
            <img
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQisxDyiqldwdfnHTc9168E7MJJZQU0YfsVNOA1JeYOZ50lRMIwEzOQuTJACVpO305PY89MR8UxQtMOxsV5cT3brLUEY4gnpxKc9uuhvMY8vSg35lfPgIgAfgvotDlBEVg69EutWzxJB3KxOTzPfVzl6apE9Mi25W5phTkcWf7X0-kkLuuumL8ggT_g4AiI253kxSiyXFkHMudL7QvTwb5HJ0pCBbfHd1gcSMZLZ6tPqafpOReDYxpxVqNingp94Wxe5XwlWaFbnEo"
              alt="Nike shoes ad"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3">
              <p className="text-label-md font-bold text-on-surface">Nike Shoes</p>
              <p className="text-[10px] text-primary">Target: Performance</p>
            </div>
          </div>
        </div>

        {/* Explanation points */}
        <div className="flex-1 space-y-4">
          <p className="text-title-lg text-on-surface font-semibold">
            Why was "Nike Shoes" recommended?
          </p>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-green-500 text-sm mt-1 mr-2">check_circle</span>
              <p className="text-body-md text-on-surface-variant">
                <span className="text-on-surface font-bold">Similarity:</span>{' '}
                89% match with previously purchased 'Jordan High-Tops'.
              </p>
            </div>
            <div className="flex items-start">
              <span className="material-symbols-outlined text-green-500 text-sm mt-1 mr-2">check_circle</span>
              <p className="text-body-md text-on-surface-variant">
                <span className="text-on-surface font-bold">Context:</span>{' '}
                User recently searched for "marathon training gear".
              </p>
            </div>
            <div className="flex items-start">
              <span className="material-symbols-outlined text-green-500 text-sm mt-1 mr-2">check_circle</span>
              <p className="text-body-md text-on-surface-variant">
                <span className="text-on-surface font-bold">Social Proof:</span>{' '}
                4.2x higher conversion rate in 'Professional Runner' segment.
              </p>
            </div>
            <div className="flex items-start">
              <span className="material-symbols-outlined text-primary text-sm mt-1 mr-2">info</span>
              <p className="text-body-md text-on-surface-variant">
                <span className="text-on-surface font-bold">Confidence:</span>{' '}
                Model predicted 0.82 purchase probability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}