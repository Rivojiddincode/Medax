import { Lang, I18nProvider, useI18n, Translations } from "../context/I18nContext";

export type AdminLang = Lang;
export type { Translations };
export const AdminI18nProvider = I18nProvider;
export const useAdminI18n = useI18n;
