import { parseAsString, createLoader } from "nuqs/server";

// Describe your search params, and reuse this in useQueryStates / createSerializer:
export const coordinatesSearchParams = {
  number: parseAsString.withDefault(""),
};

export const loadVerifyParams = createLoader(coordinatesSearchParams);
