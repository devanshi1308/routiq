export type Country = { code: string; name: string; dial: string; flag: string; min: number; max: number };

const C = (code: string, name: string, dial: string, flag: string, min = 6, max = 13): Country => ({ code, name, dial, flag, min, max });

// Country calling codes with the usual phone-number length range for each.
export const COUNTRIES: Country[] = [
  C("IN", "India", "+91", "🇮🇳", 10, 10),
  C("US", "United States", "+1", "🇺🇸", 10, 10),
  C("GB", "United Kingdom", "+44", "🇬🇧", 10, 10),
  C("AE", "United Arab Emirates", "+971", "🇦🇪", 9, 9),
  C("SA", "Saudi Arabia", "+966", "🇸🇦", 9, 9),
  C("QA", "Qatar", "+974", "🇶🇦", 8, 8),
  C("KW", "Kuwait", "+965", "🇰🇼", 8, 8),
  C("OM", "Oman", "+968", "🇴🇲", 8, 8),
  C("BH", "Bahrain", "+973", "🇧🇭", 8, 8),
  C("SG", "Singapore", "+65", "🇸🇬", 8, 8),
  C("MY", "Malaysia", "+60", "🇲🇾", 9, 10),
  C("TH", "Thailand", "+66", "🇹🇭", 9, 9),
  C("ID", "Indonesia", "+62", "🇮🇩", 9, 12),
  C("PH", "Philippines", "+63", "🇵🇭", 10, 10),
  C("VN", "Vietnam", "+84", "🇻🇳", 9, 10),
  C("CN", "China", "+86", "🇨🇳", 11, 11),
  C("HK", "Hong Kong", "+852", "🇭🇰", 8, 8),
  C("JP", "Japan", "+81", "🇯🇵", 10, 10),
  C("KR", "South Korea", "+82", "🇰🇷", 9, 10),
  C("AU", "Australia", "+61", "🇦🇺", 9, 9),
  C("NZ", "New Zealand", "+64", "🇳🇿", 8, 10),
  C("CA", "Canada", "+1", "🇨🇦", 10, 10),
  C("MX", "Mexico", "+52", "🇲🇽", 10, 10),
  C("BR", "Brazil", "+55", "🇧🇷", 10, 11),
  C("AR", "Argentina", "+54", "🇦🇷", 10, 10),
  C("ZA", "South Africa", "+27", "🇿🇦", 9, 9),
  C("NG", "Nigeria", "+234", "🇳🇬", 10, 10),
  C("KE", "Kenya", "+254", "🇰🇪", 9, 9),
  C("EG", "Egypt", "+20", "🇪🇬", 10, 10),
  C("DE", "Germany", "+49", "🇩🇪", 10, 11),
  C("FR", "France", "+33", "🇫🇷", 9, 9),
  C("IT", "Italy", "+39", "🇮🇹", 9, 10),
  C("ES", "Spain", "+34", "🇪🇸", 9, 9),
  C("NL", "Netherlands", "+31", "🇳🇱", 9, 9),
  C("CH", "Switzerland", "+41", "🇨🇭", 9, 9),
  C("SE", "Sweden", "+46", "🇸🇪", 7, 10),
  C("RU", "Russia", "+7", "🇷🇺", 10, 10),
  C("TR", "Türkiye", "+90", "🇹🇷", 10, 10),
  C("PK", "Pakistan", "+92", "🇵🇰", 10, 10),
  C("BD", "Bangladesh", "+880", "🇧🇩", 10, 10),
  C("LK", "Sri Lanka", "+94", "🇱🇰", 9, 9),
  C("NP", "Nepal", "+977", "🇳🇵", 10, 10),
];

export const INDIA = COUNTRIES[0];
export const phoneValid = (c: Country, digits: string) => digits.length >= c.min && digits.length <= c.max;
