import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAnimatedPresence } from "./UzumSearchBar";
import { useI18n } from "../context/I18nContext";

export interface SubCategoryGroup {
  id: string;
  name: string;
  slug?: string;
  items: string[];
}

export interface MegaCategory {
  id: string;
  name: string;
  slug: string;
  iconImg?: string;
  iconEmoji?: string;
  groups: SubCategoryGroup[];
}

export const MEGA_CATEGORIES: MegaCategory[] = [
  {
    id: "supplies",
    name: "Tibbiy buyumlar",
    slug: "tibbiy-buyumlar",
    iconImg: "/icons/consumables.png",
    groups: [
      {
        id: "c-injection",
        name: "Inyeksiya va infuziya vositalari",
        items: [
          "Bir martalik 2/5/10/20ml shpritslar",
          "Eritma quyish sistemalari (kapelnitsa)",
          "Periferik venoz kateterlar (braunyulya)",
          "Kapalak ignalar va infuzion shtativlar"
        ]
      },
      {
        id: "c-gloves",
        name: "Qo'lqoplar va tibbiy kiyimlar",
        items: [
          "Nitril ko'rik qo'lqoplari (kukunsiz)",
          "Lateks steril jarrohlik qo'lqoplari",
          "Tibbiy himoya niqoblari va qalpoqlar",
          "Bir martalik baxila va steril xalatlar"
        ]
      },
      {
        id: "c-dressing",
        name: "Bog'lov va fiksatsiya vositalari",
        items: [
          "Steril doka va tibbiy bintlar",
          "Gipoallergen jarrohlik leykoplastirlari",
          "Elastik fiksator bintlar",
          "Geparin tiqinlari va qon to'xtatuvchi bog'lamlar"
        ]
      },
      {
        id: "c-disinfection",
        name: "Dezinfeksiya va gigiyena",
        items: [
          "Teri va qo'l antiseptiklari",
          "Uskuna va yuzalarni tozalash vositalari",
          "Tibbiy bir martalik choyshablar",
          "Chiqindilarni utilizatsiya qilish paketlari"
        ]
      }
    ]
  },
  {
    id: "apparatus",
    name: "Tibbiy apparaturalar",
    slug: "tibbiy-apparaturalar",
    iconEmoji: "🔬",
    groups: [
      {
        id: "u-ultrasound",
        name: "Ultratovush diagnostika (UZI)",
        items: [
          "Statsionar rangli doppler UZI",
          "Portativ noutbuk tipidagi UZI apparatlari",
          "Simsiz cho'ntak UZI datchiklari",
          "4D akusherlik va kardiologik datchiklar"
        ]
      },
      {
        id: "i-ventilator",
        name: "IVL va nafas apparatlari",
        items: [
          "Statsionar intensiv o'pka ventilyatsiyasi",
          "Portativ tez yordam IVL apparatlari",
          "CPAP va BiPAP noinvaziv apparatlar",
          "Kislorod konsentratorlari (5L/10L)"
        ]
      },
      {
        id: "i-monitors",
        name: "Bemor monitorlari va EKG",
        items: [
          "Ko'p parametrli reanimatsiya monitorlari",
          "3/6/12-kanalli raqamli EKG apparatlari",
          "Xolter sutkalik EKG monitorlari",
          "Statsionar va barmoq pulsoksimetrlari"
        ]
      },
      {
        id: "i-defibrillators",
        name: "Defibrillyator va nasoslar",
        items: [
          "Professional bifazik defibrillyatorlar",
          "Avtomatik tashqi defibrillyatorlar (AED)",
          "Shpritsli mikrodozator nasoslar",
          "Volumetrik tomchi infuzion nasoslar"
        ]
      }
    ]
  },
  {
    id: "equipment",
    name: "Tibbiy jihozlar",
    slug: "tibbiy-jihozlar",
    iconImg: "/icons/surgery.png",
    groups: [
      {
        id: "f-tables",
        name: "Operatsiya stollari va chiroqlar",
        items: [
          "Elektr-gidravlik operatsiya stollari",
          "Mexanik universal jarrohlik stollari",
          "Shiftga o'rnatiladigan LED jarrohlik chiroqlari",
          "Mobil portativ operatsiya yoritgichlari"
        ]
      },
      {
        id: "f-beds",
        name: "Funksional karavotlar va mebellar",
        items: [
          "3 va 4 motorli elektr reanimatsiya karavotlari",
          "Gidravlik bemor aravachalari (katalka)",
          "Anesteziolog va muolaja aravachalari",
          "Ginekologik ko'rik kreslolari va kuchetkalar"
        ]
      },
      {
        id: "s-endoscopy",
        name: "Endoskopiya va jarrohlik majmualari",
        items: [
          "4K Laparoskopik jarrohlik minoralari",
          "Yuqori chastotali elektrojarrohlik koagulyatorlari",
          "Operatsiya xonasi video integratsiya tizimlari",
          "4K tibbiy jarrohlik monitorlari"
        ]
      },
      {
        id: "s-sterilization",
        name: "Sterilizatsiya jihozlari",
        items: [
          "Bug'li avtoklavlar (B-klass)",
          "Ultratovushli yuvish vannalari",
          "Quruq issiq havoli sterilizatsiya shkaflari",
          "Plazmali past haroratli sterilizatorlar"
        ]
      }
    ]
  },
  {
    id: "reagents",
    name: "Laboratoriya reagentlari",
    slug: "laboratoriya-reagentlari",
    iconImg: "/icons/lab.png",
    groups: [
      {
        id: "l-biochem",
        name: "Biokimyoviy reagentlar",
        items: [
          "Klinik-biokimyoviy tahlil reagentlari",
          "Jigar va buyrak funksiyasi test to'plamlari",
          "Lipid spektri va fermentlar reaktivlari",
          "Standart kalibratorlar va nazorat zardoblari"
        ]
      },
      {
        id: "l-hematology",
        name: "Gematologik reagentlar",
        items: [
          "3-diff va 5-diff gematologik analizator reagentlari",
          "Izotonik erituvchi (Diluent) va Lizislovchi eritma",
          "Tozalovchi (Cleaner) va yuvuvchi eritmalar",
          "Gematologik nazorat qoni (Control Blood)"
        ]
      },
      {
        id: "l-rapid",
        name: "Ekspress testlar va PZR",
        items: [
          "Infeksion kasalliklar tezkor ekspress testlari",
          "Gormonal va onkomarker PZR to'plamlari",
          "Kardiospesifik markerlar (Troponin, D-Dimer)",
          "Siydik tahlili indikator test-tasmachalari"
        ]
      },
      {
        id: "l-glassware",
        name: "Laboratoriya sarflov vositalari",
        items: [
          "Vakuumli qon olish probirkalari (vakutayner)",
          "Avtomatik dozator pipetka uchliklari (tips)",
          "Mikroskop buyum va yopqich oynalari",
          "Sentrifuga probirkalari va Petri kosachalari"
        ]
      }
    ]
  },
  {
    id: "orthopedics",
    name: "Ortopedik mahsulotlar",
    slug: "ortopedik-mahsulotlar",
    iconImg: "/icons/wheelchair.png",
    groups: [
      {
        id: "o-corsets",
        name: "Korset va bandajlar",
        items: [
          "Umurtqa pog'onasi va bel fiksator korsetlari",
          "Tizza va to'piq bo'g'imi elastik bandajlari",
          "Bo'yin fiksator yoqalari (Shans yoqasi)",
          "Yelka va tirsak bo'g'imi bandajlari"
        ]
      },
      {
        id: "o-wheelchairs",
        name: "Nogironlar aravachalari",
        items: [
          "Mexanik buklanadigan xona va ko'cha aravachalari",
          "Masofaviy pultli akkumulyatorli elektr aravachalar",
          "Faol va sport nogironlar aravachalari",
          "Sanitariya moslamali ko'p funksiyali aravachalar"
        ]
      },
      {
        id: "o-walking",
        name: "Yurish tayanch vositalari",
        items: [
          "Yengil alyuminiy buklanuvchi xodunoklar",
          "Tormozli to'rt g'ildirakli rollatorlar",
          "Qo'ltiqtayoq va tirsak tayanchlari",
          "Balandligi sozlanuvchi teleskopik hassalar"
        ]
      },
      {
        id: "o-rehab",
        name: "Reabilitatsiya va parvarish",
        items: [
          "Prolejinlarga qarshi kompressorli matraslar",
          "Bo'g'im harakatini tiklash trenajyorlari",
          "Ortopedik uyqu yostiqlari va to'shaklar",
          "Bolalar DMO (DSP) reabilitatsiya vositalari"
        ]
      }
    ]
  }
];

const LOCALIZED_CATS: Record<string, Record<"uz" | "ru" | "en", string>> = {
  supplies: {
    uz: "Tibbiy buyumlar",
    ru: "Медицинские изделия",
    en: "Medical Supplies"
  },
  apparatus: {
    uz: "Tibbiy apparaturalar",
    ru: "Медицинская аппаратура",
    en: "Medical Apparatus"
  },
  equipment: {
    uz: "Tibbiy jihozlar",
    ru: "Медицинское оборудование",
    en: "Medical Equipment"
  },
  reagents: {
    uz: "Laboratoriya reagentlari",
    ru: "Лабораторные реагенты",
    en: "Laboratory Reagents"
  },
  orthopedics: {
    uz: "Ortopedik mahsulotlar",
    ru: "Ортопедическая продукция",
    en: "Orthopedic Products"
  }
};

const LOCALIZED_GROUPS: Record<string, Record<"uz" | "ru" | "en", string>> = {
  "w-electric": { uz: "Elektr va pultli aravachalar", ru: "Электрические коляски с пультом", en: "Electric & Powered Chairs" },
  "w-manual": { uz: "Mexanik aravachalar", ru: "Механические коляски", en: "Manual Wheelchairs" },
  "w-pediatric": { uz: "Bolalar reabilitatsiyasi", ru: "Детская реабилитация", en: "Pediatric Rehabilitation" },
  "w-parts": { uz: "Aksessuarlar va qismlar", ru: "Аксессуары и запчасти", en: "Accessories & Parts" },
  "s-instruments": { uz: "Jarrohlik asboblari", ru: "Хирургические инструменты", en: "Surgical Instruments" },
  "s-electrosurgery": { uz: "Elektrojarrohlik", ru: "Электрохирургия", en: "Electrosurgery" },
  "s-lighting": { uz: "Operatsiya yoritgichlari", ru: "Операционные светильники", en: "Surgical Lighting" },
  "s-sterilization": { uz: "Sterilizatsiya uskunalari", ru: "Стерилизационное оборудование", en: "Sterilization Devices" },
  "f-tables": { uz: "Operatsiya stollari", ru: "Операционные столы", en: "Operating Tables" },
  "f-beds": { uz: "Funksional karavotlar", ru: "Функциональные кровати", en: "Hospital Beds" },
  "f-couches": { uz: "Kreslo va kuchetkalar", ru: "Кресла и кушетки", en: "Couches & Chairs" },
  "f-storage": { uz: "Aravacha va shkaflar", ru: "Медицинские тележки и шкафы", en: "Medical Carts & Cabinets" },
  "l-analyzers": { uz: "Tahlil analizatorlari", ru: "Лабораторные анализаторы", en: "Clinical Analyzers" },
  "l-general": { uz: "Umumiy laboratoriya", ru: "Общелабораторное оборудование", en: "General Laboratory" },
  "l-rapid": { uz: "Ekspress test & asboblar", ru: "Экспресс-тесты и приборы", en: "Rapid Tests & Meters" },
  "l-consumables": { uz: "Idishlar va sarflovlar", ru: "Посуда и расходные материалы", en: "Lab Glassware & Consumables" },
  "c-gloves": { uz: "Qo'lqoplar va himoya", ru: "Перчатки и средства защиты", en: "Gloves & Protection" },
  "c-injection": { uz: "Inyeksiya va infuziya", ru: "Инъекции и инфузии", en: "Injection & Infusion" },
  "c-dressing": { uz: "Bog'lov vositalari", ru: "Перевязочные средства", en: "Wound Care & Dressings" },
  "c-disinfection": { uz: "Dezinfeksiya va gigiyena", ru: "Дезинфекция и гигиена", en: "Disinfection & Hygiene" },
  "u-machines": { uz: "UZI apparatlari", ru: "УЗИ аппараты", en: "Ultrasound Scanners" },
  "u-probes": { uz: "UZI datchiklari", ru: "УЗИ датчики", en: "Ultrasound Probes" },
  "u-functional": { uz: "Funksional diagnostika", ru: "Функциональная диагностика", en: "Functional Diagnostics" },
  "u-xray": { uz: "Rentgen apparatlari", ru: "Рентген аппараты", en: "X-Ray Equipment" },
  "i-ventilator": { uz: "IVL va nafas apparatlari", ru: "Аппараты ИВЛ и дыхания", en: "Ventilators & Respiratory" },
  "i-monitors": { uz: "Bemor monitorlari", ru: "Мониторы пациента", en: "Patient Monitors" },
  "i-defibrillators": { uz: "Defibrillyatorlar", ru: "Дефибрилляторы", en: "Defibrillators" },
  "i-infusion": { uz: "Infuzion uskunalar", ru: "Инфузионное оборудование", en: "Infusion Pumps" },
  "r-walking": { uz: "Yurish vositalari", ru: "Средства для ходьбы", en: "Mobility & Walking Aids" },
  "r-physio": { uz: "Fizioterapiya apparatlari", ru: "Физиотерапия", en: "Physiotherapy Devices" },
  "r-exercise": { uz: "Tiklash trenajyorlari", ru: "Тренажеры реабилитации", en: "Rehabilitation Trainers" },
  "r-orthotics": { uz: "Bandaj va fiksatorlar", ru: "Бандажи и корсеты", en: "Braces & Orthotics" }
};

interface UzumCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UzumCatalogModal({ isOpen, onClose }: UzumCatalogModalProps) {
  const { lang } = useI18n();
  const [activeCatId, setActiveCatId] = useState<string>(MEGA_CATEGORIES[0].id);
  const { mounted, animState } = useAnimatedPresence(isOpen, 220);

  if (!mounted) return null;

  const activeCategory = MEGA_CATEGORIES.find((c) => c.id === activeCatId) || MEGA_CATEGORIES[0];
  const activeCatTitle = LOCALIZED_CATS[activeCategory.id]?.[lang] || activeCategory.name;

  return (
    <div className={`uz-catalog-mega-dropdown ${animState}`} role="dialog" aria-modal="true">
      <div className="wrap uz-catalog-mega-wrap">
        <div className="uz-catalog-mega-body">
          {/* Left Column: Vertical Category List */}
          <nav className="uz-catalog-sidebar" aria-label="Asosiy toifalar">
            <ul className="uz-catalog-cat-list">
              {MEGA_CATEGORIES.map((cat) => {
                const isActive = cat.id === activeCategory.id;
                return (
                  <li key={cat.id} className="uz-catalog-cat-item">
                    <button
                      type="button"
                      className={`uz-catalog-cat-btn ${isActive ? "is-active" : ""}`}
                      onMouseEnter={() => setActiveCatId(cat.id)}
                      onClick={() => setActiveCatId(cat.id)}
                    >
                      <span className="uz-catalog-cat-btn-left">
                        {cat.iconImg ? (
                          <img src={cat.iconImg} alt="" className="uz-catalog-icon-img" />
                        ) : (
                          <span className="uz-catalog-icon-emoji">{cat.iconEmoji}</span>
                        )}
                        <span className="uz-catalog-cat-name">{LOCALIZED_CATS[cat.id]?.[lang] || cat.name}</span>
                      </span>
                      <svg
                        className="uz-catalog-chevron"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right Column: Active Category Subgroups */}
          <div className="uz-catalog-content">
            {/* Header: Active Category Title with arrow */}
            <div className="uz-catalog-content-header">
              <Link
                to={`/catalog?category=${activeCategory.slug}`}
                onClick={onClose}
                className="uz-catalog-main-link"
              >
                <span>{activeCatTitle}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>

            {/* Grid of Subcategories */}
            <div className="uz-catalog-grid">
              {activeCategory.groups.map((group) => {
                const groupTitle = LOCALIZED_GROUPS[group.id]?.[lang] || group.name;
                return (
                  <div key={group.id} className="uz-catalog-group">
                    <Link
                      to={`/catalog?category=${activeCategory.slug}&q=${encodeURIComponent(group.name)}`}
                      onClick={onClose}
                      className="uz-catalog-group-title"
                    >
                      {groupTitle}
                    </Link>
                  <ul className="uz-catalog-item-list">
                    {group.items.map((item, idx) => (
                      <li key={idx} className="uz-catalog-subitem">
                        <Link
                          to={`/catalog?q=${encodeURIComponent(item)}`}
                          onClick={onClose}
                          className="uz-catalog-item-link"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
