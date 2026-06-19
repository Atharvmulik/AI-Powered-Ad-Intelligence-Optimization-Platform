import { useState, useEffect, useRef, useMemo } from 'react'

// Allowed audience tags list
const allowedAudienceTags = [
  'Gen-Z', 'Millennials', 'Urban Commuters', 'Tech Early Adopters', 'Sports Enthusiasts',
  'Gamers', 'Parents', 'Students', 'Professionals', 'High-Income', 'Budget-Conscious',
  'Mobile Users', 'Desktop Users', 'Night Owls', 'Weekend Shoppers'
]

export default function AdManagement() {
  // Gauge animation state
  const [gaugeOffset, setGaugeOffset] = useState(502.65)
  
  // Audience tags state
  const [tags, setTags] = useState(['Gen-Z', 'Urban Commuters', 'Tech Early Adopters'])
  const [newTagInput, setNewTagInput] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)
  const [tagValidationError, setTagValidationError] = useState('')

  // Real-time log terminal state
  const [logs, setLogs] = useState([
    { time: '14:02:11', type: 'INITIALIZING', msg: 'AdAI-Cluster-7v... Secure handshake successful.', color: 'text-on-surface' },
    { time: '14:02:15', type: 'SCANNING', msg: "creative asset 'Nike_AirMax_Q4.png' for brand compliance...", status: 'PASSED', statusColor: 'text-green-400', color: 'text-on-surface' },
    { time: '14:02:22', type: 'FRAUD_DETECTION:', msg: 'Blocked 142 suspicious IP range requests in Tokyo sector.', color: 'text-on-surface' },
    { time: '14:02:30', type: 'OPTIMIZATION:', msg: "Adjusted bid ceiling for 'Boat Airdopes' in local GMT+1 market.", color: 'text-on-surface' },
  ])
  const terminalEndRef = useRef(null)

  const phrases = useMemo(() => [
    { type: 'OPTIMIZATION:', msg: 'Shifted 10% budget towards mobile iOS devices.' },
    { type: 'FRAUD_DETECTION:', msg: 'Blocked suspicious traffic burst from node IP.202.12.x.' },
    { type: 'INGESTION:', msg: 'Synced active bid adjustments to all edge routers.' },
    { type: 'COMPLIANCE:', msg: 'Auto-flagged campaign Titan Smart for CTR anomaly.' },
    { type: 'INTELLIGENCE:', msg: 'Determined high CTR correlation with target "Solo Travelers".' }
  ], [])

  // New state variables for the form
  const [adFormat, setAdFormat] = useState('Banner')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [bidStrategy, setBidStrategy] = useState('CPC')
  const [adCategory, setAdCategory] = useState('Technology')
  const [keywords, setKeywords] = useState([])
  const [newKeywordInput, setNewKeywordInput] = useState('')
  const [showKeywordInput, setShowKeywordInput] = useState(false)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [dailyBudget, setDailyBudget] = useState('')



  // Predefined suggestions for keywords
  const keywordSuggestions = ['performance', 'lifestyle', 'premium', 'sale', 'new arrival', 'trending', 'limited edition']

  useEffect(() => {
    // Animate circular gauge ring on mount
    const timer = setTimeout(() => {
      setGaugeOffset(40.21) // 92% of 502.65
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-update terminal logs
    const id = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const phrase = phrases[Math.floor(Math.random() * phrases.length)]
      setLogs(prev => {
        const next = [...prev, { time, type: phrase.type, msg: phrase.msg, color: 'text-on-surface' }]
        return next.length > 15 ? next.slice(next.length - 15) : next
      })
    }, 4500)
    return () => clearInterval(id)
  }, [phrases])

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [logs])

  // Derive autocomplete suggestions from input (no effect needed)
  const tagAutocompleteSuggestions = useMemo(() => {
    if (newTagInput.trim()) {
      return allowedAudienceTags.filter(tag =>
        tag.toLowerCase().includes(newTagInput.toLowerCase())
      ).slice(0, 5)
    }
    return []
  }, [newTagInput])

  // Derive date validation from state (no effect needed)
  const dateError = useMemo(() => {
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        return 'End date must be after start date'
      }
    }
    return ''
  }, [startDate, endDate])

  const handleAddTag = (tagToAdd) => {
    const trimmedTag = tagToAdd.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (allowedAudienceTags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag])
        setNewTagInput('')
        setShowAddTag(false)
        setTagValidationError('')
      } else {
        setTagValidationError('Please select a valid audience segment')
      }
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleAddKeyword = (keywordToAdd) => {
    const trimmedKeyword = keywordToAdd.trim()
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      setKeywords([...keywords, trimmedKeyword])
      setNewKeywordInput('')
      setShowKeywordInput(false)
    }
  }

  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove))
  }

  const handleDiscardDraft = () => {
    setCampaignTitle('')
    setDailyBudget('')
    setAdFormat('Banner')
    setStartDate('')
    setEndDate('')
    setBidStrategy('CPC')
    setAdCategory('Technology')
    setKeywords([])
    setTags(['Gen-Z', 'Urban Commuters', 'Tech Early Adopters'])
    setShowAddTag(false)
    setShowKeywordInput(false)
    setNewTagInput('')
    setNewKeywordInput('')
    setTagValidationError('')
  }

  // Calculate duration in days
  const getDurationInDays = () => {
    if (startDate && endDate && !dateError) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return null
  }

  // Check if deploy button should be disabled
  const isDeployDisabled = () => {
    if (!campaignTitle.trim()) return true
    if (!dailyBudget || parseFloat(dailyBudget) === 0) return true
    if (tags.length === 0) return true
    if (!startDate || !endDate) return true
    if (dateError) return true
    return false
  }

  return (
    <div className="space-y-stack-lg">
      {/* Header title section */}
      <section className="flex justify-between items-end">
        <div>
          <p className="text-on-surface-variant font-body-md">Real-time intelligence and asset distribution across networks.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg flex items-center space-x-2 border border-outline-variant hover:bg-surface-bright transition-all">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filters</span>
          </button>
          <button className="bg-primary text-on-primary-container px-6 py-2 rounded-lg font-bold flex items-center space-x-2 active:scale-95 transition-transform shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add New Ad</span>
          </button>
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Ads Table & Form */}
        <div className="lg:col-span-8 space-y-stack-lg">
          {/* Active Ad Portfolio Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
              <h3 className="font-title-lg text-title-lg text-on-surface">Active Ad Portfolio</h3>
              <span className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-label-md">
                5 Active Items
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low text-on-surface-variant text-label-md">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Brand &amp; Ad Name</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">CTR</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Fraud Risk</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Engagement</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {/* Row 1 */}
                  <tr className="hover:bg-surface-container transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-white flex items-center justify-center p-1 overflow-hidden">
                          <img alt="Nike Logo" className="object-contain max-h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfTxLT3NQZb75pxZPqCgnuhERob8xS36QtPSsTMNMHQbd4Ltv0MDTpdqrJu7YOznHBujGZtnNaBcCllQVHQldIzOp7H-8EQNPfIzgkpmi6aNQvZ-c8tvF2yKmOlIN6XWBQXBh7zARyuuGATU8uSu-0itU2T7mRvMJ7i5AyWB5Qi1pz3NcMafXsJn_r0GiTarm3eo_wiC3NG_HPl7P-NQYgMZZARCPRD-h91_dVZtfhjR0MQuPSRVDGv0Wb_6OkexyYR676sElJpoof" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">Nike Air Max Pro</p>
                          <p className="text-on-surface-variant text-xs">Q4 Campaign - Lifestyle</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label-md text-primary">3.42%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded-full border border-green-500/30">Active</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-green-400">
                        <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                        <span className="text-xs">Low</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '82%' }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-white transition-all"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  {/* Row 2 */}
                  <tr className="hover:bg-surface-container transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center p-1 border border-outline-variant overflow-hidden">
                          <img alt="Boat Logo" className="object-contain max-h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD53NyOrVPvPYUXeI03S9w1gNTEkKZFaA7lesMntc7ibjb9sZ6f-Fr4ZUbmo5yE7QMd0n9cmp1AKYbZuZxxZnmAp7rk3zsaeAcv65hbyW0-1Fuw-dRFMTmYYbLGUvg_HYyRzN2tx654XnA2kEUUjrVmJ9MQMYTjpPrdV9_dlzEEEZhxFDua0elPXf6t0ZPQlJAo_B235cMse7-sUU6yG2pM8Gupf7hdvFFNbYubIPp42BIaUfqLABnI2KHB-xRm9Cz1b4SlZa0dfxwl" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">Boat Airdopes X</p>
                          <p className="text-on-surface-variant text-xs">Music Streamers - Top Funnel</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label-md text-primary">2.18%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">Paused</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-yellow-400">
                        <span className="material-symbols-outlined text-[16px] mr-1">report</span>
                        <span className="text-xs">Medium</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '45%' }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-white transition-all"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  {/* Row 3 */}
                  <tr className="hover:bg-surface-container transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center p-1 border border-outline-variant overflow-hidden">
                          <img alt="Watch Logo" className="object-contain max-h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK-jxmOqz4ttH93wbatxbRv5lM82youScL4TOufBwFJgKBk9856VJGmt3XUBiYvbzZfcOUNU3Xi7MpXsCfmEij26ttp6-k166w8n8TWsFWkWQdOwhGucjkJLXyJDDXO23ZSjOUracAlr10nCLBc8dRzLqoR1Sm9EHJ-Zb-FWGP_z3we-cKHhT_MIPVCQUOXQBvZrLtB0-WupjDrEE2ue-JF8OgxTSQqPfqWi8wUKrD02nj2FStDI1iibs4cgncdclhu9Nw7oGfKS16" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">Titan Smart v2</p>
                          <p className="text-on-surface-variant text-xs">Tech Enthusiasts</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label-md text-primary">4.12%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded-full border border-green-500/30">Active</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-green-400">
                        <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                        <span className="text-xs">Low</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '91%' }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-white transition-all"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  {/* Row 4 */}
                  <tr className="hover:bg-surface-container transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center p-1 border border-outline-variant text-primary">
                          <span className="material-symbols-outlined">devices</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">Apple iPad Promo</p>
                          <p className="text-on-surface-variant text-xs">Back to School 2024</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label-md text-primary">0.89%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded-full border border-red-500/30">Halted</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-red-400">
                        <span className="material-symbols-outlined text-[16px] mr-1">gpp_bad</span>
                        <span className="text-xs">Critical</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '12%' }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-white transition-all"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  {/* Row 5 */}
                  <tr className="hover:bg-surface-container transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center p-1 border border-outline-variant text-primary">
                          <span className="material-symbols-outlined">local_cafe</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">Starbucks Rewards</p>
                          <p className="text-on-surface-variant text-xs">Loyalty Program Blast</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label-md text-primary">2.91%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded-full border border-green-500/30">Active</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-green-400">
                        <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                        <span className="text-xs">Low</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '68%' }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-white transition-all"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Ad Form */}
          <div className="glass-card rounded-xl p-8 glow-indigo relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="font-title-lg text-title-lg text-on-surface">Create AI-Optimized Creative</h3>
              </div>
              <form className="grid grid-cols-2 gap-stack-lg" onSubmit={(e) => e.preventDefault()}>
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-label-md text-on-surface-variant">Campaign Title</label>
                  <input
                    className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
                    placeholder="e.g. Winter Performance Boost"
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                  />
                </div>
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-label-md text-on-surface-variant">Daily Budget (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                    <input
                      className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
                      placeholder="0.00"
                      type="number"
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(e.target.value)}
                    />
                  </div>
                </div>

                {/* CHANGE 1: Ad Format selector */}
                <div className="col-span-2 space-y-2">
                  <label className="text-label-md text-on-surface-variant">Ad Format</label>
                  <div className="flex gap-3">
                    {['Banner', 'Video', 'Native'].map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setAdFormat(format)}
                        className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                          adFormat === format
                            ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-surface-bright'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CHANGE 2: Campaign date range */}
                <div className="col-span-2 space-y-2">
                  <label className="text-label-md text-on-surface-variant">Campaign Duration</label>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-on-surface-variant">Start Date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-on-surface-variant">End Date</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
                      />
                    </div>
                  </div>
                  {dateError && <p className="text-red-400 text-xs mt-1">{dateError}</p>}
                </div>

                {/* CHANGE 3: Bid Strategy selector */}
                <div className="col-span-2 space-y-2">
                  <label className="text-label-md text-on-surface-variant">Bid Strategy</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'CPC', subtitle: 'Per Click' },
                      { value: 'CPM', subtitle: 'Per 1,000 Impressions' },
                      { value: 'CPA', subtitle: 'Per Action' }
                    ].map((strategy) => (
                      <button
                        key={strategy.value}
                        type="button"
                        onClick={() => setBidStrategy(strategy.value)}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all flex flex-col items-center ${
                          bidStrategy === strategy.value
                            ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-surface-bright'
                        }`}
                      >
                        <span>{strategy.value}</span>
                        <span className="text-[10px] opacity-70">{strategy.subtitle}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Audience Tags with validation and autocomplete */}
                <div className="col-span-2 space-y-2">
                  <label className="text-label-md text-on-surface-variant">Target Audience Tags</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-surface-container-lowest border border-outline-variant rounded-lg items-center">
                    {tags.map((tag) => (
                      <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded text-xs flex items-center space-x-2 border border-primary/20">
                        <span>{tag}</span>
                        <span
                          className="material-symbols-outlined text-[14px] cursor-pointer hover:text-white"
                          onClick={() => handleRemoveTag(tag)}
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
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (tagAutocompleteSuggestions.length > 0) {
                                handleAddTag(tagAutocompleteSuggestions[0])
                              } else {
                                handleAddTag(newTagInput)
                              }
                            }
                            if (e.key === 'Escape') setShowAddTag(false)
                          }}
                        />
                        {tagAutocompleteSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                            {tagAutocompleteSuggestions.map((suggestion) => (
                              <div
                                key={suggestion}
                                className="px-3 py-2 text-xs text-on-surface hover:bg-surface-bright cursor-pointer"
                                onClick={() => handleAddTag(suggestion)}
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
                        onClick={() => setShowAddTag(true)}
                      >
                        <span className="material-symbols-outlined text-[14px] mr-1">add_circle</span> Add Segment
                      </button>
                    )}
                  </div>
                  {tagValidationError && <p className="text-red-400 text-xs mt-1">{tagValidationError}</p>}
                </div>

                {/* CHANGE 4: Ad Category and Keywords */}
                <div className="col-span-2 space-y-2">
                  <div className="flex gap-4">
                    <div className="w-2/5 space-y-1">
                      <label className="text-label-md text-on-surface-variant">Ad Category</label>
                      <select
                        value={adCategory}
                        onChange={(e) => setAdCategory(e.target.value)}
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
                              onClick={() => handleRemoveKeyword(keyword)}
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
                            onChange={(e) => setNewKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddKeyword(newKeywordInput)
                              }
                              if (e.key === 'Escape') setShowKeywordInput(false)
                            }}
                          />
                        ) : (
                          <button
                            className="text-primary text-xs hover:underline flex items-center ml-1"
                            type="button"
                            onClick={() => setShowKeywordInput(true)}
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
                            onClick={() => handleAddKeyword(suggestion)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Creative Asset (unchanged) */}
                <div className="col-span-2 space-y-2">
                  <label className="text-label-md text-on-surface-variant">Creative Asset</label>
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary transition-all mb-2">cloud_upload</span>
                    <p className="text-on-surface font-medium">Drag &amp; drop or <span className="text-primary">browse</span></p>
                    <p className="text-on-surface-variant text-xs mt-1">Supports AI scaling (PNG, JPG, MP4)</p>
                  </div>
                </div>

                {/* CHANGE 6: Form state summary strip */}
                <div className="col-span-2 flex flex-wrap gap-2 items-center py-2 px-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                  <span className="text-xs text-on-surface-variant mr-1">Current config:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${campaignTitle ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                    Title: {campaignTitle || 'missing'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${dailyBudget && parseFloat(dailyBudget) > 0 ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                    Budget: ${dailyBudget || '0'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Format: {adFormat}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Strategy: {bidStrategy}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Category: {adCategory}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getDurationInDays() !== null && !dateError ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                    Duration: {getDurationInDays() !== null && !dateError ? `${getDurationInDays()} days` : 'invalid'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tags.length > 0 ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                    Tags: {tags.length}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end space-x-4 pt-4 border-t border-outline-variant mt-2">
                  <button className="px-6 py-3 text-on-surface-variant font-bold hover:text-on-surface transition-all" type="reset" onClick={handleDiscardDraft}>Discard Draft</button>
                  <button 
                    className={`bg-primary text-on-primary-container px-8 py-3 rounded-xl font-bold transition-transform shadow-lg shadow-primary/10 ${isDeployDisabled() ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`} 
                    type="submit"
                    disabled={isDeployDisabled()}
                  >
                    Deploy Ad Intelligence
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Stats */}
        <aside className="lg:col-span-4 space-y-stack-lg">
          {/* Performance Score (Circular Gauge) */}
          <div className="glass-card rounded-xl p-6 text-center flex flex-col items-center justify-center">
            <h3 className="text-label-md uppercase tracking-widest text-on-surface-variant mb-6">Network Health Score</h3>
            <div className="relative w-48 h-48 flex items-center justify-center mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" fill="transparent" r="80" stroke="#1e1e2e" strokeWidth="12"></circle>
                <circle
                  className="gauge-ring"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="80"
                  stroke="#c0c1ff"
                  strokeDasharray="502.65"
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  strokeWidth="12"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display-lg text-display-lg text-primary">92</span>
                <span className="text-label-md text-on-surface-variant">Optimum</span>
              </div>
            </div>
            <p className="text-body-md text-on-surface italic">"Ad relevance is at peak efficiency for 84% of clusters."</p>
          </div>

          {/* AI Targeting Suggestions */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="bg-primary/10 p-4 border-b border-primary/20 flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <h3 className="font-bold text-primary text-body-md">AI Optimization Feed</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="material-symbols-outlined text-tertiary mt-1">groups</span>
                  <div>
                    <p className="text-on-surface font-bold text-body-md">Audience Expansion</p>
                    <p className="text-on-surface-variant text-xs">High affinity detected in 'Solo Travelers' (Europe). Re-targeting recommended.</p>
                  </div>
                </div>
                <button className="w-full text-center text-xs py-2 bg-surface-container-high rounded border border-outline-variant text-on-surface hover:bg-surface-bright transition-all">Apply Recommendation</button>
              </div>
              <div className="border-t border-outline-variant pt-6 space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="material-symbols-outlined text-green-400 mt-1">smartphone</span>
                  <div>
                    <p className="text-on-surface font-bold text-body-md">Device Optimization</p>
                    <p className="text-on-surface-variant text-xs">Mobile conversion rate up 12%. Shift 15% budget from Desktop to iOS-specific pools.</p>
                  </div>
                </div>
                <button className="w-full text-center text-xs py-2 bg-surface-container-high rounded border border-outline-variant text-on-surface hover:bg-surface-bright transition-all">Adjust Allocation</button>
              </div>
              <div className="border-t border-outline-variant pt-6 space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="material-symbols-outlined text-blue-400 mt-1">schedule</span>
                  <div>
                    <p className="text-on-surface font-bold text-body-md">Prime Time Burst</p>
                    <p className="text-on-surface-variant text-xs">Peak engagement expected between 18:00 - 21:00 UTC. Trigger auto-bid increase.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-on-surface-variant bg-surface-container-lowest p-2 rounded italic">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  <span>Automation scheduled for next cycle.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Status Overview (Donut) */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-6">Global Status</h3>
            <div className="flex items-center justify-between">
              <div className="w-32 h-32 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#571bc1" strokeDasharray="251.32" strokeDashoffset="62.83" strokeWidth="14"></circle>
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#c0c1ff" strokeDasharray="251.32" strokeDashoffset="150.79" strokeWidth="14"></circle>
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#34343c" strokeDasharray="251.32" strokeDashoffset="226.18" strokeWidth="14"></circle>
                </svg>
              </div>
              <div className="space-y-2 flex-1 pl-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-xs text-on-surface-variant">Running</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">64%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-secondary-container"></span>
                    <span className="text-xs text-on-surface-variant">Paused</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">24%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-surface-container-highest"></span>
                    <span className="text-xs text-on-surface-variant">Expired</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">12%</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Real-Time Logs (Terminal Console) */}
      <section className="glass-card rounded-xl overflow-hidden bg-[#050507] border-l-4 border-l-primary">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="ml-4 font-label-md text-on-surface-variant opacity-75 uppercase tracking-widest text-[10px]">Real-Time AI Analysis Log</span>
          </div>
          <span className="text-[10px] font-label-md text-primary status-pulse">SYSTEM ONLINE</span>
        </div>
        <div ref={terminalEndRef} className="p-6 h-36 overflow-y-auto font-label-md text-primary text-[12px] space-y-1 font-mono">
          {logs.map((log, index) => (
            <p key={index}>
              <span className="opacity-40">[{log.time}]</span>{' '}
              <span className="text-on-surface">{log.type}</span>{' '}
              {log.msg}{' '}
              {log.status && <span className={log.statusColor}>{log.status}</span>}
            </p>
          ))}
          <div className="flex items-center space-x-1">
            <span className="opacity-40">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
            <span className="text-on-surface">LISTENING</span>
            <span className="terminal-cursor"></span>
          </div>
        </div>
      </section>
    </div>
  )
}