import { useEffect, useState } from "react";
import { useI18n } from "../context/I18nContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const { lang } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Agar foydalanuvchi allaqachon yopgan bo'lsa yoki ilova ichida (standalone) bo'lsa ko'rsatmaymiz
    const dismissed = localStorage.getItem("medax_pwa_dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (dismissed || isStandalone) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowBanner(false);
    localStorage.setItem("medax_pwa_dismissed", "1");
  };

  if (!showBanner || isDismissed) {
    return null;
  }

  return (
    <aside className="pwa-install-banner" aria-label="Ilovani o'rnatish">
      <div className="pwa-banner-content">
        <div className="pwa-app-icon-wrap">
          <img src="/favicon-192x192.png" alt="Medax" width={42} height={42} />
        </div>
        <div className="pwa-banner-text">
          <strong>Medax mobil ilovasi</strong>
          <p>
            {lang === "ru"
              ? "Установите приложение на экран телефона для быстрого доступа"
              : lang === "en"
              ? "Install Medax on your phone for quick & offline access"
              : "Telefoningizga ilovani o'rnating va internet sekin bo'lsa ham tezkor kiring"}
          </p>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button type="button" className="btn-pwa-install" onClick={handleInstall}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{lang === "ru" ? "Установить" : lang === "en" ? "Install" : "O'rnatish"}</span>
        </button>
        <button type="button" className="btn-pwa-close" onClick={handleDismiss} title="Yopish" aria-label="Yopish">
          ✕
        </button>
      </div>
    </aside>
  );
}
