/**
 * Watts ↔ amps, kVA ↔ kW, and Ohm's law for resistive circuits.
 * Pure math — no I/O. Inputs stay in the browser UI only.
 */

/** Fixed √3 used for three-phase line-to-line calculations. */
export const SQRT3 = 1.7320508;

export const DEFAULT_POWER_FACTOR = 1;

export type CircuitType = "dc" | "single" | "three";
export type WattsAmpsDirection = "watts-to-amps" | "amps-to-watts";
export type KvaKwDirection =
  | "kva-to-kw"
  | "kw-to-kva"
  | "kva-to-amps"
  | "amps-to-kva";
export type ElectricalTab = "watts-amps" | "kva-kw" | "ohms";

export type ElectricalErrorCode =
  | "empty"
  | "invalid"
  | "zero"
  | "negative"
  | "nonfinite"
  | "power_factor"
  | "ohms_count";

export type ElectricalFailure = {
  ok: false;
  error: ElectricalErrorCode;
  message: string;
};

export type WattsAmpsSuccess = {
  ok: true;
  tab: "watts-amps";
  direction: WattsAmpsDirection;
  circuit: CircuitType;
  voltage: number;
  powerFactor: number;
  watts: number;
  amps: number;
  apparentVa: number;
  apparentKva: number;
  formulaLabel: string;
  working: string;
};

export type KvaKwSuccess = {
  ok: true;
  tab: "kva-kw";
  direction: KvaKwDirection;
  circuit: CircuitType | null;
  powerFactor: number | null;
  voltage: number | null;
  kva: number;
  kw: number | null;
  amps: number | null;
  apparentVa: number;
  working: string;
};

export type OhmsSuccess = {
  ok: true;
  tab: "ohms";
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  provided: Array<"V" | "I" | "R" | "P">;
  working: string;
};

export type ElectricalResult =
  | WattsAmpsSuccess
  | KvaKwSuccess
  | OhmsSuccess
  | ElectricalFailure;

export type WattsAmpsInput = {
  tab: "watts-amps";
  direction: WattsAmpsDirection;
  circuit: CircuitType;
  voltage: number | null;
  watts: number | null;
  amps: number | null;
  powerFactor: number | null;
};

export type KvaKwInput = {
  tab: "kva-kw";
  direction: KvaKwDirection;
  circuit: CircuitType;
  voltage: number | null;
  kva: number | null;
  kw: number | null;
  amps: number | null;
  powerFactor: number | null;
};

export type OhmsInput = {
  tab: "ohms";
  voltage: number | null;
  current: number | null;
  resistance: number | null;
  power: number | null;
};

export type ElectricalInput = WattsAmpsInput | KvaKwInput | OhmsInput;

function emptyResult(message: string): ElectricalFailure {
  return { ok: false, error: "empty", message };
}

function invalidResult(
  message: string,
  error: ElectricalErrorCode = "invalid",
): ElectricalFailure {
  return { ok: false, error, message };
}

function formatNum(n: number, digits = 4): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function validatePositive(
  value: number | null,
  label: string,
): { ok: true; value: number } | { ok: false; failure: ElectricalFailure } {
  if (value === null) {
    return { ok: false, failure: emptyResult(`Enter ${label}.`) };
  }
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "nonfinite",
        message: `${label} must be a finite number.`,
      },
    };
  }
  if (value < 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "negative",
        message: `${label} cannot be negative.`,
      },
    };
  }
  if (value === 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "zero",
        message: `${label} must be greater than zero.`,
      },
    };
  }
  return { ok: true, value };
}

function resolvePowerFactor(
  circuit: CircuitType,
  powerFactor: number | null,
): { ok: true; pf: number } | { ok: false; failure: ElectricalFailure } {
  if (circuit === "dc") {
    return { ok: true, pf: 1 };
  }
  const raw =
    powerFactor === null || !Number.isFinite(powerFactor)
      ? DEFAULT_POWER_FACTOR
      : powerFactor;
  if (raw <= 0 || raw > 1) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "power_factor",
        message: "Power factor must be above 0 and at most 1.",
      },
    };
  }
  return { ok: true, pf: raw };
}

/** Amps from watts for the given circuit. */
export function wattsToAmps(
  watts: number,
  voltage: number,
  circuit: CircuitType,
  powerFactor: number,
): number {
  if (circuit === "dc") {
    return watts / voltage;
  }
  if (circuit === "single") {
    return watts / (voltage * powerFactor);
  }
  return watts / (SQRT3 * voltage * powerFactor);
}

/** Watts from amps for the given circuit. */
export function ampsToWatts(
  amps: number,
  voltage: number,
  circuit: CircuitType,
  powerFactor: number,
): number {
  if (circuit === "dc") {
    return voltage * amps;
  }
  if (circuit === "single") {
    return voltage * amps * powerFactor;
  }
  return SQRT3 * voltage * amps * powerFactor;
}

/** Apparent power in VA for a given current and voltage. */
export function apparentVaFromAmps(
  amps: number,
  voltage: number,
  circuit: CircuitType,
): number {
  if (circuit === "three") {
    return SQRT3 * voltage * amps;
  }
  return voltage * amps;
}

export function kvaFromAmps(
  amps: number,
  voltage: number,
  circuit: CircuitType,
): number {
  return apparentVaFromAmps(amps, voltage, circuit) / 1000;
}

export function ampsFromKva(
  kva: number,
  voltage: number,
  circuit: CircuitType,
): number {
  const va = kva * 1000;
  if (circuit === "three") {
    return va / (SQRT3 * voltage);
  }
  return va / voltage;
}

export function kvaToKw(kva: number, powerFactor: number): number {
  return kva * powerFactor;
}

export function kwToKva(kw: number, powerFactor: number): number {
  return kw / powerFactor;
}

/**
 * Ohm's law for resistive circuits: enter any two of V, I, R, P.
 */
export function solveOhmsLaw(input: {
  voltage: number | null;
  current: number | null;
  resistance: number | null;
  power: number | null;
}): OhmsSuccess | ElectricalFailure {
  const fields: Array<{
    key: "V" | "I" | "R" | "P";
    value: number | null;
  }> = [
    { key: "V", value: input.voltage },
    { key: "I", value: input.current },
    { key: "R", value: input.resistance },
    { key: "P", value: input.power },
  ];

  const provided = fields.filter(
    (f) => f.value !== null && Number.isFinite(f.value),
  );
  if (provided.length < 2) {
    return emptyResult(
      "Enter any two of voltage, current, resistance and power.",
    );
  }
  if (provided.length > 2) {
    return invalidResult(
      "Enter exactly two values; clear the others so the remaining two can be calculated.",
      "ohms_count",
    );
  }

  for (const f of provided) {
    if (f.value! < 0) {
      return {
        ok: false,
        error: "negative",
        message: "Ohm's law values cannot be negative.",
      };
    }
    if (f.value! === 0) {
      return {
        ok: false,
        error: "zero",
        message: "Ohm's law values must be greater than zero.",
      };
    }
  }

  const has = (key: "V" | "I" | "R" | "P") =>
    provided.some((f) => f.key === key);
  const get = (key: "V" | "I" | "R" | "P") =>
    provided.find((f) => f.key === key)!.value!;

  let V: number;
  let I: number;
  let R: number;
  let P: number;
  let working: string;

  if (has("V") && has("I")) {
    V = get("V");
    I = get("I");
    R = V / I;
    P = V * I;
    working = `V = ${formatNum(V)} V, I = ${formatNum(I)} A → R = V ÷ I = ${formatNum(R)} Ω; P = V × I = ${formatNum(P)} W.`;
  } else if (has("V") && has("R")) {
    V = get("V");
    R = get("R");
    I = V / R;
    P = (V * V) / R;
    working = `V = ${formatNum(V)} V, R = ${formatNum(R)} Ω → I = V ÷ R = ${formatNum(I)} A; P = V² ÷ R = ${formatNum(P)} W.`;
  } else if (has("V") && has("P")) {
    V = get("V");
    P = get("P");
    I = P / V;
    R = (V * V) / P;
    working = `P = ${formatNum(P)} W, V = ${formatNum(V)} V → I = P ÷ V = ${formatNum(I)} A; R = V² ÷ P = ${formatNum(R)} Ω.`;
  } else if (has("I") && has("R")) {
    I = get("I");
    R = get("R");
    V = I * R;
    P = I * I * R;
    working = `I = ${formatNum(I)} A, R = ${formatNum(R)} Ω → V = I × R = ${formatNum(V)} V; P = I² × R = ${formatNum(P)} W.`;
  } else if (has("I") && has("P")) {
    I = get("I");
    P = get("P");
    V = P / I;
    R = P / (I * I);
    working = `P = ${formatNum(P)} W, I = ${formatNum(I)} A → V = P ÷ I = ${formatNum(V)} V; R = P ÷ I² = ${formatNum(R)} Ω.`;
  } else if (has("R") && has("P")) {
    R = get("R");
    P = get("P");
    I = Math.sqrt(P / R);
    V = I * R;
    working = `P = ${formatNum(P)} W, R = ${formatNum(R)} Ω → I = √(P ÷ R) = ${formatNum(I)} A; V = I × R = ${formatNum(V)} V.`;
  } else {
    return invalidResult("Could not solve from the two values entered.");
  }

  if (
    !Number.isFinite(V) ||
    !Number.isFinite(I) ||
    !Number.isFinite(R) ||
    !Number.isFinite(P)
  ) {
    return invalidResult("Result was not a finite number. Check the inputs.");
  }

  return {
    ok: true,
    tab: "ohms",
    voltage: V,
    current: I,
    resistance: R,
    power: P,
    provided: provided.map((f) => f.key),
    working,
  };
}

function calculateWattsAmps(input: WattsAmpsInput): ElectricalResult {
  const v = validatePositive(input.voltage, "voltage");
  if (!v.ok) return v.failure;

  const pf = resolvePowerFactor(input.circuit, input.powerFactor);
  if (!pf.ok) return pf.failure;

  if (input.direction === "watts-to-amps") {
    const p = validatePositive(input.watts, "power in watts");
    if (!p.ok) return p.failure;
    const amps = wattsToAmps(p.value, v.value, input.circuit, pf.pf);
    if (!Number.isFinite(amps)) {
      return invalidResult("Result was not a finite number.");
    }
    const apparentVa = apparentVaFromAmps(amps, v.value, input.circuit);
    let formulaLabel: string;
    let working: string;
    if (input.circuit === "dc") {
      formulaLabel = "I = P ÷ V";
      working = `I = ${formatNum(p.value)} W ÷ ${formatNum(v.value)} V = ${formatNum(amps)} A (DC). Apparent = ${formatNum(apparentVa)} VA.`;
    } else if (input.circuit === "single") {
      formulaLabel = "I = P ÷ (V × PF)";
      working = `I = ${formatNum(p.value)} W ÷ (${formatNum(v.value)} V × ${formatNum(pf.pf, 2)}) = ${formatNum(amps)} A (single-phase). Apparent = ${formatNum(apparentVa)} VA (${formatNum(apparentVa / 1000)} kVA).`;
    } else {
      formulaLabel = "I = P ÷ (√3 × V × PF)";
      working = `I = ${formatNum(p.value)} W ÷ (${formatNum(SQRT3, 7)} × ${formatNum(v.value)} V × ${formatNum(pf.pf, 2)}) = ${formatNum(amps)} A (three-phase). Apparent = ${formatNum(apparentVa)} VA (${formatNum(apparentVa / 1000)} kVA).`;
    }
    return {
      ok: true,
      tab: "watts-amps",
      direction: input.direction,
      circuit: input.circuit,
      voltage: v.value,
      powerFactor: pf.pf,
      watts: p.value,
      amps,
      apparentVa,
      apparentKva: apparentVa / 1000,
      formulaLabel,
      working,
    };
  }

  const a = validatePositive(input.amps, "current in amps");
  if (!a.ok) return a.failure;
  const watts = ampsToWatts(a.value, v.value, input.circuit, pf.pf);
  if (!Number.isFinite(watts)) {
    return invalidResult("Result was not a finite number.");
  }
  const apparentVa = apparentVaFromAmps(a.value, v.value, input.circuit);
  let formulaLabel: string;
  let working: string;
  if (input.circuit === "dc") {
    formulaLabel = "P = V × I";
    working = `P = ${formatNum(v.value)} V × ${formatNum(a.value)} A = ${formatNum(watts)} W (DC). Apparent = ${formatNum(apparentVa)} VA.`;
  } else if (input.circuit === "single") {
    formulaLabel = "P = V × I × PF";
    working = `P = ${formatNum(v.value)} V × ${formatNum(a.value)} A × ${formatNum(pf.pf, 2)} = ${formatNum(watts)} W (single-phase). Apparent = ${formatNum(apparentVa)} VA (${formatNum(apparentVa / 1000)} kVA).`;
  } else {
    formulaLabel = "P = √3 × V × I × PF";
    working = `P = ${formatNum(SQRT3, 7)} × ${formatNum(v.value)} V × ${formatNum(a.value)} A × ${formatNum(pf.pf, 2)} = ${formatNum(watts)} W (three-phase). Apparent = ${formatNum(apparentVa)} VA (${formatNum(apparentVa / 1000)} kVA).`;
  }
  return {
    ok: true,
    tab: "watts-amps",
    direction: input.direction,
    circuit: input.circuit,
    voltage: v.value,
    powerFactor: pf.pf,
    watts,
    amps: a.value,
    apparentVa,
    apparentKva: apparentVa / 1000,
    formulaLabel,
    working,
  };
}

function calculateKvaKw(input: KvaKwInput): ElectricalResult {
  if (input.direction === "kva-to-kw" || input.direction === "kw-to-kva") {
    const pf = resolvePowerFactor("single", input.powerFactor);
    if (!pf.ok) return pf.failure;

    if (input.direction === "kva-to-kw") {
      const kva = validatePositive(input.kva, "kVA");
      if (!kva.ok) return kva.failure;
      const kw = kvaToKw(kva.value, pf.pf);
      return {
        ok: true,
        tab: "kva-kw",
        direction: input.direction,
        circuit: null,
        powerFactor: pf.pf,
        voltage: null,
        kva: kva.value,
        kw,
        amps: null,
        apparentVa: kva.value * 1000,
        working: `kW = ${formatNum(kva.value)} kVA × ${formatNum(pf.pf, 2)} = ${formatNum(kw)} kW.`,
      };
    }

    const kw = validatePositive(input.kw, "kW");
    if (!kw.ok) return kw.failure;
    const kva = kwToKva(kw.value, pf.pf);
    return {
      ok: true,
      tab: "kva-kw",
      direction: input.direction,
      circuit: null,
      powerFactor: pf.pf,
      voltage: null,
      kva,
      kw: kw.value,
      amps: null,
      apparentVa: kva * 1000,
      working: `kVA = ${formatNum(kw.value)} kW ÷ ${formatNum(pf.pf, 2)} = ${formatNum(kva)} kVA.`,
    };
  }

  if (input.circuit === "dc") {
    return invalidResult(
      "kVA and amps conversions use single-phase or three-phase AC.",
    );
  }

  const v = validatePositive(input.voltage, "voltage");
  if (!v.ok) return v.failure;

  if (input.direction === "kva-to-amps") {
    const kva = validatePositive(input.kva, "kVA");
    if (!kva.ok) return kva.failure;
    const amps = ampsFromKva(kva.value, v.value, input.circuit);
    if (!Number.isFinite(amps)) {
      return invalidResult("Result was not a finite number.");
    }
    const pf =
      input.powerFactor === null || !Number.isFinite(input.powerFactor)
        ? null
        : input.powerFactor;
    if (pf !== null && (pf <= 0 || pf > 1)) {
      return {
        ok: false,
        error: "power_factor",
        message: "Power factor must be above 0 and at most 1.",
      };
    }
    const kw = pf !== null ? kvaToKw(kva.value, pf) : null;
    const formula =
      input.circuit === "three"
        ? `I = (kVA × 1000) ÷ (√3 × V) = (${formatNum(kva.value)} × 1000) ÷ (${formatNum(SQRT3, 7)} × ${formatNum(v.value)}) = ${formatNum(amps)} A`
        : `I = (kVA × 1000) ÷ V = (${formatNum(kva.value)} × 1000) ÷ ${formatNum(v.value)} = ${formatNum(amps)} A`;
    const kwPart =
      kw !== null
        ? ` Real power at PF ${formatNum(pf!, 2)}: ${formatNum(kw)} kW.`
        : "";
    return {
      ok: true,
      tab: "kva-kw",
      direction: input.direction,
      circuit: input.circuit,
      powerFactor: pf,
      voltage: v.value,
      kva: kva.value,
      kw,
      amps,
      apparentVa: kva.value * 1000,
      working: `${formula}.${kwPart}`,
    };
  }

  const a = validatePositive(input.amps, "current in amps");
  if (!a.ok) return a.failure;
  const kva = kvaFromAmps(a.value, v.value, input.circuit);
  if (!Number.isFinite(kva)) {
    return invalidResult("Result was not a finite number.");
  }
  const pf =
    input.powerFactor === null || !Number.isFinite(input.powerFactor)
      ? null
      : input.powerFactor;
  if (pf !== null && (pf <= 0 || pf > 1)) {
    return {
      ok: false,
      error: "power_factor",
      message: "Power factor must be above 0 and at most 1.",
    };
  }
  const kw = pf !== null ? kvaToKw(kva, pf) : null;
  const formula =
    input.circuit === "three"
      ? `kVA = √3 × V × I ÷ 1000 = ${formatNum(SQRT3, 7)} × ${formatNum(v.value)} × ${formatNum(a.value)} ÷ 1000 = ${formatNum(kva)} kVA (${formatNum(kva * 1000)} VA)`
      : `kVA = V × I ÷ 1000 = ${formatNum(v.value)} × ${formatNum(a.value)} ÷ 1000 = ${formatNum(kva)} kVA (${formatNum(kva * 1000)} VA)`;
  const kwPart =
    kw !== null
      ? ` At PF ${formatNum(pf!, 2)}: kW = ${formatNum(kva)} × ${formatNum(pf!, 2)} = ${formatNum(kw)} kW.`
      : "";
  return {
    ok: true,
    tab: "kva-kw",
    direction: input.direction,
    circuit: input.circuit,
    powerFactor: pf,
    voltage: v.value,
    kva,
    kw,
    amps: a.value,
    apparentVa: kva * 1000,
    working: `${formula}.${kwPart}`,
  };
}

/**
 * Main entry: watts/amps, kVA/kW, or Ohm's law.
 */
export function calculateElectrical(input: ElectricalInput): ElectricalResult {
  if (input.tab === "watts-amps") {
    return calculateWattsAmps(input);
  }
  if (input.tab === "kva-kw") {
    return calculateKvaKw(input);
  }
  return solveOhmsLaw(input);
}

/** Reference row for content tables (same watts→amps math). */
export function wattsAmpsReferenceRow(options: {
  watts: number;
  voltage: number;
  circuit?: CircuitType;
  powerFactor?: number;
}): {
  watts: number;
  voltage: number;
  circuit: CircuitType;
  powerFactor: number;
  amps: number;
} {
  const circuit = options.circuit ?? "single";
  const powerFactor = options.powerFactor ?? DEFAULT_POWER_FACTOR;
  return {
    watts: options.watts,
    voltage: options.voltage,
    circuit,
    powerFactor,
    amps: wattsToAmps(options.watts, options.voltage, circuit, powerFactor),
  };
}
