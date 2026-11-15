/**
 * Trip fuel cost and efficiency conversions.
 * Pure math — no I/O. Inputs stay in the browser UI only.
 * No built-in fuel prices.
 */

export const KM_PER_MILE = 1.609344;
export const LITRES_PER_US_GALLON = 3.785411784;
export const LITRES_PER_UK_GALLON = 4.54609;
/** MPG (US) = this ÷ (L/100 km) */
export const MPG_US_FROM_L100 = 235.214583;
/** MPG (UK) = this ÷ (L/100 km) */
export const MPG_UK_FROM_L100 = 282.480936;

export type DistanceUnit = "km" | "mi";
export type EfficiencyUnit = "km_l" | "l_100km" | "mpg_us" | "mpg_uk";
export type FuelVolumeUnit = "litre" | "us_gallon" | "uk_gallon";
export type FuelPriceUnit = "per_litre" | "per_us_gallon" | "per_uk_gallon";

export type FuelMode = "trip" | "efficiency" | "convert";

export type FuelErrorCode =
  | "empty"
  | "invalid"
  | "negative"
  | "zero"
  | "nonfinite";

export type FuelFailure = {
  ok: false;
  error: FuelErrorCode;
  message: string;
};

export type EfficiencyBreakdown = {
  kmPerLitre: number;
  litresPer100km: number;
  mpgUs: number;
  mpgUk: number;
};

export type TripSuccess = {
  ok: true;
  mode: "trip";
  distanceKm: number;
  fuelLitres: number;
  fuelUsGallons: number;
  fuelUkGallons: number;
  fuelCost: number;
  otherCosts: number;
  totalCost: number;
  costPerKm: number;
  costPerMile: number;
  people: number;
  costPerPerson: number;
  working: string;
};

export type MeasureSuccess = {
  ok: true;
  mode: "efficiency";
  efficiency: EfficiencyBreakdown;
  costPerKm: number | null;
  working: string;
};

export type ConvertSuccess = {
  ok: true;
  mode: "convert";
  efficiency: EfficiencyBreakdown;
  working: string;
};

export type FuelResult =
  | TripSuccess
  | MeasureSuccess
  | ConvertSuccess
  | FuelFailure;

export type TripInput = {
  mode: "trip";
  distance: number | null;
  distanceUnit: DistanceUnit;
  efficiency: number | null;
  efficiencyUnit: EfficiencyUnit;
  fuelPrice: number | null;
  fuelPriceUnit: FuelPriceUnit;
  roundTrip: boolean;
  tolls: number | null;
  otherCosts: number | null;
  people: number | null;
};

export type MeasureInput = {
  mode: "efficiency";
  distance: number | null;
  distanceUnit: DistanceUnit;
  fuelUsed: number | null;
  fuelUsedUnit: FuelVolumeUnit;
  fuelPrice: number | null;
  fuelPriceUnit: FuelPriceUnit;
};

export type ConvertInput = {
  mode: "convert";
  efficiency: number | null;
  efficiencyUnit: EfficiencyUnit;
};

export type FuelInput = TripInput | MeasureInput | ConvertInput;

function formatNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function requirePositive(
  value: number,
  label: string,
): FuelFailure | null {
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: "nonfinite",
      message: `${label} must be a finite number.`,
    };
  }
  if (value < 0) {
    return {
      ok: false,
      error: "negative",
      message: `${label} cannot be negative.`,
    };
  }
  if (value === 0) {
    return {
      ok: false,
      error: "zero",
      message: `${label} must be greater than zero.`,
    };
  }
  return null;
}

function requireNonNegative(
  value: number,
  label: string,
): FuelFailure | null {
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: "nonfinite",
      message: `${label} must be a finite number.`,
    };
  }
  if (value < 0) {
    return {
      ok: false,
      error: "negative",
      message: `${label} cannot be negative.`,
    };
  }
  return null;
}

export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE;
}

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

export function litresToUsGallons(litres: number): number {
  return litres / LITRES_PER_US_GALLON;
}

export function litresToUkGallons(litres: number): number {
  return litres / LITRES_PER_UK_GALLON;
}

export function usGallonsToLitres(gallons: number): number {
  return gallons * LITRES_PER_US_GALLON;
}

export function ukGallonsToLitres(gallons: number): number {
  return gallons * LITRES_PER_UK_GALLON;
}

export function distanceToKm(value: number, unit: DistanceUnit): number {
  return unit === "km" ? value : milesToKm(value);
}

export function volumeToLitres(value: number, unit: FuelVolumeUnit): number {
  if (unit === "litre") return value;
  if (unit === "us_gallon") return usGallonsToLitres(value);
  return ukGallonsToLitres(value);
}

/** Convert any efficiency input to L/100 km. */
export function toLitresPer100Km(
  value: number,
  unit: EfficiencyUnit,
): number {
  switch (unit) {
    case "l_100km":
      return value;
    case "km_l":
      return 100 / value;
    case "mpg_us":
      return MPG_US_FROM_L100 / value;
    case "mpg_uk":
      return MPG_UK_FROM_L100 / value;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

export function efficiencyFromL100(l100: number): EfficiencyBreakdown {
  return {
    litresPer100km: l100,
    kmPerLitre: 100 / l100,
    mpgUs: MPG_US_FROM_L100 / l100,
    mpgUk: MPG_UK_FROM_L100 / l100,
  };
}

export function convertEfficiency(
  value: number,
  unit: EfficiencyUnit,
): EfficiencyBreakdown {
  return efficiencyFromL100(toLitresPer100Km(value, unit));
}

/** Fuel price expressed as currency per litre. */
export function pricePerLitre(
  price: number,
  unit: FuelPriceUnit,
): number {
  if (unit === "per_litre") return price;
  if (unit === "per_us_gallon") return price / LITRES_PER_US_GALLON;
  return price / LITRES_PER_UK_GALLON;
}

/** Litres needed for a distance given efficiency as L/100 km. */
export function litresForDistanceKm(
  distanceKm: number,
  litresPer100km: number,
): number {
  return (distanceKm * litresPer100km) / 100;
}

export function calculateFuelCost(input: FuelInput): FuelResult {
  if (input.mode === "trip") return calculateTrip(input);
  if (input.mode === "efficiency") return calculateMeasure(input);
  return calculateConvert(input);
}

function calculateTrip(input: TripInput): FuelResult {
  if (input.distance === null || input.efficiency === null || input.fuelPrice === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter distance, fuel efficiency, and fuel price.",
    };
  }

  const dErr = requirePositive(input.distance, "Distance");
  if (dErr) return dErr;
  const eErr = requirePositive(input.efficiency, "Fuel efficiency");
  if (eErr) return eErr;
  const pErr = requireNonNegative(input.fuelPrice, "Fuel price");
  if (pErr) return pErr;

  const tolls = input.tolls ?? 0;
  const other = input.otherCosts ?? 0;
  const tErr = requireNonNegative(tolls, "Tolls");
  if (tErr) return tErr;
  const oErr = requireNonNegative(other, "Other costs");
  if (oErr) return oErr;

  let people = input.people ?? 1;
  if (input.people !== null) {
    const peopleErr = requirePositive(people, "Number of people");
    if (peopleErr) return peopleErr;
    if (!Number.isInteger(people)) {
      return {
        ok: false,
        error: "invalid",
        message: "Number of people must be a whole number.",
      };
    }
  } else {
    people = 1;
  }

  const oneWayKm = distanceToKm(input.distance, input.distanceUnit);
  const distanceKm = input.roundTrip ? oneWayKm * 2 : oneWayKm;
  const l100 = toLitresPer100Km(input.efficiency, input.efficiencyUnit);
  if (!Number.isFinite(l100) || l100 <= 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Fuel efficiency produced an invalid conversion.",
    };
  }

  const fuelLitres = litresForDistanceKm(distanceKm, l100);
  const perLitre = pricePerLitre(input.fuelPrice, input.fuelPriceUnit);
  const fuelCost = fuelLitres * perLitre;
  const otherCosts = tolls + other;
  const totalCost = fuelCost + otherCosts;
  const costPerKm = totalCost / distanceKm;
  const costPerMile = totalCost / kmToMiles(distanceKm);
  const costPerPerson = totalCost / people;

  if (
    ![fuelLitres, fuelCost, totalCost, costPerKm, costPerMile, costPerPerson].every(
      Number.isFinite,
    )
  ) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Trip calculation produced a non-finite result.",
    };
  }

  const tripNote = input.roundTrip ? "round trip" : "one way";
  return {
    ok: true,
    mode: "trip",
    distanceKm,
    fuelLitres,
    fuelUsGallons: litresToUsGallons(fuelLitres),
    fuelUkGallons: litresToUkGallons(fuelLitres),
    fuelCost,
    otherCosts,
    totalCost,
    costPerKm,
    costPerMile,
    people,
    costPerPerson,
    working: `${formatNum(distanceKm, 2)} km (${tripNote}) at ${formatNum(input.efficiency, 2)} ${efficiencyUnitLabel(input.efficiencyUnit)} → ${formatNum(fuelLitres, 2)} L; fuel ${formatNum(fuelCost, 2)} + other ${formatNum(otherCosts, 2)} = total ${formatNum(totalCost, 2)} (${formatNum(costPerKm, 2)} per km).`,
  };
}

function calculateMeasure(input: MeasureInput): FuelResult {
  if (input.distance === null || input.fuelUsed === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter distance driven and fuel used.",
    };
  }
  const dErr = requirePositive(input.distance, "Distance");
  if (dErr) return dErr;
  const fErr = requirePositive(input.fuelUsed, "Fuel used");
  if (fErr) return fErr;

  const distanceKm = distanceToKm(input.distance, input.distanceUnit);
  const litres = volumeToLitres(input.fuelUsed, input.fuelUsedUnit);
  const kmPerLitre = distanceKm / litres;
  if (!Number.isFinite(kmPerLitre) || kmPerLitre <= 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Efficiency could not be calculated from these figures.",
    };
  }

  const efficiency = convertEfficiency(kmPerLitre, "km_l");
  let costPerKm: number | null = null;
  if (input.fuelPrice !== null) {
    const pErr = requireNonNegative(input.fuelPrice, "Fuel price");
    if (pErr) return pErr;
    const perLitre = pricePerLitre(input.fuelPrice, input.fuelPriceUnit);
    costPerKm = perLitre / kmPerLitre;
    if (!Number.isFinite(costPerKm)) {
      return {
        ok: false,
        error: "nonfinite",
        message: "Cost per km is not a finite number.",
      };
    }
  }

  return {
    ok: true,
    mode: "efficiency",
    efficiency,
    costPerKm,
    working: `${formatNum(distanceKm, 2)} km on ${formatNum(litres, 2)} L → ${formatNum(efficiency.kmPerLitre, 2)} km/L = ${formatNum(efficiency.litresPer100km, 2)} L/100 km = ${formatNum(efficiency.mpgUs, 2)} MPG (US) = ${formatNum(efficiency.mpgUk, 2)} MPG (UK).`,
  };
}

function calculateConvert(input: ConvertInput): FuelResult {
  if (input.efficiency === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter an efficiency value to convert.",
    };
  }
  const eErr = requirePositive(input.efficiency, "Efficiency");
  if (eErr) return eErr;

  const efficiency = convertEfficiency(
    input.efficiency,
    input.efficiencyUnit,
  );
  if (
    ![
      efficiency.kmPerLitre,
      efficiency.litresPer100km,
      efficiency.mpgUs,
      efficiency.mpgUk,
    ].every((n) => Number.isFinite(n) && n > 0)
  ) {
    return {
      ok: false,
      error: "nonfinite",
      message: "Conversion produced a non-finite result.",
    };
  }

  return {
    ok: true,
    mode: "convert",
    efficiency,
    working: `${formatNum(input.efficiency, 2)} ${efficiencyUnitLabel(input.efficiencyUnit)} = ${formatNum(efficiency.kmPerLitre, 2)} km/L = ${formatNum(efficiency.litresPer100km, 2)} L/100 km = ${formatNum(efficiency.mpgUs, 2)} MPG (US) = ${formatNum(efficiency.mpgUk, 2)} MPG (UK).`,
  };
}

export function efficiencyUnitLabel(unit: EfficiencyUnit): string {
  switch (unit) {
    case "km_l":
      return "km/L";
    case "l_100km":
      return "L/100 km";
    case "mpg_us":
      return "MPG (US)";
    case "mpg_uk":
      return "MPG (UK)";
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

/** Build a conversion reference row from the same efficiency functions. */
export function efficiencyReferenceRow(
  value: number,
  unit: EfficiencyUnit,
): EfficiencyBreakdown & { inputValue: number; inputUnit: EfficiencyUnit } {
  return {
    inputValue: value,
    inputUnit: unit,
    ...convertEfficiency(value, unit),
  };
}
