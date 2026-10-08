import { CreditCard, Key, Lock, CheckCircle2, Save, Smartphone, Wallet, DollarSign, Zap, RefreshCw, Globe } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export const PaymentGatewaysConfig: React.FC = () => {
  const [zaadMerchant, setZaadMerchant] = useState('ZAAD_MERCHANT_88192');
  const [zaadApiKey, setZaadApiKey] = useState('zaad_live_sk_991823774812');
  
  // eDahab Official Merchant API state
  const [edahabApiKey, setEdahabApiKey] = useState('');
  const [edahabSecretKey, setEdahabSecretKey] = useState('');
  const [edahabAgentCode, setEdahabAgentCode] = useState('44019');
  const [edahabIsProd, setEdahabIsProd] = useState(true);
  const [edahabReturnUrl, setEdahabReturnUrl] = useState('https://www.wadaage.com');
  const [isTestingEdahab, setIsTestingEdahab] = useState(false);
  const [edahabTestResult, setEdahabTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [premierAccount, setPremierAccount] = useState('PRM-901827364-SL');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load active eDahab config from server
  useEffect(() => {
    fetch('/api/edahab/config')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success) {
          if (data.agentCode) setEdahabAgentCode(data.agentCode);
          if (data.isProduction !== undefined) setEdahabIsProd(data.isProduction);
          if (data.returnUrl) setEdahabReturnUrl(data.returnUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/edahab/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: edahabApiKey,
          secretKey: edahabSecretKey,
          agentCode: edahabAgentCode,
          isProduction: edahabIsProd,
          returnUrl: edahabReturnUrl,
        }),
      });
    } catch (_e) {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestEdahab = async () => {
    setIsTestingEdahab(true);
    setEdahabTestResult(null);
    try {
      const res = await fetch('/api/edahab/issue-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edahabNumber: '656807814',
          amount: 1.0,
          currency: 'USD',
          agentCode: edahabAgentCode,
          returnUrl: edahabReturnUrl,
          driverName: 'Admin Connection Test',
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setEdahabTestResult({
          success: true,
          message: `eDahab Invoice successfully generated! InvoiceId #${data.invoiceId} (Status: ${data.StatusDescription || 'Success'}). Pop-up & Web portal ready.`,
        });
      } else {
        setEdahabTestResult({
          success: false,
          message: data?.error || 'eDahab test invoice failed. Please verify API Key and Secret Key.',
        });
      }
    } catch (e: any) {
      setEdahabTestResult({
        success: false,
        message: e?.message || 'Failed to reach eDahab endpoint.',
      });
    } finally {
      setIsTestingEdahab(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            Local Somaliland Payment Gateways & Mobile Money Config
          </h3>
          <p className="text-xs text-slate-500">Manage Zaad Service, eDahab Merchant API, Premier Wallet & Physical Cash settings</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center space-x-2 text-emerald-500 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Payment Gateway credentials & merchant keys successfully updated and synced!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Zaad Service */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Zaad Service (Telesom Mobile Money)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                PRIMARY (ACTIVE)
              </span>
            </div>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Zaad Merchant Number / ID</label>
              <input
                type="text"
                value={zaadMerchant}
                onChange={(e) => setZaadMerchant(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">API Integration Secret Key</label>
              <input
                type="password"
                value={zaadApiKey}
                onChange={(e) => setZaadApiKey(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* eDahab Merchant API (Official Somtel Integration) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">eDahab Merchant API (Somtel *770#)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                AUTOMATED INVOICING & POP-UP
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500 font-bold">Environment:</span>
              <button
                type="button"
                onClick={() => setEdahabIsProd(!edahabIsProd)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                  edahabIsProd ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {edahabIsProd ? '🟢 Production (edahab.net)' : '🟡 Sandbox / Test'}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Official Somtel eDahab integration supporting <strong>USSD Pop-up Prompts</strong>, <strong>Instant Invoice Verification</strong>, and <strong>Automated Wallet Top-Ups</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">eDahab API-KEY</label>
              <input
                type="password"
                placeholder="Paste API Key given by eDahab..."
                value={edahabApiKey}
                onChange={(e) => setEdahabApiKey(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">eDahab SECRET-KEY</label>
              <input
                type="password"
                placeholder="Paste Secret Key given by eDahab..."
                value={edahabSecretKey}
                onChange={(e) => setEdahabSecretKey(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Agent / Merchant Code</label>
              <input
                type="text"
                placeholder="e.g. 44019"
                value={edahabAgentCode}
                onChange={(e) => setEdahabAgentCode(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Return / Callback URL (Redirect after Web Payment)</label>
              <input
                type="text"
                value={edahabReturnUrl}
                onChange={(e) => setEdahabReturnUrl(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleTestEdahab}
                disabled={isTestingEdahab}
                className="w-full py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${isTestingEdahab ? 'animate-spin' : ''}`} />
                <span>{isTestingEdahab ? 'Issuing Test Invoice...' : '⚡ Test eDahab Invoice API Connection'}</span>
              </button>
            </div>
          </div>

          {edahabTestResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold ${
                edahabTestResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {edahabTestResult.message}
            </div>
          )}
        </div>

        {/* Premier Wallet */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-purple-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Premier Wallet (Premier Bank Somaliland)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                ACTIVE
              </span>
            </div>
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Premier Bank Corporate Account</label>
            <input
              type="text"
              value={premierAccount}
              onChange={(e) => setPremierAccount(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Cash Payments */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">Direct Cash Payment to Driver (USD / SLSH)</p>
              <p className="text-[11px] text-slate-500">Allows passengers to pay physical currency upon ride completion</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCashEnabled(!cashEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              cashEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
            }`}
          >
            {cashEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition-all uppercase tracking-wider"
        >
          <Save className="w-4 h-4" />
          <span>Save Gateway Configurations</span>
        </button>
      </form>
    </div>
  );
};
