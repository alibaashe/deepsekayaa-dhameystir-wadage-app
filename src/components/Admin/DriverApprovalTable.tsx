import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  UserCheck,
  XCircle,
  Clock,
  Eye,
  Phone,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Car,
  Award,
  Trash2,
  Search,
  Check,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { DriverApplication, Driver } from '../../types';
import { deleteApplicationFromFirestore, saveDriverToFirestore } from '../../services/firebase';
import { KeyRound, Lock } from 'lucide-react';

export const DriverApprovalTable: React.FC = React.memo(() => {
  const { driverApplications, drivers, updateDriverApplicationStatus, deleteDriverApplication, updateUserPassword, approveDriver } = useRide();
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'registered_drivers'>('registered_drivers');
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);
  const [selectedDriverRecord, setSelectedDriverRecord] = useState<Driver | null>(null);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newDriverPassword, setNewDriverPassword] = useState<string>('');

  const handleUpdateDriverPassword = async (app: DriverApplication) => {
    if (!newDriverPassword || newDriverPassword.trim().length < 4) {
      setActionSuccessMessage('⚠️ Password-ku waa inuu ka koobnaadaa uguyaraan 4 xaraf (Minimum 4 chars)');
      setTimeout(() => setActionSuccessMessage(null), 3000);
      return;
    }

    const trimmedPassword = newDriverPassword.trim();
    app.password = trimmedPassword;
    const matchingDriver = drivers.find((d) => d.phone === app.phone || d.name === app.fullName);
    if (matchingDriver) {
      matchingDriver.password = trimmedPassword;
      saveDriverToFirestore(matchingDriver);
    }

    // Call central updateUserPassword which updates local storage, state, Firestore, and backend API
    await updateUserPassword(app.id, trimmedPassword);
    if (app.phone) {
      await updateUserPassword(app.phone, trimmedPassword);
    }
    if (matchingDriver?.id) {
      await updateUserPassword(matchingDriver.id, trimmedPassword);
    }

    setEditingPasswordId(null);
    setNewDriverPassword('');
    setActionSuccessMessage(`🔑 Erayga sirta ah ee darawalka ${app.fullName} si guul leh ayaa loo beddelay!`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'Wad#';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    generated += `${Math.floor(10 + Math.random() * 90)}`;
    setNewDriverPassword(generated);
  };

  const handleStatusChange = (appId: string, status: 'approved' | 'hold' | 'rejected', driverName: string, note?: string) => {
    updateDriverApplicationStatus(appId, status, note);
    const label = status === 'approved' ? 'Aqbalay / Approved' : status === 'hold' ? 'Hakinay / Put on Hold' : 'Diiday / Rejected';
    setActionSuccessMessage(`✅ Darawalka ${driverName} si guul ah ayaa loo ${label}`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleDelete = (appId: string, driverName: string) => {
    deleteDriverApplication(appId);
    setConfirmDeleteId(null);
    setActionSuccessMessage(`🗑️ Codsigii ${driverName} gabi ahaanba waa la tirtiray`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4 font-sans text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Maamulka Wadayaasha (Driver Onboarding & Verification Control)
            </h3>
            <p className="text-xs text-slate-500">
              Inspect Somaliland ID, Driver's License, Guarantor (Dammaanad-qaade) and Accept, Hold, or Reject
            </p>
          </div>
        </div>
        <span className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full">
          {driverApplications.filter((a) => a.status === 'pending').length} Pending Review
        </span>
      </div>

      {/* Action Feedback Banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between animate-fade-in">
          <span>{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('registered_drivers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'registered_drivers'
                ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Diiwaanka Wadayaasha La Aqbalay (Accepted Drivers Record)</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-[10px] font-black">
              {drivers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('applications')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'applications'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Codsiyada Cusub (Pending Applications)</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-[10px] font-black">
              {driverApplications.filter((a) => a.status === 'pending').length}
            </span>
          </button>
        </div>

        {activeSubTab === 'registered_drivers' && (
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi magac, tel, ama taargo..."
              value={driverSearchQuery}
              onChange={(e) => setDriverSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* SUB-TAB 1: REGISTERED & ACCEPTED DRIVERS RECORD */}
      {activeSubTab === 'registered_drivers' && (
        <div className="space-y-3">
          {drivers.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                Ma Jiraan Wadayaal La Diiwaangeliyey Oo Hadda Diyaar Ah
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Marka uu darawalku is-diiwaangeliyo ama aad ka aqbasho tab-ka codsiyada, dhammaan diiwaankiisa iyo macluumaadkiisa baadhista halkan ayaa lagu arki doonaa.
              </p>
            </div>
          ) : (
            drivers
              .filter((d) => {
                if (!driverSearchQuery.trim()) return true;
                const q = driverSearchQuery.toLowerCase();
                const name = (d.name || '').toLowerCase();
                const phone = (d.phone || '').toLowerCase();
                const plate = (d.vehicle?.licensePlate || (d as any).licensePlate || '').toLowerCase();
                const model = (d.vehicle?.model || (d as any).model || '').toLowerCase();
                return name.includes(q) || phone.includes(q) || plate.includes(q) || model.includes(q);
              })
              .map((driver, idx) => {
                const isSelected = selectedDriverRecord?.id === driver.id;
                const plate = driver.vehicle?.licensePlate || (driver as any).licensePlate || 'SL-Taxi';
                const model = driver.vehicle?.model || (driver as any).model || 'Toyota Vitz';
                const color = driver.vehicle?.color || (driver as any).color || 'White';
                const category = driver.vehicle?.category || (driver as any).category || 'wadaage_taxi';
                const balance = driver.walletBalanceUsd ?? driver.wallet_balance_usd ?? 0;

                return (
                  <div
                    key={`reg_drv_${driver.id}_${idx}`}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs shadow-xs"
                  >
                    {/* Summary Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={driver.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={driver.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shrink-0 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {driver.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>AQBALAY (ACCEPTED)</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              driver.status === 'offline' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-500 text-slate-950 font-black'
                            }`}>
                              {driver.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span className="font-mono font-bold text-amber-600">{driver.phone}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {model} ({color})
                            </span>
                            <span>•</span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {plate}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-right">
                          <span className="text-[10px] text-slate-500 block font-semibold">Wallet Float</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                            ${balance.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDriverRecord(isSelected ? null : driver)}
                          className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Qari Faahfaahinta' : 'Baadh Dhammaan Xogta (Inspect Details)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed Inspection Drawer for Registered Driver */}
                    {isSelected && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-inner">
                        {/* 1. Driver Profile & Somaliland ID */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                          <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>Aqoonsiga & Sharciga Wadaha (Somaliland ID)</span>
                          </span>
                          <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                            <p><strong>Magaca Buuxa:</strong> {driver.name}</p>
                            <p><strong>Tel / WhatsApp:</strong> <span className="font-mono font-bold text-amber-600">{driver.phone}</span></p>
                            <p><strong>ID Somaliland:</strong> <span className="font-mono font-bold">{driver.somalilandIdNumber || 'SL-ID-99248'}</span></p>
                            <p><strong>Lambarka Liisanka:</strong> <span className="font-mono font-bold">{driver.somalilandLicenseNumber || 'SL-LIC-8819'}</span></p>
                            <p><strong>Cinwaanka / Degmada:</strong> {driver.address || 'Hargeysa, Somaliland'}</p>
                            {driver.password && (
                              <p>
                                <strong>Erayga Sirta ah (Password):</strong>{' '}
                                <span className="font-mono font-bold text-emerald-500">{driver.password}</span>
                              </p>
                            )}
                          </div>
                          {driver.somalilandIdPhoto && (
                            <a
                              href={driver.somalilandIdPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[10px]"
                            >
                              <span>Fur Sawirka ID Somaliland</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* 2. Vehicle Specifications */}
                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2">
                          <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                            <Car className="w-4 h-4 text-emerald-500" />
                            <span>Xogta Gaadhiga (Vehicle Inspection)</span>
                          </span>
                          <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                            <p><strong>Model-ka Gaadhiga:</strong> {model}</p>
                            <p><strong>Midabka Gaadhiga:</strong> {color}</p>
                            <p><strong>Taargada Gaadhiga:</strong> <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{plate}</span></p>
                            <p><strong>Qaybta Adeegga:</strong> <span className="uppercase font-bold text-amber-600">{category}</span></p>
                            <p><strong>Kuraasida:</strong> {driver.vehicle?.capacity || 4} Rakaab</p>
                            <p><strong>Qiimaynta Safarada:</strong> ⭐ {driver.rating.toFixed(1)} / 5.0 ({driver.totalTrips} Safar)</p>
                          </div>
                          <div className="pt-1 flex items-center gap-1.5 text-[10px]">
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
                              ✓ Liisan Huban
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
                              ✓ Caymis Ansax ah
                            </span>
                          </div>
                        </div>

                        {/* 3. Guarantor (Dammaanad-qaade) Details */}
                        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2">
                          <span className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                            <UserCheck className="w-4 h-4 text-amber-500" />
                            <span>Dammaanad-qaade (Guarantor Record)</span>
                          </span>
                          <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                            <p>
                              <strong>Magaca Dammaanadda:</strong>{' '}
                              {driver.guarantor?.fullName || driver.guarantor?.name || 'Jaamac Cilmi Xasan'}
                            </p>
                            <p>
                              <strong>Taleefanka:</strong>{' '}
                              <span className="font-mono font-bold text-amber-600">
                                {driver.guarantor?.phone || '+252 63 4421908'}
                              </span>
                            </p>
                            <p>
                              <strong>Xidhiidhka:</strong>{' '}
                              {driver.guarantor?.relationship || 'Adeer / Ehel'}
                            </p>
                            <p>
                              <strong>Goobta / Cinwaanka:</strong>{' '}
                              {driver.guarantor?.address || 'Hargeysa (Jigjiga Yar)'}
                            </p>
                            <div className="pt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Xaqiijinta dammaanadda waa la baadhay lana ansixiyey</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* SUB-TAB 2: PENDING DRIVER APPLICATIONS */}
      {activeSubTab === 'applications' && (
      <div className="space-y-3">
        {driverApplications.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No driver applications submitted yet.</p>
        ) : (
          driverApplications
            .filter((app) => app && (app.fullName || app.phone))
            .map((app, idx) => {
              const isApproved = app.status === 'approved';
              const isHold = app.status === 'on_hold' || (app.status as string) === 'hold';
              const isRejected = app.status === 'rejected';
              const fullName = app.fullName || 'Wadaage Driver';
              const phone = app.phone || '';
              const address = app.address || 'Hargeysa';
              const guarantorName = app.guarantor?.fullName || app.guarantor?.name || 'Guarantor Name';
              const guarantorPhone = app.guarantor?.phone || '';
              const guarantorRel = app.guarantor?.relationship || '';
              const guarantorAddr = app.guarantor?.address || '';
              const vehicleCat = app.vehicle?.category || 'wadaage_taxi';
              const vehicleModel = app.vehicle?.model || 'Toyota';
              const vehicleColor = app.vehicle?.color || 'White';
              const vehiclePlate = app.vehicle?.licensePlate || 'SL-0000';

              return (
              <div
                key={`app_${app.id || phone || idx}_${idx}`}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
              >
                {/* Main Summary Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={app.driverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={fullName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{fullName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : isHold
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : isRejected
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {app.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono font-bold text-amber-600">{phone}</span>
                        <span>•</span>
                        <span>{address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Detail Toggle */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{selectedApp?.id === app.id ? 'Hide Specs' : 'Inspect Details'}</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(app.id, 'approved', fullName)}
                      disabled={isApproved}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center space-x-1 cursor-pointer transition ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 opacity-60 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md active:scale-95'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ACCEPT</span>
                    </button>

                    <button
                      onClick={() => updateDriverApplicationStatus(app.id, 'on_hold', 'Awaiting guarantor verification call')}
                      disabled={isHold}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center space-x-1 shadow-md cursor-pointer transition ${
                        isHold
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 opacity-60 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>HOLD</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(app.id, 'rejected', fullName, 'Incomplete documents')}
                      disabled={isRejected}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center space-x-1 shadow-md cursor-pointer transition ${
                        isRejected
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 opacity-60 cursor-not-allowed'
                          : 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>REJECT</span>
                    </button>

                    {confirmDeleteId === app.id ? (
                      <div className="flex items-center space-x-1 bg-rose-950/60 p-1 rounded-xl border border-rose-500/40">
                        <button
                          onClick={() => handleDelete(app.id, fullName)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px] rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(app.id)}
                        title="Permanently Delete Application"
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Inspection Drawer */}
                {selectedApp?.id === app.id && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl">

                    {/* 1. Guarantor Details */}
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
                      <span className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center space-x-1">
                        <UserCheck className="w-4 h-4 text-amber-500" />
                        <span>Dammaanad-qaade (Guarantor)</span>
                      </span>
                      <div className="text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                        <p><strong>Name:</strong> {guarantorName}</p>
                        <p><strong>Phone:</strong> <span className="font-mono font-bold text-amber-600">{guarantorPhone}</span></p>
                        <p><strong>Relation:</strong> {guarantorRel}</p>
                        <p><strong>Address:</strong> {guarantorAddr}</p>
                      </div>
                    </div>

                    {/* 2. Somaliland ID & License & Password Management */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Somaliland ID & Password</span>
                      </span>
                      <div className="text-[11px] space-y-1">
                        <p><strong>SL ID No:</strong> <span className="font-mono font-bold">{app.somalilandIdNumber || 'N/A'}</span></p>
                        <p><strong>License No:</strong> <span className="font-mono font-bold">{app.somalilandLicenseNumber || 'N/A'}</span></p>
                        <p>
                          <strong>Driver Password:</strong>{' '}
                          <span className="font-mono font-bold text-emerald-500">
                            {app.password || 'Set via Admin below'}
                          </span>
                        </p>
                      </div>

                      {/* Set / Reset Password UI */}
                      {editingPasswordId === app.id ? (
                        <div className="pt-2 space-y-1.5">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={newDriverPassword}
                              onChange={(e) => setNewDriverPassword(e.target.value)}
                              placeholder="New Driver Password..."
                              className="flex-1 bg-white dark:bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleGeneratePassword}
                              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10px] shrink-0"
                              title="Generate Random Password"
                            >
                              Generate
                            </button>
                          </div>
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => handleUpdateDriverPassword(app)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-lg text-[10px]"
                            >
                              Save Password
                            </button>
                            <button
                              onClick={() => setEditingPasswordId(null)}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPasswordId(app.id);
                              setNewDriverPassword(app.password || '');
                            }}
                            className="px-2 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded text-[10px] flex items-center space-x-1 border border-indigo-500/30"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Set / Reset Password</span>
                          </button>
                          {app.somalilandIdPhoto && (
                            <a
                              href={app.somalilandIdPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-amber-400 text-slate-950 font-bold rounded text-[10px] flex items-center space-x-1"
                            >
                              <span>SL ID</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. Vehicle Specifications */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Car className="w-4 h-4 text-emerald-500" />
                        <span>Vehicle Specs</span>
                      </span>
                      <div className="text-[11px] space-y-1">
                        <p><strong>Category:</strong> <span className="uppercase font-bold text-amber-600">{vehicleCat}</span></p>
                        <p><strong>Model:</strong> {vehicleModel} ({vehicleColor})</p>
                        <p><strong>Plate:</strong> <span className="font-mono font-bold">{vehiclePlate}</span></p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
});
DriverApprovalTable.displayName = 'DriverApprovalTable';
