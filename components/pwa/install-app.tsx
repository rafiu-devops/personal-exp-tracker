"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <Card className="flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold">App installed</p>
          <p className="text-sm text-foreground/55">
            Expencir is running as an installed app.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📲</span>
        <div>
          <p className="font-semibold">Install on your phone</p>
          <p className="text-sm text-foreground/55">
            Use Expencir like a native app — full screen, with an icon on your home screen.
          </p>
        </div>
      </div>
      {deferred ? (
        <Button
          fullWidth
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
          }}
        >
          Install App
        </Button>
      ) : isIOS ? (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground/70">
          Tap the <strong>Share</strong> button in Safari, then choose{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground/70">
          Open your browser menu and choose <strong>Install app</strong> /{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      )}
    </Card>
  );
}
