// What a rider may see about a driver after a trip. Never the phone number, home address or exact location.
export const shortName = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

/** MH 17 SL 1164 -> MH 17 •• 1164 (state, district and last four digits stay; the series letters are hidden) */
export const maskPlate = (plate: string) => {
  const p = plate.replace(/\s+/g, "");
  const m = p.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/i);
  return m ? `${m[1]} ${m[2]} •• ${m[4]}` : plate;
};

export const roundTrips = (n: number) => (n >= 1000 ? `${Math.floor(n / 100) / 10}k+` : `${Math.floor(n / 10) * 10}+`);
