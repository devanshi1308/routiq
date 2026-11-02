// Offers shown as badges on the Home and Services tiles. Tapping a tile with a badge turns its offer on for that booking.
// A voucher and an offer do not stack: the bigger discount is used.
export type Offer = { id: string; pct: number; label: string; rideId?: string };

export const OFFERS: Record<string, Offer> = {
  trip: { id: "trip", pct: 25, label: "Trip offer · 25% off", rideId: "go-ac" },
  reserve: { id: "reserve", pct: 20, label: "Reserve ahead · 20% off" },
};
// Carpool's 35% is its shared-fare saving and is worked out on the ride screen.
