import React, { useState, useEffect } from 'react';
import {
  Globe,
  Layout,
  Save,
  RotateCcw,
  Sparkles,
  Megaphone,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Smartphone,
  Phone,
  MessageSquare,
  Shield,
  Car,
  Users,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Clock,
  Compass,
  Zap,
  MapPin,
  Check,
  Star,
  Monitor,
  Tablet,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Link,
  Navigation
} from 'lucide-react';
import {
  WebsiteCmsConfig,
  DEFAULT_WEBSITE_CMS_CONFIG,
  WebsiteFeatureItem,
  WebsiteServiceCard,
  WebsiteTestimonial,
  WebsiteFaqItem,
} from '../../types/websiteCms';
import { SomalilandFlag } from '../Common/SomalilandFlag';

interface WebsiteCmsManagerProps {
  onPreviewWebsite?: () => void;
}

export const WebsiteCmsManager: React.FC<WebsiteCmsManagerProps> = ({ onPreviewWebsite }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'hero' | 'announcement' | 'navbar' | 'services' | 'features' | 'stats' | 'calculator' | 'faqs' | 'testimonials' | 'contact' | 'footer' | 'seo' | 'live_preview'
  >('hero');

  const [cmsConfig, setCmsConfig] = useState<WebsiteCmsConfig>(() => {
    try {
      const saved = localStorage.getItem('wadaage_website_cms_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WEBSITE_CMS_CONFIG;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Load from API / Firestore on mount
  useEffect(() => {
    const loadCms = async () => {
      try {
        const res = await fetch('/api/website/cms-config');
        if (res.ok) {
          const data = await res.json();
          if (data && data.hero) {
            setCmsConfig((prev) => ({ ...prev, ...data }));
            try {
              localStorage.setItem('wadaage_website_cms_config', JSON.stringify(data));
            } catch {}
          }
        }
      } catch {}
    };
    loadCms();
  }, []);

  const triggerCopyToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const updatedConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Admin Command Center',
    };

    try {
      // 1. LocalStorage
      localStorage.setItem('wadaage_website_cms_config', JSON.stringify(updatedConfig));

      // 2. Server API
      await fetch('/api/website/cms-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      }).catch(() => {});

      // 3. Broadcast to all open tabs and iframe windows
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const ch = new BroadcastChannel('wadaage_events_channel');
          ch.postMessage({ type: 'CMS_CONFIG_UPDATED', payload: updatedConfig });
          ch.close();
        } catch {}
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Error saving CMS configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Ma hubtaa inaad dib ugu celiso xogta website-ka sidii hore (Default Official Settings)?')) {
      setCmsConfig(DEFAULT_WEBSITE_CMS_CONFIG);
      localStorage.setItem('wadaage_website_cms_config', JSON.stringify(DEFAULT_WEBSITE_CMS_CONFIG));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const subTabs = [
    { id: 'hero' as const, label: '1. Hero & Headlines', icon: Sparkles },
    { id: 'announcement' as const, label: '2. Top Announcement Bar', icon: Megaphone },
    { id: 'navbar' as const, label: '3. Navbar & Portals', icon: Navigation },
    { id: 'services' as const, label: '4. Transport Services & Rates', icon: Car },
    { id: 'features' as const, label: '5. Core Features', icon: Layout },
    { id: 'stats' as const, label: '6. Live Stats & Metrics', icon: TrendingUp },
    { id: 'calculator' as const, label: '7. Fare Calculator', icon: Compass },
    { id: 'faqs' as const, label: '8. FAQs (Su’aalaha)', icon: HelpCircle },
    { id: 'testimonials' as const, label: '9. Customer Reviews', icon: Users },
    { id: 'contact' as const, label: '10. Contact & Socials', icon: Phone },
    { id: 'footer' as const, label: '11. Footer & Copyright', icon: Layers },
    { id: 'seo' as const, label: '12. SEO & Google SERP', icon: Search },
    { id: 'live_preview' as const, label: '📱 Live Simulator', icon: Eye, badge: 'Live' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 text-white space-y-5 shadow-2xl animate-in fade-in duration-150">
      {/* Top Header & Master Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-emerald-600 to-teal-400 text-white flex items-center justify-center font-black shadow-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Welcome Website CMS & Full Page Editor
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  wadaage.com
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full visual and content management: Modify headlines, announcements, rates, FAQs, reviews, and SEO in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onPreviewWebsite && (
            <button
              type="button"
              onClick={onPreviewWebsite}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Open wadaage.com ↗</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer flex items-center gap-1.5"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Waa La Daabacay (Published)!</span>
              </>
            ) : isSaving ? (
              <span>Daabacayaa (Saving)...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Daabac Toos (Publish Live)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {copiedNotification && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Sub-Tabs Scrollable Navigation Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs scrollbar-thin">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black ring-2 ring-blue-400/40'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-emerald-400 text-slate-950 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ml-1">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: HERO SECTION & BRANDING
         ========================================================= */}
      {activeSubTab === 'hero' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <h3 className="font-extrabold text-sm text-blue-400 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Cinwaannada Qaybta Sare (Hero Headlines & Subtitles)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Bilingual Support (Somali & English)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Cinwaanka Weyn (Headline - Somali):
                </label>
                <input
                  type="text"
                  value={cmsConfig.hero.headlineSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, headlineSo: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Cinwaanka Weyn (Headline - English):
                </label>
                <input
                  type="text"
                  value={cmsConfig.hero.headlineEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, headlineEn: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Sharaxaadda Kooban (Subtitle - Somali):
                </label>
                <textarea
                  rows={3}
                  value={cmsConfig.hero.subtitleSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, subtitleSo: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Sharaxaadda Kooban (Subtitle - English):
                </label>
                <textarea
                  rows={3}
                  value={cmsConfig.hero.subtitleEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, subtitleEn: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Badges & Button Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-700/80">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Badge Text (Somali):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.badgeTextSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, badgeTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Badge Text (English):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.badgeTextEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, badgeTextEn: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Primary Button (Rider):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.ctaButtonTextSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, ctaButtonTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Secondary Button (Driver):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.secondaryButtonTextSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, secondaryButtonTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {/* Toggle Smartphone Mockup */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-700/80">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-bold text-xs">
                  Muuji 3D Smartphone Radar Mockup-ka Tooska ah ee Qaybta Sare
                </span>
              </div>
              <input
                type="checkbox"
                checked={cmsConfig.hero.showLiveMockup}
                onChange={(e) =>
                  setCmsConfig({
                    ...cmsConfig,
                    hero: { ...cmsConfig.hero, showLiveMockup: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: ANNOUNCEMENT BANNER
         ========================================================= */}
      {activeSubTab === 'announcement' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-emerald-400 flex items-center space-x-2">
                <Megaphone className="w-4 h-4" />
                <span>Xayeysiiska Sare (Top Promotional Announcement Bar)</span>
              </h3>
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-slate-300 font-bold">Daar Xayeysiiska:</span>
                <input
                  type="checkbox"
                  checked={cmsConfig.announcement.enabled}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      announcement: {
                        ...cmsConfig.announcement,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Fariinta (Somali):</label>
                <input
                  type="text"
                  value={cmsConfig.announcement.messageSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      announcement: {
                        ...cmsConfig.announcement,
                        messageSo: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Fariinta (English):</label>
                <input
                  type="text"
                  value={cmsConfig.announcement.messageEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      announcement: {
                        ...cmsConfig.announcement,
                        messageEn: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            {/* Gradient Theme Picker */}
            <div className="space-y-1.5 pt-2 border-t border-slate-700/80">
              <label className="text-slate-400 font-bold text-[11px]">Dooro Midabka Gradient-ka:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Emerald Teal (Official)', val: 'from-emerald-700 via-teal-800 to-slate-900' },
                  { name: 'Sunset Amber', val: 'from-amber-600 via-rose-700 to-slate-900' },
                  { name: 'Royal Indigo', val: 'from-indigo-700 via-purple-800 to-slate-900' },
                  { name: 'Deep Sapphire', val: 'from-blue-700 via-slate-800 to-slate-950' },
                ].map((g) => (
                  <button
                    key={g.val}
                    type="button"
                    onClick={() =>
                      setCmsConfig({
                        ...cmsConfig,
                        announcement: { ...cmsConfig.announcement, bgGradient: g.val },
                      })
                    }
                    className={`p-2 rounded-xl text-center font-bold text-[11px] border transition ${
                      cmsConfig.announcement.bgGradient === g.val
                        ? 'border-white bg-slate-800 text-white shadow-md'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Box */}
            {cmsConfig.announcement.enabled && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Muuqaalka Tooska ah (Live Announcement Preview):
                </span>
                <div
                  className={`p-2.5 rounded-xl text-center font-bold text-xs bg-gradient-to-r ${cmsConfig.announcement.bgGradient || 'from-emerald-700 via-teal-800 to-slate-900'} text-white shadow-md flex items-center justify-between px-4`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <SomalilandFlag className="w-4 h-2.5 rounded-2xs" />
                    <span className="truncate">{cmsConfig.announcement.messageSo}</span>
                  </div>
                  <span className="underline font-mono text-emerald-300 cursor-pointer shrink-0">
                    Dalbo Hadda &rarr;
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: NAVBAR & PORTALS
         ========================================================= */}
      {activeSubTab === 'navbar' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-emerald-400 flex items-center space-x-2">
              <Navigation className="w-4 h-4" />
              <span>Habaynta Navbar-ka & Batoonada Portals-ka (Navigation Config)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Magaca Shirkadda (Brand Title):</label>
                <input
                  type="text"
                  value={cmsConfig.navbar?.brandName || 'Wadaage Mobility'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      navbar: { ...(cmsConfig.navbar || DEFAULT_WEBSITE_CMS_CONFIG.navbar!), brandName: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Hal-ku-dhegga (Tagline):</label>
                <input
                  type="text"
                  value={cmsConfig.navbar?.taglineSo || 'Gaadiidka Casriga ah ee Somaliland'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      navbar: { ...(cmsConfig.navbar || DEFAULT_WEBSITE_CMS_CONFIG.navbar!), taglineSo: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Qoraalka Batoonka Rider (Somali):</label>
                <input
                  type="text"
                  value={cmsConfig.navbar?.riderButtonTextSo || 'Rakaabka (Rider App)'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      navbar: { ...(cmsConfig.navbar || DEFAULT_WEBSITE_CMS_CONFIG.navbar!), riderButtonTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Qoraalka Batoonka Driver (Somali):</label>
                <input
                  type="text"
                  value={cmsConfig.navbar?.driverButtonTextSo || 'Darawalka (Driver App)'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      navbar: { ...(cmsConfig.navbar || DEFAULT_WEBSITE_CMS_CONFIG.navbar!), driverButtonTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: SERVICES & PRICING
         ========================================================= */}
      {activeSubTab === 'services' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              Kantarool dhammaan kaadhadhka adeegyada gaadiidka ({cmsConfig.services.length} Adeeg)
            </span>
            <button
              type="button"
              onClick={() => {
                const newS: WebsiteServiceCard = {
                  id: `s_${Date.now()}`,
                  titleSo: 'Adeeg Cusub',
                  titleEn: 'New Service',
                  priceTagSo: '$0.50 USD / KM',
                  priceTagEn: '$0.50 USD / KM',
                  descriptionSo: 'Sharaxaadda adeeggan cusub ee gaadiidka.',
                  descriptionEn: 'Description for this new transit service.',
                  features: ['Instant Dispatch', 'Verified Driver', 'ZAAD Pay'],
                  badgeSo: 'CUSUB',
                  badgeEn: 'NEW',
                  icon: 'Car',
                  enabled: true,
                };
                setCmsConfig({
                  ...cmsConfig,
                  services: [...cmsConfig.services, newS],
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ku dar Adeeg Cusub</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cmsConfig.services.map((s, idx) => (
              <div
                key={s.id || idx}
                className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={s.titleSo}
                      onChange={(e) => {
                        const copy = [...cmsConfig.services];
                        copy[idx].titleSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, services: copy });
                      }}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-black text-sm w-full mr-2"
                    />
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={(e) => {
                          const copy = [...cmsConfig.services];
                          copy[idx].enabled = e.target.checked;
                          setCmsConfig({ ...cmsConfig, services: copy });
                        }}
                        className="w-4 h-4 accent-emerald-500"
                        title="Toggle Online"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const copy = cmsConfig.services.filter((_, i) => i !== idx);
                          setCmsConfig({ ...cmsConfig, services: copy });
                        }}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold">Qiimaha (Price Tag):</label>
                    <input
                      type="text"
                      value={s.priceTagSo}
                      onChange={(e) => {
                        const copy = [...cmsConfig.services];
                        copy[idx].priceTagSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, services: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold">Sharaxaadda (Description):</label>
                    <textarea
                      rows={2}
                      value={s.descriptionSo}
                      onChange={(e) => {
                        const copy = [...cmsConfig.services];
                        copy[idx].descriptionSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, services: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold">Badge Text (e.g. MOST POPULAR):</label>
                    <input
                      type="text"
                      value={s.badgeSo || ''}
                      onChange={(e) => {
                        const copy = [...cmsConfig.services];
                        copy[idx].badgeSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, services: copy });
                      }}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: FEATURES
         ========================================================= */}
      {activeSubTab === 'features' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              Guud ahaan {cmsConfig.features.length} Astaamood & Faahfaahino ayaa la muujinayaa.
            </span>
            <button
              type="button"
              onClick={() => {
                const newF: WebsiteFeatureItem = {
                  id: `f_${Date.now()}`,
                  titleSo: 'Astaanta Cusub',
                  titleEn: 'New Feature',
                  descriptionSo: 'Sharaxaadda astaantan cusub ee Wadaage.',
                  descriptionEn: 'Description of this new Wadaage feature.',
                  icon: 'Zap',
                  highlightTag: 'New',
                  enabled: true,
                };
                setCmsConfig({
                  ...cmsConfig,
                  features: [newF, ...cmsConfig.features],
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ku dar Astaan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cmsConfig.features.map((f, idx) => (
              <div
                key={f.id || idx}
                className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={f.titleSo}
                      onChange={(e) => {
                        const copy = [...cmsConfig.features];
                        copy[idx].titleSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, features: copy });
                      }}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      onChange={(e) => {
                        const copy = [...cmsConfig.features];
                        copy[idx].enabled = e.target.checked;
                        setCmsConfig({ ...cmsConfig, features: copy });
                      }}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = cmsConfig.features.filter((_, i) => i !== idx);
                        setCmsConfig({ ...cmsConfig, features: copy });
                      }}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <textarea
                    rows={2}
                    value={f.descriptionSo}
                    onChange={(e) => {
                      const copy = [...cmsConfig.features];
                      copy[idx].descriptionSo = e.target.value;
                      setCmsConfig({ ...cmsConfig, features: copy });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 6: STATS & SOCIAL PROOF
         ========================================================= */}
      {activeSubTab === 'stats' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-purple-400 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Tirakoobka & Caddeymaha Dhabta ah (Live Stats Counters)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                <label className="text-slate-400 font-bold block">1. Darawallada (Active Drivers):</label>
                <input
                  type="text"
                  value={cmsConfig.stats?.activeDriversCount || '150+'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      stats: { ...(cmsConfig.stats || DEFAULT_WEBSITE_CMS_CONFIG.stats!), activeDriversCount: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono font-black text-base"
                />
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                <label className="text-slate-400 font-bold block">2. Safarrada (Completed Trips):</label>
                <input
                  type="text"
                  value={cmsConfig.stats?.tripsCompletedCount || '45,000+'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      stats: { ...(cmsConfig.stats || DEFAULT_WEBSITE_CMS_CONFIG.stats!), tripsCompletedCount: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono font-black text-base"
                />
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                <label className="text-slate-400 font-bold block">3. Qanacsanaanta (Rating):</label>
                <input
                  type="text"
                  value={cmsConfig.stats?.customerRating || '4.9 ★'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      stats: { ...(cmsConfig.stats || DEFAULT_WEBSITE_CMS_CONFIG.stats!), customerRating: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono font-black text-base"
                />
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                <label className="text-slate-400 font-bold block">4. Magaalooyinka (Cities):</label>
                <input
                  type="text"
                  value={cmsConfig.stats?.citiesCount || '4'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      stats: { ...(cmsConfig.stats || DEFAULT_WEBSITE_CMS_CONFIG.stats!), citiesCount: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-blue-400 font-mono font-black text-base"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 7: FARE CALCULATOR CONFIG
         ========================================================= */}
      {activeSubTab === 'calculator' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-emerald-400 flex items-center space-x-2">
              <Compass className="w-4 h-4" />
              <span>Qiyaasta Qiimaha ee Tooska ah (Fare Estimator Settings)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Cinwaanka Calculator-ka (Somali):</label>
                <input
                  type="text"
                  value={cmsConfig.calculator?.titleSo || 'Qiyaas Qiimaha Safarkaaga Hargeysa'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      calculator: { ...(cmsConfig.calculator || DEFAULT_WEBSITE_CMS_CONFIG.calculator!), titleSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Sharaxaadda (Subtitle):</label>
                <input
                  type="text"
                  value={cmsConfig.calculator?.subtitleSo || 'Dooro meesha aad ka baxayso iyo meesha aad u socoto.'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      calculator: { ...(cmsConfig.calculator || DEFAULT_WEBSITE_CMS_CONFIG.calculator!), subtitleSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Default Pickup Landmark:</label>
                <input
                  type="text"
                  value={cmsConfig.calculator?.defaultPickup || 'Egal International Airport'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      calculator: { ...(cmsConfig.calculator || DEFAULT_WEBSITE_CMS_CONFIG.calculator!), defaultPickup: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Default Dropoff Destination:</label>
                <input
                  type="text"
                  value={cmsConfig.calculator?.defaultDropoff || 'Dahabshiil Bank HQ, 26 June'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      calculator: { ...(cmsConfig.calculator || DEFAULT_WEBSITE_CMS_CONFIG.calculator!), defaultDropoff: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-rose-400 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 8: FAQS
         ========================================================= */}
      {activeSubTab === 'faqs' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              Kantarool Su’aalaha & Jawaabaha ({cmsConfig.faqs?.length || 4} Su’aalood)
            </span>
            <button
              type="button"
              onClick={() => {
                const newFaq: WebsiteFaqItem = {
                  id: `faq_${Date.now()}`,
                  questionSo: 'Su’aal cusub oo ku saabsan Wadaage?',
                  questionEn: 'New question regarding Wadaage?',
                  answerSo: 'Jawaab faahfaahsan oo ku saabsan su’aashan.',
                  answerEn: 'Detailed answer regarding this question.',
                  category: 'general',
                  enabled: true,
                };
                setCmsConfig({
                  ...cmsConfig,
                  faqs: [newFaq, ...(cmsConfig.faqs || DEFAULT_WEBSITE_CMS_CONFIG.faqs!)],
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ku dar Su’aal Cusub (Add FAQ)</span>
            </button>
          </div>

          <div className="space-y-3">
            {(cmsConfig.faqs || DEFAULT_WEBSITE_CMS_CONFIG.faqs!).map((faq, idx) => (
              <div
                key={faq.id || idx}
                className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 mr-3">
                    <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <input
                      type="text"
                      value={faq.questionSo}
                      onChange={(e) => {
                        const copy = [...(cmsConfig.faqs || DEFAULT_WEBSITE_CMS_CONFIG.faqs!)];
                        copy[idx].questionSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, faqs: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-xs"
                      placeholder="Su’aasha (Somali)"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const copy = (cmsConfig.faqs || DEFAULT_WEBSITE_CMS_CONFIG.faqs!).filter((_, i) => i !== idx);
                      setCmsConfig({ ...cmsConfig, faqs: copy });
                    }}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold">Jawaabta (Somali):</label>
                    <textarea
                      rows={2}
                      value={faq.answerSo}
                      onChange={(e) => {
                        const copy = [...(cmsConfig.faqs || DEFAULT_WEBSITE_CMS_CONFIG.faqs!)];
                        copy[idx].answerSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, faqs: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold">Answer (English):</label>
                    <textarea
                      rows={2}
                      value={faq.answerEn}
                      onChange={(e) => {
                        const copy = [...(cmsConfig.faqs || DEFAULT_WEBSITE_CMS_CONFIG.faqs!)];
                        copy[idx].answerEn = e.target.value;
                        setCmsConfig({ ...cmsConfig, faqs: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 9: TESTIMONIALS
         ========================================================= */}
      {activeSubTab === 'testimonials' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              {cmsConfig.testimonials.length} Ra’yiyo Macaamiil ayaa la muujinayaa.
            </span>
            <button
              type="button"
              onClick={() => {
                const newT: WebsiteTestimonial = {
                  id: `t_${Date.now()}`,
                  authorName: 'Macaamil Cusub',
                  roleOrLocation: 'Hargeisa',
                  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
                  rating: 5,
                  commentSo: 'Adeeg aad u wanaagsan oo lagu kalsoonaan karo!',
                  commentEn: 'Excellent and highly dependable service in Hargeisa!',
                  verified: true,
                };
                setCmsConfig({
                  ...cmsConfig,
                  testimonials: [newT, ...cmsConfig.testimonials],
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ku dar Ra’yi</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cmsConfig.testimonials.map((t, idx) => (
              <div
                key={t.id || idx}
                className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={t.authorName}
                    onChange={(e) => {
                      const copy = [...cmsConfig.testimonials];
                      copy[idx].authorName = e.target.value;
                      setCmsConfig({ ...cmsConfig, testimonials: copy });
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const copy = cmsConfig.testimonials.filter((_, i) => i !== idx);
                      setCmsConfig({ ...cmsConfig, testimonials: copy });
                    }}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={t.roleOrLocation}
                  onChange={(e) => {
                    const copy = [...cmsConfig.testimonials];
                    copy[idx].roleOrLocation = e.target.value;
                    setCmsConfig({ ...cmsConfig, testimonials: copy });
                  }}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
                />

                <textarea
                  rows={3}
                  value={t.commentSo}
                  onChange={(e) => {
                    const copy = [...cmsConfig.testimonials];
                    copy[idx].commentSo = e.target.value;
                    setCmsConfig({ ...cmsConfig, testimonials: copy });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 10: CONTACT & SOCIALS
         ========================================================= */}
      {activeSubTab === 'contact' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-blue-400 flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Macluumaadka Xiriirka & Xafiisyada (Contact Info & Socials)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Telefoonka 1-aad (Primary Phone):</label>
                <input
                  type="text"
                  value={cmsConfig.contact.phonePrimary}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, phonePrimary: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">WhatsApp Support Hotline:</label>
                <input
                  type="text"
                  value={cmsConfig.contact.whatsappNumber}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, whatsappNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Email-ka Taageerada:</label>
                <input
                  type="text"
                  value={cmsConfig.contact.supportEmail}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, supportEmail: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-slate-300 font-bold">Ciwaanka Xafiiska (Office Address):</label>
                <input
                  type="text"
                  value={cmsConfig.contact.officeAddress}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, officeAddress: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Magaalada & Dalka:</label>
                <input
                  type="text"
                  value={cmsConfig.contact.city}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, city: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 11: FOOTER & COPYRIGHT
         ========================================================= */}
      {activeSubTab === 'footer' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-emerald-400 flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Qaybta Hoose ee Website-ka (Footer & Legal Notice)</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Qoraalka Ku Saabsan Wadaage (About Summary):</label>
                <textarea
                  rows={2}
                  value={cmsConfig.footer?.aboutTextSo || 'Wadaage Mobility waa nidaamka gaadiidka casriga ah ee Somaliland.'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      footer: { ...(cmsConfig.footer || DEFAULT_WEBSITE_CMS_CONFIG.footer!), aboutTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Qoraalka Xuquuqda (Copyright Notice):</label>
                <input
                  type="text"
                  value={cmsConfig.footer?.copyrightTextSo || 'Xuquuqda oo dhan way dhowran tahay © 2026 Wadaage Mobility Somaliland.'}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      footer: { ...(cmsConfig.footer || DEFAULT_WEBSITE_CMS_CONFIG.footer!), copyrightTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 12: SEO & SEARCH ENGINES
         ========================================================= */}
      {activeSubTab === 'seo' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-purple-400 flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>SEO & Google Search Engine Optimization</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Meta Title (Cinwaanka Google Search):</label>
                <input
                  type="text"
                  value={cmsConfig.seo.metaTitle}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      seo: { ...cmsConfig.seo, metaTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Meta Description (Sharaxaadda Google Snippet):</label>
                <textarea
                  rows={3}
                  value={cmsConfig.seo.metaDescription}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      seo: { ...cmsConfig.seo, metaDescription: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Keywords (Erayada Raadinta SEO):</label>
                <input
                  type="text"
                  value={cmsConfig.seo.metaKeywords}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      seo: { ...cmsConfig.seo, metaKeywords: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>

              {/* Google SERP Snippet Preview */}
              <div className="p-4 bg-white rounded-2xl text-slate-900 space-y-1 mt-3 shadow-inner">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Google Search Snippet Preview:
                </span>
                <div className="text-[#1a0dab] hover:underline font-bold text-base cursor-pointer">
                  {cmsConfig.seo.metaTitle || 'Wadaage Somaliland — Gaadiidka Casriga ah'}
                </div>
                <div className="text-[#006621] text-xs font-mono">https://www.wadaage.com</div>
                <div className="text-[#545454] text-xs leading-relaxed">
                  {cmsConfig.seo.metaDescription || 'Dalbo Taxi ama Wadaage Share Somaliland. Qiimo jaban, ammaan, iyo lacag-bixinta ZAAD & eDahab.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 13: LIVE SIMULATOR / SPLIT-SCREEN PREVIEW
         ========================================================= */}
      {activeSubTab === 'live_preview' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-2xl border border-slate-700 text-xs">
            <span className="font-bold text-slate-200">Simulate Device Screen:</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                  previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                  previewDevice === 'tablet' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                  previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center p-2 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
            <div
              className={`transition-all duration-300 overflow-y-auto max-h-[650px] rounded-2xl border-4 border-slate-800 bg-slate-950 text-white text-xs ${
                previewDevice === 'mobile'
                  ? 'w-[375px]'
                  : previewDevice === 'tablet'
                  ? 'w-[768px]'
                  : 'w-full'
              }`}
            >
              {/* Simulated Announcement */}
              {cmsConfig.announcement.enabled && (
                <div
                  className={`p-2 text-center text-[10px] font-bold bg-gradient-to-r ${cmsConfig.announcement.bgGradient} text-white flex items-center justify-center space-x-1.5`}
                >
                  <SomalilandFlag className="w-3.5 h-2 rounded-2xs" />
                  <span>{cmsConfig.announcement.messageSo}</span>
                </div>
              )}

              {/* Simulated Hero */}
              <div className="p-6 text-center space-y-3 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
                <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-3 py-1 rounded-full">
                  {cmsConfig.hero.badgeTextSo}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {cmsConfig.hero.headlineSo}
                </h1>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                  {cmsConfig.hero.subtitleSo}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs">
                    {cmsConfig.hero.ctaButtonTextSo}
                  </button>
                  <button className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs border border-slate-700">
                    {cmsConfig.hero.secondaryButtonTextSo}
                  </button>
                </div>
              </div>

              {/* Simulated Services */}
              <div className="p-6 space-y-3">
                <h3 className="font-extrabold text-sm text-center text-white">Adeegyada Gaadiidka</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cmsConfig.services.filter(s => s.enabled).map((s) => (
                    <div key={s.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-bold text-white text-xs">{s.titleSo}</div>
                      <div className="text-emerald-400 font-mono font-bold text-xs">{s.priceTagSo}</div>
                      <p className="text-[10px] text-slate-400">{s.descriptionSo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
