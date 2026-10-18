import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBgxMhajHuz77_tajcd4BcbgKRFNZAtRZ0",
  authDomain: "medax-314b8.firebaseapp.com",
  projectId: "medax-314b8",
  storageBucket: "medax-314b8.firebasestorage.app",
  messagingSenderId: "460292335370",
  appId: "1:460292335370:web:b0766c53ac76a704d97cf3",
  measurementId: "G-48743MBD80",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage();

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function formatPhoneE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (raw.trim().startsWith("+")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export function getRecaptchaVerifier(containerId: string = "firebase-recaptcha-container"): RecaptchaVerifier {
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }

  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {}
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA muvaffaqiyatli o'tdi
    },
    "expired-callback": () => {
      // reCAPTCHA eskirgan
    },
  });

  return recaptchaVerifier;
}

export async function sendFirebasePhoneOtp(
  phone: string,
  containerId: string = "firebase-recaptcha-container"
): Promise<ConfirmationResult> {
  const formatted = formatPhoneE164(phone);
  const verifier = getRecaptchaVerifier(containerId);
  return await signInWithPhoneNumber(auth, formatted, verifier);
}

export function translateFirebaseError(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-phone-number":
      return "Telefon raqami noto'g'ri formatda. Misol: +998 90 123 45 67";
    case "auth/missing-phone-number":
      return "Telefon raqamini kiriting.";
    case "auth/quota-exceeded":
      return "SMS yuborish kvotasi tugagan. Iltimos, keyinroq urinib ko'ring.";
    case "auth/too-many-requests":
      return "Juda ko'p urinish amalga oshirildi. Iltimos, biroz kutib qayta urinib ko'ring.";
    case "auth/invalid-verification-code":
      return "Tasdiqlash kodi noto'g'ri kiritildi.";
    case "auth/code-expired":
      return "SMS kod muddati eskirgan. Yangi kod so'rang.";
    case "auth/captcha-check-failed":
      return "Xavfsizlik tekshiruvida (reCAPTCHA) xatolik yuz berdi. Sahifani yangilang.";
    case "auth/network-request-failed":
      return "Internet bilan aloqa yo'q yoki tarmoq xatosi yuz berdi.";
    case "auth/operation-not-allowed":
      return "Firebase konsolida Telefon orqali kirish (Phone Auth) yoqilmagan. Firebase Console -> Authentication -> Sign-in method bo'limida Phone providerini yoqing.";
    case "auth/unauthorized-domain":
      return "Sayt domeni Firebase ruxsatnomalariga qo'shilmagan! Firebase Console -> Authentication -> Settings -> Authorized domains bo'limiga ushbu sayt domenini qo'shing.";
    case "auth/invalid-app-credential":
      return "Firebase domen ruxsatida xatolik. Firebase Console -> Authentication -> Settings -> Authorized domains bo'limiga domen qo'shilganligini tekshiring.";
    case "auth/billing-not-enabled":
      return "Firebase bepul tarifida haqiqiy SMS yuborish uchun Blaze tarifi yoki Test raqam qo'shish kerak.";
    default:
      return error?.message || "SMS orqali kirishda xatolik yuz berdi.";
  }
}
