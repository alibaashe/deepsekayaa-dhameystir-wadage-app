import React, { useEffect, useState } from 'react';
import { MobilePassengerApp } from './components/Passenger/MobilePassengerApp';
import { MobileAppContainer } from './components/Mobile/MobileAppContainer';
import { RideCompletionModal } from './components/Passenger/RideCompletionModal';
import { LoginScreen } from './components/Auth/LoginScreen';
import { InAppVoiceCallModal } from './components/Call/InAppVoiceCallModal';
import { StartupSplashScreen } from './components/Common/StartupSplashScreen';
import { RideProvider, useRide } from './context/RideContext';
import { FuelProvider } from './context/FuelContext';
import { Shield } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    currentRide,
    activeCallSession,
    isCallModalOpen,
    setIsCallModalOpen,
    selfOrderAlertMsg,
    dismissSelfOrderAlert,
    setRole,
  } = useRide();

  const [riderSplashFinished, setRiderSplashFinished] = useState(false);

  useEffect(() => {
    setRole('passenger');
  }, [setRole]);

  const isRiderLoggedIn = currentUser && currentUser.role === 'passenger';

  if (!riderSplashFinished) {
    return (
      <StartupSplashScreen
        appType="rider"
        onFinish={() => setRiderSplashFinished(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-full flex-1 flex items-center justify-center p-0 sm:p-4">
        <MobileAppContainer
          appName="Wadaage Rider"
          appType="rider"
        >
          {isRiderLoggedIn ? (
            <>
              <MobilePassengerApp />
              {currentRide?.status === 'completed' && <RideCompletionModal />}
            </>
          ) : (
            <LoginScreen />
          )}
        </MobileAppContainer>
      </div>

      {isCallModalOpen && activeCallSession && (
        <InAppVoiceCallModal
          session={activeCallSession}
          currentUserId={currentUser?.id || ''}
          onClose={() => setIsCallModalOpen(false)}
        />
      )}

      {selfOrderAlertMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Shield className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Action Denied</h3>
              <p className="text-xs font-semibold text-rose-300 mt-2">{selfOrderAlertMsg}</p>
            </div>
            <button
              onClick={dismissSelfOrderAlert}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <RideProvider>
      <FuelProvider>
        <MainAppContent />
      </FuelProvider>
    </RideProvider>
  );
}


