import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAnimatedPresence } from "./UzumSearchBar";

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
    id: "wheelchairs",
    name: "Nogironlar aravachalari",
    slug: "nogironlar-aravachasi",
    iconImg: "/icons/wheelchair.png",
    groups: [
      {
        id: "w-electric",
        name: "Elektr va pultli aravachalar",
        items: [
          "Masofaviy pultli aravachalar",
          "Akkumulyatorli zamonaviy modellar",
          "Buklanadigan yengil elektr aravachalar",
          "Avtomatik tormozli modellar"
        ]
      },
      {
        id: "w-manual",
        name: "Mexanik aravachalar",
        items: [
          "Standart xona va ko'cha aravachalari",
          "Faol (aktiv) sport aravachalari",
          "Sanitariya jihozli aravachalar",
          "Qo'zg'aluvchan suyanchiqli modellar"
        ]
      },
      {
        id: "w-pediatric",
        name: "Bolalar reabilitatsiyasi",
        items: [
          "DMO (DSP) bolalar aravachalari",
          "Bolalar vertikalizatorlari",
          "Fiksatsiyalovchi bolalar kreslolari",
          "Reabilitatsiya o'rindiqlari"
        ]
      },
      {
        id: "w-parts",
        name: "Aksessuarlar va qismlar",
        items: [
          "Litiy-ion akkumulyatorlar",
          "Quyma va pnevmatik g'ildiraklar",
          "Ortopedik xavfsizlik kamarlari",
          "Antiproleyjin o'rindiq yostiqlari"
        ]
      }
    ]
  },
  {
    id: "surgery",
    name: "Jarrohlik jihozlari",
    slug: "jarrohlik",
    iconImg: "/icons/surgery.png",
    groups: [
      {
        id: "s-instruments",
        name: "Jarrohlik asboblari",
        items: [
          "Skalpellar va almashtiriluvchi tig'lar",
          "Qisqichlar va anatomik pinsetlar",
          "Jarrohlik qaychilari",
          "Igna ushlagichlar va kuretkalar"
        ]
      },
      {
        id: "s-electrosurgery",
        name: "Elektrojarrohlik",
        items: [
          "Yuqori chastotali koagulyatorlar",
          "Bipolyar va monopol pinsetlar",
          "Jarrohlik tutunini evakuatorlari",
          "Koagulyatsiya elektrodlari"
        ]
      },
      {
        id: "s-lighting",
        name: "Operatsiya yoritgichlari",
        items: [
          "Shiftga o'rnatiladigan LED chiroqlar",
          "Mobil portativ operatsiya chiroqlari",
          "Jarrohlik binokulyar lupalari",
          "Kamera bilan jihozlangan chiroqlar"
        ]
      },
      {
        id: "s-sterilization",
        name: "Sterilizatsiya uskunalari",
        items: [
          "Bug'li avtoklavlar (B-klass)",
          "Ultratovushli yuvish vannalari",
          "Quruq issiq havoli shkaflar",
          "Plazmali sterilizatorlar"
        ]
      }
    ]
  },
  {
    id: "furniture",
    name: "Tibbiy mebellar",
    slug: "tibbiy-mebel",
    iconImg: "/icons/furniture.png",
    groups: [
      {
        id: "f-tables",
        name: "Operatsiya stollari",
        items: [
          "Elektr-gidravlik operatsiya stollari",
          "Mexanik universal stollar",
          "Rentgen-shaffof jarrohlik stollari",
          "Ortopedik qo'shimcha moslamalar"
        ]
      },
      {
        id: "f-beds",
        name: "Funksional karavotlar",
        items: [
          "3 va 4 motorli elektr karavotlar",
          "Mexanik boshqaruvli karavotlar",
          "Reanimatsiya maxsus karavotlari",
          "Prolejinlarga qarshi matraslar"
        ]
      },
      {
        id: "f-couches",
        name: "Kreslo va kuchetkalar",
        items: [
          "Ginekologik ko'rik kreslolari",
          "Tibbiy ko'rik kuchetkalari",
          "Donor va dializ kreslolari",
          "Kosmetologik ko'p funksiyali kuchetkalar"
        ]
      },
      {
        id: "f-storage",
        name: "Aravacha va shkaflar",
        items: [
          "Anesteziolog va muolaja aravachalari",
          "Dori-darmon saqlash shkaflari",
          "Zanglamas po'lat stolchalar",
          "Tibbiy infuzion shtativlar"
        ]
      }
    ]
  },
  {
    id: "lab",
    name: "Laboratoriya jihozlari",
    slug: "laboratoriya",
    iconImg: "/icons/lab.png",
    groups: [
      {
        id: "l-analyzers",
        name: "Tahlil analizatorlari",
        items: [
          "Biokimyoviy avtomatik analizatorlar",
          "Gematologik analizatorlar (3/5-diff)",
          "Siydik analizatorlari",
          "Koagulometrlar va elektrolit tahlili"
        ]
      },
      {
        id: "l-general",
        name: "Umumiy laboratoriya",
        items: [
          "Laboratoriya mikroskoplari",
          "Tezkor sentrifugalar",
          "Termostatlar va quritish shkaflari",
          "Vorteks va suyuqlik chayqatgichlar"
        ]
      },
      {
        id: "l-rapid",
        name: "Ekspress test & asboblar",
        items: [
          "Professional glyukometrlar",
          "Avtomatik mexanik pipetkalar (dozatorlar)",
          "Laboratoriya elektron tarozilari",
          "Raqamli pH-metrlar"
        ]
      },
      {
        id: "l-consumables",
        name: "Idishlar va sarflovlar",
        items: [
          "Vakuumli probirkalar (vakutayner)",
          "Laboratoriya shisha idishlari",
          "PZR tahlil sarflov materiallari",
          "Mikroskop buyum va yopqich oynalari"
        ]
      }
    ]
  },
  {
    id: "consumables",
    name: "Sarflov materiallari",
    slug: "nitril-qolqoplar",
    iconImg: "/icons/consumables.png",
    groups: [
      {
        id: "c-gloves",
        name: "Qo'lqoplar va himoya",
        items: [
          "Nitril ko'rik qo'lqoplari (kukunsiz)",
          "Lateks steril jarrohlik qo'lqoplari",
          "Vinil diagnostika qo'lqoplari",
          "Tibbiy himoya niqoblari va qalpoqlar"
        ]
      },
      {
        id: "c-injection",
        name: "Inyeksiya va infuziya",
        items: [
          "Bir martalik 2/5/10/20ml shpritslar",
          "Eritma quyish sistemalari (kapelnitsa)",
          "Periferik venoz kateterlar (braunyulya)",
          "Kapalak ignalar (babochka)"
        ]
      },
      {
        id: "c-dressing",
        name: "Bog'lov vositalari",
        items: [
          "Steril doka va bintlar",
          "Gipoallergen leykoplastirlar",
          "Elastik fiksator bintlar",
          "Geparin tiqinlari va bog'ichlar"
        ]
      },
      {
        id: "c-disinfection",
        name: "Dezinfeksiya va gigiyena",
        items: [
          "Teri va qo'l antiseptiklari",
          "Uskuna va yuzalarni tozalash vositalari",
          "Bir martalik baxila va fartuklar",
          "Tibbiy bir martalik choyshablar"
        ]
      }
    ]
  },
  {
    id: "ultrasound",
    name: "UZI va diagnostika",
    slug: "ultratovush-diagnostikasi",
    iconEmoji: "🔬",
    groups: [
      {
        id: "u-machines",
        name: "UZI apparatlari",
        items: [
          "Statsionar rangli doppler UZI",
          "Portativ noutbuk tipidagi UZI",
          "Simsiz cho'ntak UZI datchiklari",
          "4D akusherlik va ginekologiya UZI"
        ]
      },
      {
        id: "u-probes",
        name: "UZI datchiklari",
        items: [
          "Konveks qorin datchiklari",
          "Lineyniy yuzaki to'qima datchiklari",
          "Transvaginal mikro-konveks datchiklar",
          "Fazalashtirilgan kardiologik datchiklar"
        ]
      },
      {
        id: "u-functional",
        name: "Funksional diagnostika",
        items: [
          "3/6/12-kanalli raqamli EKG apparatlari",
          "Xolter sutkalik EKG va QBosim monitorlari",
          "Kompyuterli spirometrlar",
          "Elektroensefalograf (EEG) apparatlari"
        ]
      },
      {
        id: "u-xray",
        name: "Rentgen apparatlari",
        items: [
          "Mobil palata rentgen apparatlari",
          "Raqamli tekis panelli detektorlar (DR)",
          "Rentgen himoya kiyimlari (fartuklar)",
          "Rentgenplyonka skanerlari"
        ]
      }
    ]
  },
  {
    id: "icu",
    name: "Reanimatsiya va IVL",
    slug: "reanimatsiya-va-anesteziologiya",
    iconEmoji: "🫀",
    groups: [
      {
        id: "i-ventilator",
        name: "IVL va nafas apparatlari",
        items: [
          "Statsionar intensiv o'pka ventilyatsiyasi",
          "Portativ tez yordam IVL apparatlari",
          "CPAP va BiPAP uy sharoiti apparatlari",
          "Kislorod konsentratorlari (5L/10L)"
        ]
      },
      {
        id: "i-monitors",
        name: "Bemor monitorlari",
        items: [
          "Ko'p parametrli reanimatsiya monitorlari",
          "Kapnografiya (EtCO2) modullari",
          "Markaziy monitoring stansiyalari",
          "Barmoq va statsionar pulsoksimetrlar"
        ]
      },
      {
        id: "i-defibrillators",
        name: "Defibrillyatorlar",
        items: [
          "Professional bifazik defibrillyatorlar",
          "Avtomatik tashqi defibrillyatorlar (AED)",
          "Monitorli kardioversiya apparatlari",
          "Bir martalik defibrillyatsiya elektrodlari"
        ]
      },
      {
        id: "i-infusion",
        name: "Infuzion uskunalar",
        items: [
          "Shprisli mikrodozator nasoslar",
          "Volumetrik tomchi infuzion nasoslar",
          "Infuzion suyuqlik va qon isitgichlar",
          "Ko'p kanalli infuzion stansiyalar"
        ]
      }
    ]
  },
  {
    id: "rehab",
    name: "Ortopediya va reabilitatsiya",
    slug: "reabilitatsiya-va-ortopediya",
    iconEmoji: "🏃",
    groups: [
      {
        id: "r-walking",
        name: "Yurish vositalari",
        items: [
          "Yengil buklanuvchi alyuminiy xodunoklar",
          "G'ildirakli rollatorlar (tormozli)",
          "Qo'ltiqtayoq va tirsak tayanchlari",
          "Balandligi sozlanuvchi teleskopik hassalar"
        ]
      },
      {
        id: "r-physio",
        name: "Fizioterapiya apparatlari",
        items: [
          "Magnitoterapiya apparatlari (Almag)",
          "Elektroforez va amplipuls apparatlari",
          "Ultratovushli terapiya apparatlari",
          "Lazeroterapiya apparatlari"
        ]
      },
      {
        id: "r-exercise",
        name: "Tiklash trenajyorlari",
        items: [
          "Qo'l va oyoq pedal trenajyorlari",
          "Passiv bo'g'im harakatlantirgichlar (CPM)",
          "Reabilitatsiya yurish yo'laklari",
          "Gimnastika to'plari va elastik lentalar"
        ]
      },
      {
        id: "r-orthotics",
        name: "Bandaj va fiksatorlar",
        items: [
          "Tizza va to'piq bo'g'imi bandajlari",
          "Umurtqa pog'onasi va bel korsetlari",
          "Bo'yin fiksatorlari (Shans yoqasi)",
          "Yelka va bilak fiksatorlari"
        ]
      }
    ]
  }
];

interface UzumCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UzumCatalogModal({ isOpen, onClose }: UzumCatalogModalProps) {
  const [activeCatId, setActiveCatId] = useState<string>(MEGA_CATEGORIES[0].id);
  const { mounted, animState } = useAnimatedPresence(isOpen, 220);

  if (!mounted) return null;

  const activeCategory = MEGA_CATEGORIES.find((c) => c.id === activeCatId) || MEGA_CATEGORIES[0];

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
                        <span className="uz-catalog-cat-name">{cat.name}</span>
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
                <span>{activeCategory.name}</span>
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
              {activeCategory.groups.map((group) => (
                <div key={group.id} className="uz-catalog-group">
                  <Link
                    to={`/catalog?category=${activeCategory.slug}&q=${encodeURIComponent(group.name)}`}
                    onClick={onClose}
                    className="uz-catalog-group-title"
                  >
                    {group.name}
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
