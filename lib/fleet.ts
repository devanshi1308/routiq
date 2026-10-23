// Which ride options a driver can take. This is the one place to edit when a new ride option is added:
// list its id under the vehicle classes that can serve it, and every driver screen follows.
export type VehicleClass = "Auto" | "Bike" | "Car" | "Premium car" | "Van";

export const CLASS_RIDES: Record<VehicleClass, string[]> = {
  Auto: ["auto", "auto-priority"],
  Bike: ["bike"],
  Car: ["go-ac", "pool", "taxi"],
  "Premium car": ["premier", "go-ac"],
  Van: ["xl"],
};

export const CLASS_LABEL: Record<VehicleClass, string> = {
  Auto: "Auto and Auto Priority",
  Bike: "Bike",
  Car: "Go AC, Pool and Taxi",
  "Premium car": "Premier and Go AC",
  Van: "XL",
};

/** The driver's class, read from the vehicle text saved at sign-up ("Auto", "Car", "Premium car", "Bajaj RE Auto"...). */
export const classOf = (vehicle: string): VehicleClass =>
  /bike|scooter|activa|shine|splendor|pulsar/i.test(vehicle) ? "Bike" : /auto|rickshaw|\bRE\b/i.test(vehicle) ? "Auto" : /premium|premier|sedan|city|verna/i.test(vehicle) ? "Premium car" : /van|xl|innova|ertiga|suv/i.test(vehicle) ? "Van" : "Car";

/** True when a driver with this vehicle may be offered this ride option. */
export const servesRide = (vehicle: string, rideId: string) => CLASS_RIDES[classOf(vehicle)].includes(rideId);
