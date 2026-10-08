/** Turn Firebase / generic errors into short, user-friendly messages. */
export function friendlyError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  const messages: Record<string, string> = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Please choose a stronger password (6+ characters).",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/popup-blocked":
      "Your browser blocked the sign-in popup. Please allow popups and retry.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/operation-not-allowed":
      "This sign-in method is not enabled in Firebase.",
    "permission-denied": "You don't have permission to do that.",
    unavailable: "You appear to be offline. Changes will sync when you reconnect.",
  };

  if (code && messages[code]) return messages[code];
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
