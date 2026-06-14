export const TARGETING_KEY_HEADER = "x-targeting-key";

/**
 * Builds the request headers used to forward the OpenFeature targeting key
 * from the SPA to the API.
 */
export function setTargetingKeyHeader(
  targetingKey: string
): Record<string, string> {
  return {
    [TARGETING_KEY_HEADER]: targetingKey,
  };
}
