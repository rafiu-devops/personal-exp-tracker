"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALLED_KEY = "expenza-pwa-installed";
const DISMISSED_KEY = "expenza-install-prompt-dismissed";

function isRunningAsApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function markInstalled() {
  localStorage.setItem(INSTALLED_KEY, "true");
  localStorage.removeItem(DISMISSED_KEY);
}

function useAppInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const confirmInstalled = useCallback(() => {
    markInstalled();
    setInstalled(true);
    setDeferred(null);
  }, []);

  useEffect(() => {
    const updateInstalled = () => {
      const isInstalled =
        isRunningAsApp() || localStorage.getItem(INSTALLED_KEY) === "true";
      setInstalled(isInstalled);
      if (isInstalled) markInstalled();
    };
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    updateInstalled();
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", confirmInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", confirmInstalled);
    };
  }, [confirmInstalled]);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") confirmInstalled();
  };

  return { deferred, installed, isIOS, install, confirmInstalled };
}

export function InstallApp() {
  const { deferred, installed, isIOS, install, confirmInstalled } = useAppInstall();

  if (installed) {
    return (
      <Card className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">✅</span>
        <div>
          <p className="font-semibold">App installed</p>
          <p className="text-sm text-foreground/55">
            Expenza is running as an installed app.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">📲</span>
        <div>
          <p className="font-semibold">Install on your phone</p>
          <p className="text-sm text-foreground/55">
            Use Expenza like a native app — full screen, with an icon on your home screen.
          </p>
        </div>
      </div>
      {deferred ? (
        <Button fullWidth onClick={install}>Install App</Button>
      ) : isIOS ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground/70">
            In Safari, tap <strong>Share</strong>, then{" "}
            <strong>Add to Home Screen</strong>, and tap <strong>Add</strong>.
          </p>
          <Button fullWidth variant="secondary" onClick={confirmInstalled}>
            I&apos;ve added Expenza
          </Button>
        </div>
      ) : (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground/70">
          Open your browser menu and choose <strong>Install app</strong> or{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      )}
    </Card>
  );
}

export function InstallAppPrompt() {
  const { user, loading } = useAuth();
  const { deferred, installed, isIOS, install, confirmInstalled } = useAppInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  if (loading || user || installed || dismissed) return null;

  const close = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md">
      <Card className="space-y-3 border-brand/30 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">📲</span>
            <div>
              <p className="font-semibold">Install Expenza</p>
              <p className="text-sm text-foreground/65">
                Add it to your home screen for quick access.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close install prompt"
            onClick={close}
            className="-mr-2 -mt-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-foreground/60 hover:bg-surface-muted"
          >
            ×
          </button>
        </div>

        {deferred ? (
          <Button fullWidth onClick={install}>Install App</Button>
        ) : isIOS ? (
          <div className="space-y-2">
            <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground/70">
              In Safari, tap <strong>Share</strong>, then{" "}
              <strong>Add to Home Screen</strong>, and tap <strong>Add</strong>.
            </p>
            <Button fullWidth variant="secondary" onClick={confirmInstalled}>
              I&apos;ve added Expenza
            </Button>
          </div>
        ) : (
          <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground/70">
            Open your browser menu and choose <strong>Install app</strong> or{" "}
            <strong>Add to Home Screen</strong>.
          </p>
        )}
      </Card>
    </div>
  );
}
