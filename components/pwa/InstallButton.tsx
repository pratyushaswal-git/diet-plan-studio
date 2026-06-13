"use client";

import { useState } from "react";
import { Download, Share, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/components/pwa/useInstallPrompt";

// "Install app" affordance for Settings. Hidden once installed (standalone).
export function InstallButton() {
  const { isStandalone, isIOS, canPrompt, promptInstall } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (isStandalone) return null;
  if (!canPrompt && !isIOS) return null; // not installable here (or already installed)

  return (
    <div className="rounded-xl border border-app-rule bg-app-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-app-ink">Install Diet Plan</p>
          <p className="text-sm text-app-muted">Add it to your home screen for an app-like experience.</p>
        </div>
        {canPrompt ? (
          <Button size="sm" onClick={promptInstall}>
            <Download className="h-4 w-4" /> Install
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowIosHelp((v) => !v)}>
            How
          </Button>
        )}
      </div>
      {isIOS && showIosHelp && (
        <ol className="mt-3 space-y-1.5 border-t border-app-rule pt-3 text-sm text-app-muted">
          <li className="flex items-center gap-2">
            <Share className="h-4 w-4 shrink-0" /> 1. Tap the Share button in Safari.
          </li>
          <li className="flex items-center gap-2">
            <Plus className="h-4 w-4 shrink-0" /> 2. Choose &ldquo;Add to Home Screen&rdquo;.
          </li>
        </ol>
      )}
    </div>
  );
}
