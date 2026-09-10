import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  Lock,
  Mail,
  LogIn,
  LogOut,
  UserCheck,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccounting } from '../../context/AccountingContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isAnonymous,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
    cloudSyncStatus,
    lastSyncedAt,
  } = useAuth();
  const { companies, vouchers, forceSyncAllToCloud } = useAccounting();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [manualSyncMsg, setManualSyncMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoadingAction(true);
    const res = await loginWithGoogle();
    setLoadingAction(false);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('कृपया ईमेल और पासवर्ड दर्ज करें');
      return;
    }
    setErrorMsg('');
    setLoadingAction(true);
    const res =
      mode === 'signin'
        ? await loginWithEmail(email, password)
        : await signupWithEmail(email, password);
    setLoadingAction(false);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleManualSync = async () => {
    setManualSyncMsg('क्लाउड पर डेटा सुरक्षित हो रहा है...');
    try {
      await forceSyncAllToCloud();
      setManualSyncMsg('सारा डेटा क्लाउड पर सफलतापूर्वक सुरक्षित हो गया!');
      setTimeout(() => setManualSyncMsg(''), 4000);
    } catch (e) {
      setManualSyncMsg('सिंक में त्रुटि हुई। कृपया दोबारा प्रयास करें।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg flex items-center gap-2">
                क्लाउड डेटा और लॉगिन
              </h2>
              <p className="text-xs text-slate-300">
                Data Cloud Backup & Permanent Storage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Badge Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                user
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {user ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Cloud className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 text-xs text-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {user ? 'क्लाउड स्टेटस:' : 'डेटा सुरक्षा स्टेटस:'}
                </span>
                {user ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    क्लाउड सिंक सक्रिय (Cloud Active)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                    लोकल स्टोरेज सुरक्षित (Local Device)
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">
                आपकी <strong>{companies.length} कंपनियां</strong> और{' '}
                <strong>{vouchers.length} वाउचर्स</strong>{' '}
                {user
                  ? 'सुरक्षित रूप से क्लाउड डेटाबेस में सुरक्षित और सिंक हैं।'
                  : 'आपके डिवाइस पर सुरक्षित सेव हैं। दूसरे फोन या कंप्यूटर से एक्सेस के लिए लॉगिन करें।'}
              </p>
              {user && lastSyncedAt && (
                <p className="text-[11px] text-slate-500">
                  अंतिम सिंक:{' '}
                  {lastSyncedAt.toLocaleTimeString('hi-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Account Details */}
          {user && !isAnonymous ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>लॉगिन किया गया खाता</span>
                </div>
                <p className="text-sm font-black text-slate-900">
                  {user.email || user.displayName || 'Google Account'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  आपका डेटा इस खाते से जुड़ा हुआ है। आप किसी भी फोन या कंप्यूटर
                  पर इसी ईमेल से लॉगिन करके अपना सारा डेटा तुरंत खोल सकते हैं।
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>अभी सिंक करें (Save All to Cloud)</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 font-bold rounded-xl text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>लॉगआउट</span>
                </button>
              </div>

              {manualSyncMsg && (
                <p className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                  {manualSyncMsg}
                </p>
              )}
            </div>
          ) : (
            /* Not signed in or Anonymous */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  डेटा ऑटोमेटिक क्लाउड पर सुरक्षित हो रहा है
                </p>
                <p className="mt-1 text-slate-600">
                  लेकिन यदि आप <strong>दूसरे फ़ोन या लैपटॉप</strong> से भी अपनी
                  कंपनियों का डेटा खोलना चाहते हैं, तो नीचे अपने Google या ईमेल
                  खाते से लॉगिन कर लें।
                </p>
              </div>

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loadingAction}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-slate-400 font-black rounded-xl text-sm transition flex items-center justify-center gap-3 shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Google खाते से लॉगिन करें</span>
              </button>

              <div className="flex items-center gap-2 my-2 text-slate-400 text-xs">
                <span className="flex-1 h-px bg-slate-200"></span>
                <span>या ईमेल से</span>
                <span className="flex-1 h-px bg-slate-200"></span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ईमेल (Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पासवर्ड (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="कम से कम 6 अक्षर"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {loadingAction
                      ? 'प्रतीक्षा करें...'
                      : mode === 'signin'
                      ? 'लॉगिन करें (Sign In)'
                      : 'नया खाता बनाएं (Sign Up)'}
                  </span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setErrorMsg('');
                    }}
                    className="text-xs text-amber-600 hover:underline font-bold"
                  >
                    {mode === 'signin'
                      ? 'नया खाता बनाना चाहते हैं? रजिस्टर करें'
                      : 'पहले से खाता है? लॉगिन करें'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
