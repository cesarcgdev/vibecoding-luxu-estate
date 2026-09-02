/**
 * Fired by any component that needs a signed-in user (e.g. SaveButton) so the
 * single global AuthGateModal mounted in the root layout can open, instead of
 * every caller mounting and prop-drilling its own copy.
 */
export const AUTH_GATE_EVENT = "luxestate:auth-gate";
