export const TOAST_EVENT = "luxestate:toast";

export type ToastVariant = "success" | "error";

export interface ToastDetail {
  message: string;
  variant: ToastVariant;
}

/** Shows a brief, auto-dismissing message via the global ToastHost in the root layout */
export function showToast(message: string, variant: ToastVariant = "success") {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, variant } })
  );
}
