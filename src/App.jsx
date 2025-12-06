import React, { useState, useEffect, useRef } from 'react';
import { 
  Nfc, CheckCircle, XCircle, Loader2, 
  Wifi, Bell, ArrowRight, User, Home, 
  PieChart, Clock, CreditCard, ChevronLeft 
} from 'lucide-react';

// --- SIMULATION DU BACKEND ---
// Base de données simulée pour la démo
const DATABASE_CARTES = {
  'CLIENT_A': { telephone: '099000001', nom: 'Jean (Client)', solde: 5000 },
};

const App = () => {
  // MONTANT (Saisie), SWAP (Attente NFC), ATTENTE_PIN (Popup client), SUCCES, ECHEC
  const [step, setStep] = useState('MONTANT'); 
  const [montant, setMontant] = useState('');
  const [nfcStatus, setNfcStatus] = useState('UNSUPPORTED'); // UNSUPPORTED, READY, SCANNING, ERROR, STOPPED
  const [bonusChauffeur, setBonusChauffeur] = useState(42);

  // États pour le Popup client (simulation USSD)
  const [showClientPopup, setShowClientPopup] = useState(false);
  const [clientPinStep, setClientPinStep] = useState('IDLE'); // IDLE, PROMPT, PROCESSING
  const [pinInput, setPinInput] = useState('');

  // Refs pour le NFC
  const ndefRef = useRef(null);
  const abortRef = useRef(null);

  // --- LOGIQUE NFC & INITIALISATION ---
  useEffect(() => {
    // Vérifie si WebNFC est disponible
    if ('NDEFReader' in window) setNfcStatus('READY');
    return () => stopNfcScan(); // Nettoyage lors du démontage
  }, []);

  /**
   * Démarre le scan NFC. 
   * Dans un environnement réel, ceci demande l'autorisation de l'utilisateur.
   */
  const startNfcScan = async () => {
    if (!('NDEFReader' in window)) return;
    try {
      stopNfcScan(); // Arrête tout scan précédent
      
      const ndef = new NDEFReader();
      const controller = new AbortController();
      abortRef.current = controller;
      ndefRef.current = ndef;
      
      await ndef.scan({ signal: controller.signal });
      setNfcStatus('SCANNING');

      // Simule la lecture du tag. Pour la démo, n'importe quel tag déclenche l'action.
      ndef.onreading = (event) => {
         // Dans une vraie application, on décoderait le tag pour valider le jeton.
         console.log("NFC Tag Lu:", event.message);
         stopNfcScan();
         simulerSwapNFC(); // Passage à l'étape de validation du PIN
      };

      ndef.onreadingerror = (ev) => {
        console.error('Erreur lecture NFC', ev);
        setNfcStatus('ERROR');
      };

    } catch (error) {
      console.error('Erreur startNfcScan', error);
      setNfcStatus('ERROR');
    }
  };

  /**
   * Arrête le scan NFC
   */
  const stopNfcScan = () => {
    try {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        ndefRef.current = null;
        // Met à jour l'état si on était en train de scanner
        setNfcStatus(prev => prev === 'SCANNING' ? 'READY' : prev);
    } catch (e) {
        console.warn('Erreur stopNfcScan', e);
    }
  };

  // --- LOGIQUE DE L'APPLICATION ---

  /**
   * Gère les touches du clavier numérique
   */
  const handleKeypad = (num) => {
    if (num === 'C') setMontant('');
    else if (num === 'VAL') {
      if (parseInt(montant) > 0) setStep('SWAP'); // Passe à l'étape NFC si le montant est valide
    } else {
      // Limite la saisie à 7 chiffres
      if (montant.length < 7) setMontant(prev => prev + num);
    }
  };

  /**
   * Simule la détection réussie du NFC et l'envoi de la requête client
   */
  const simulerSwapNFC = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(200);
    setStep('ATTENTE_PIN');
    // Simule le délai de communication avec le serveur (envoi de la requête USSD)
    setTimeout(() => {
      setShowClientPopup(true); // Affiche le popup de saisie PIN du client
      setClientPinStep('PROMPT');
    }, 1500);
  };

  /**
   * Validation du PIN client (simulation)
   */
  const validerPinClient = () => {
    setClientPinStep('PROCESSING');
    setTimeout(() => {
      if (pinInput === '1234') triggerSuccess(); // PIN correct (simulation)
      else triggerFailure(); // PIN incorrect
    }, 1500);
  };

  /**
   * Logique de succès de la transaction
   */
  const triggerSuccess = () => {
    setClientPinStep('IDLE');
    setShowClientPopup(false);
    setStep('SUCCES');
    setBonusChauffeur(prev => prev + 1);
    setPinInput('');
  };

  /**
   * Logique d'échec de la transaction
   */
  const triggerFailure = () => {
    setClientPinStep('IDLE');
    setShowClientPopup(false);
    setStep('ECHEC');
    setPinInput('');
  };

  /**
   * Réinitialise l'application à l'écran de saisie du montant
   */
  const reset = () => {
    setStep('MONTANT');
    setMontant('');
    setShowClientPopup(false);
    setPinInput('');
    stopNfcScan();
  };

  // Montant du solde calculé (pour l'affichage sur la carte)
  const soldeTotal = bonusChauffeur * 1250;

  // --- DESIGN ET RENDER ---
  
  return (
    // Conteneur principal (Light Mode)
    <div className="min-h-screen bg-[#F2F4F8] text-gray-800 font-sans flex flex-col items-center justify-center">
      
      {/* Container Mobile - Simule un appareil mobile */}
      <div className="w-full max-w-md h-screen md:h-[90vh] bg-[#F5F6FA] md:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* HEADER (Barre supérieure) */}
        <div className="pt-8 pb-4 px-6 flex justify-between items-center bg-[#F5F6FA]">
          <div className="flex items-center gap-3">
             {/* Avatar (utilisé pour le look propre et moderne) */}
             <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden border-2 border-white shadow-sm">
                {/* Image de profil aléatoire */}
                <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                    alt="avatar" 
                    className="w-full h-full object-cover"
                />
             </div>
             <div>
                <p className="text-xs text-gray-400 font-medium">Bienvenue,</p>
                <h1 className="text-sm font-bold text-[#1A1F3D]">Chauffeur Marc</h1>
             </div>
          </div>
          <div className="relative p-2 bg-white rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer">
             <Bell size={20} className="text-gray-600" />
             <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </div>
        </div>

        {/* CONTENU PRINCIPAL SCROLLABLE */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
          
          {step === 'MONTANT' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* CARTE FINTECH (Style Credit Card) */}
              <div className="w-full bg-[#0B1221] rounded-[30px] p-6 text-white shadow-xl shadow-blue-900/20 mb-8 relative overflow-hidden">
                 {/* Effets décoratifs de la carte */}
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
                 
                 <div className="flex justify-between items-start mb-8">
                    <span className="text-gray-400 font-medium text-sm">Portefeuille Virtuel</span>
                    <span className="font-bold italic text-xl tracking-wider">SWAP</span>
                 </div>
                 
                 <div className="mb-6">
                    <h2 className="text-3xl font-bold mb-1 tracking-tight">
                        {soldeTotal.toLocaleString('fr-CD')} <span className="text-sm font-normal text-gray-400">CDF</span>
                    </h2>
                    <p className="text-gray-400 text-xs">{bonusChauffeur} transactions réussies</p>
                 </div>

                 <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-gray-400 uppercase">Titulaire</span>
                       <span className="font-medium text-sm tracking-wide">MARC KABEYA</span>
                    </div>
                    <div className="font-mono text-sm tracking-widest text-gray-300">
                       •••• 4242
                    </div>
                 </div>
              </div>

              {/* SECTION SAISIE MONTANT */}
              <div className="mb-6">
                 <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-[#1A1F3D] text-lg">Entrez le montant</h3>
                    <span className="text-xs text-blue-500 font-medium cursor-pointer">Historique</span>
                 </div>
                 
                 {/* Affichage du montant */}
                 <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex justify-between items-center mb-6 transition-all duration-300">
                    <div className="flex flex-col">
                       <span className="text-xs text-gray-400">Montant à collecter</span>
                       <div className="text-2xl font-bold text-[#1A1F3D] flex items-center gap-1">
                          {montant || '0'} <span className="text-sm text-gray-400 font-normal">FC</span>
                       </div>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                       <CreditCard size={20}/>
                    </div>
                 </div>

                 {/* PAVÉ NUMÉRIQUE (Style Neumorphism / Clean Grid) */}
                 <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0].map((item) => (
                       <button 
                         key={item}
                         onClick={() => handleKeypad(item)}
                         className={`
                           h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 
                           shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.8)]
                           ${item === 'C' 
                             ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                             : 'bg-white text-[#1A1F3D] hover:bg-gray-50'
                           }
                         `}
                       >
                         {item}
                       </button>
                    ))}
                    {/* Bouton de validation */}
                    <button 
                      onClick={() => handleKeypad('VAL')}
                      disabled={!parseInt(montant) > 0}
                      className={`
                        bg-[#0B1221] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95
                        ${!parseInt(montant) > 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-blue-900/20'}
                      `}
                    >
                      <ArrowRight size={24} />
                    </button>
                 </div>
              </div>
            </div>
          )}

          {step === 'SWAP' && (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
               {/* Bouton de retour */}
               <div className="flex items-center gap-4 mb-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setStep('MONTANT')}>
                  <div className="p-2 bg-white rounded-full shadow-md">
                    <ChevronLeft size={24} className="text-[#1A1F3D]"/>
                  </div>
                  <h2 className="text-xl font-bold text-[#1A1F3D]">Paiement Sans Contact</h2>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center space-y-8 pb-10">
                  <div className="relative">
                     {/* Ondes d'animation pour l'attente du NFC */}
                     <div className={`absolute inset-0 bg-blue-500 rounded-full ${nfcStatus === 'SCANNING' ? 'opacity-20 animate-ping' : 'opacity-0'}`}></div>
                     <div className={`absolute inset-[-20px] bg-blue-500 rounded-full ${nfcStatus === 'SCANNING' ? 'opacity-10 animate-pulse duration-[3000ms]' : 'opacity-0'}`}></div>
                     
                     <div className="relative w-48 h-48 bg-white rounded-full shadow-xl shadow-gray-300 flex items-center justify-center z-10 border-4 border-dashed border-gray-200">
                        <Nfc size={80} className={`
                            ${nfcStatus === 'SCANNING' ? 'text-blue-600 scale-105' : 'text-gray-400'}
                            transition-all duration-500
                        `} />
                     </div>
                  </div>

                  <div className="text-center space-y-2">
                     <h3 className="text-2xl font-bold text-[#1A1F3D]">Approchez le client</h3>
                     <p className="text-gray-400">Montant : <span className="font-bold text-blue-600">{montant} FC</span></p>
                  </div>

                  {nfcStatus === 'UNSUPPORTED' || nfcStatus === 'READY' ? (
                     <button 
                        onClick={startNfcScan} 
                        className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
                     >
                        Activer le Scan NFC
                     </button>
                  ) : nfcStatus === 'SCANNING' ? (
                     <button 
                        onClick={stopNfcScan} 
                        className="mt-4 px-8 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                     >
                        Arrêter le Scan
                     </button>
                  ) : null}
                  
                  {nfcStatus !== 'SCANNING' && (
                     <button onClick={simulerSwapNFC} className="mt-8 px-6 py-3 bg-gray-200 text-gray-600 rounded-xl font-medium text-xs hover:bg-gray-300 transition-colors">
                        (Simuler Sans Contact)
                     </button>
                  )}
               </div>
            </div>
          )}

          {step === 'SUCCES' && (
             <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in duration-300">
                <div className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
                   <CheckCircle size={64} className="text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-4xl font-black text-[#1A1F3D] mb-2">Transaction OK</h2>
                <p className="text-gray-500 mb-4 text-xl font-semibold">{montant} FC</p>
                
                <div className="w-full bg-white rounded-2xl p-4 shadow-md border border-gray-100 mb-8">
                   <div className="flex justify-between mb-2">
                      <span className="text-gray-400 text-sm">De</span>
                      <span className="font-bold text-green-600">Jean (Client)</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Date</span>
                      <span className="font-bold text-[#1A1F3D]">{new Date().toLocaleTimeString()}</span>
                   </div>
                   <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-200">
                      <span className="text-gray-400 text-sm">Nouveau Bonus</span>
                      <span className="font-bold text-blue-600">+1 Point</span>
                   </div>
                </div>

                <button onClick={reset} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-transform">
                   Nouvelle Course
                </button>
             </div>
          )}
          
          {step === 'ECHEC' && (
             <div className="flex flex-col items-center justify-center h-full text-center animate-in shake">
                <div className="w-28 h-28 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-500/30">
                   <XCircle size={64} className="text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-4xl font-black text-[#1A1F3D] mb-2">Échec du Paiement</h2>
                <p className="text-gray-500 mb-8 text-lg">PIN Incorrect ou Solde Insuffisant.</p>
                <button onClick={reset} className="w-full py-4 bg-[#1A1F3D] text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                   Réessayer
                </button>
             </div>
          )}

           {step === 'ATTENTE_PIN' && (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 size={64} className="text-blue-600 animate-spin mb-6" />
                <h3 className="text-2xl font-bold text-[#1A1F3D]">En attente du client...</h3>
                <p className="text-gray-400 text-sm mt-2">Demande de confirmation envoyée</p>
             </div>
           )}

        </div>

        {/* BOTTOM NAVIGATION (Style Clean UI) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white h-20 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-around items-center px-2 z-20">
           {/* Icône Home (Actif) */}
           <button className="p-3 text-blue-600 flex flex-col items-center gap-1">
              <Home size={24} strokeWidth={2.5} />
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
           </button>
           {/* Icônes Inactives */}
           <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
              <Clock size={24} />
           </button>
           
           {/* Bouton Scan flottant (Centre) */}
           <div className="relative -top-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 text-white border-4 border-white">
                 <Nfc size={30} />
              </div>
           </div>

           {/* Icônes Inactives */}
           <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
              <PieChart size={24} />
           </button>
           <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
              <User size={24} />
           </button>
        </div>

        {/* OVERLAY POPUP SIMULATION CLIENT (Saisie PIN) */}
        {showClientPopup && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
             <div className="w-full bg-white rounded-t-3xl p-8 animate-in slide-in-from-bottom duration-300">
                
                <div className="flex justify-center mb-4">
                   <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {clientPinStep === 'PROMPT' ? (
                   <>
                     <h3 className="text-lg font-bold text-center text-[#1A1F3D] mb-1">Confirmer Paiement</h3>
                     <p className="text-center text-gray-500 text-sm mb-6">Vers Chauffeur Marc - <span className="text-[#1A1F3D] font-bold">{montant} FC</span></p>
                     
                     {/* Champ PIN sécurisé */}
                     <div className="bg-gray-100 rounded-xl p-4 mb-6 shadow-inner">
                        <input 
                           type="password" maxLength={4}
                           value={pinInput} onChange={(e) => setPinInput(e.target.value)}
                           className="w-full bg-transparent text-center text-3xl font-mono tracking-[1em] outline-none text-[#1A1F3D]"
                           placeholder="••••"
                           autoFocus
                        />
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => setShowClientPopup(false)} className="flex-1 py-4 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
                        <button onClick={validerPinClient} className="flex-1 py-4 text-white font-bold bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">Valider</button>
                     </div>
                   </>
                ) : (
                   <div className="flex flex-col items-center py-8">
                      <Loader2 size={40} className="animate-spin text-blue-600 mb-4"/>
                      <span className="font-bold text-gray-600">Traitement sécurisé...</span>
                   </div>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
