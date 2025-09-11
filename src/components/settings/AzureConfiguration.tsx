import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, KeyRound, Trash2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import type { UserSettings, AzureProviderSetting } from "@/lib/schemas";

interface AzureConfigurationProps {
  envVars: Record<string, string | undefined>;
}

export function AzureConfiguration({ envVars }: AzureConfigurationProps) {
  const { settings, updateSettings } = useSettings();
  const existing =
    (settings?.providerSettings?.azure as AzureProviderSetting) ?? {};

  const [azureApiKey, setAzureApiKey] = useState(
    existing.azureApiKey?.value || "",
  );
  const [resourceName, setResourceName] = useState(existing.resourceName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Environment variables
  const envAzureApiKey = envVars["AZURE_API_KEY"];
  const envAzureResourceName = envVars["AZURE_RESOURCE_NAME"];

  useEffect(() => {
    setAzureApiKey(existing.azureApiKey?.value || "");
    setResourceName(existing.resourceName || "");
  }, [settings?.providerSettings?.azure]);

  const onSave = async () => {
    setError(null);
    setSaved(false);

    if (!azureApiKey.trim()) {
      setError("Azure API Key is required");
      return;
    }

    if (!resourceName.trim()) {
      setError("Azure Resource Name is required");
      return;
    }

    setSaving(true);
    try {
      const settingsUpdate: Partial<UserSettings> = {
        providerSettings: {
          ...settings?.providerSettings,
          azure: {
            ...existing,
            azureApiKey: { value: azureApiKey.trim() },
            resourceName: resourceName.trim(),
          },
        },
      };
      await updateSettings(settingsUpdate);
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || "Failed to save Azure settings");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      const settingsUpdate: Partial<UserSettings> = {
        providerSettings: {
          ...settings?.providerSettings,
          azure: {
            azureApiKey: undefined,
            resourceName: undefined,
          },
        },
      };
      await updateSettings(settingsUpdate);
      setAzureApiKey("");
      setResourceName("");
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || "Failed to delete Azure settings");
    } finally {
      setSaving(false);
    }
  };

  const isSettingsConfigured = Boolean(
    (azureApiKey.trim() && resourceName.trim()) ||
      (existing.azureApiKey?.value && existing.resourceName),
  );

  const isEnvConfigured = !!(envAzureApiKey && envAzureResourceName);

  const activeKeySource = isSettingsConfigured
    ? "settings"
    : isEnvConfigured
      ? "env"
      : "none";

  return (
    <Accordion
      type="multiple"
      className="w-full space-y-4"
      defaultValue={
        isSettingsConfigured || !isEnvConfigured ? ["settings-config"] : []
      }
    >
      <AccordionItem
        value="settings-config"
        className="border rounded-lg px-4 bg-(--background-lightest)"
      >
        <AccordionTrigger className="text-lg font-medium hover:no-underline cursor-pointer">
          Azure Configuration from Settings
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          {isSettingsConfigured && (
            <Alert variant="default" className="mb-4">
              <KeyRound className="h-4 w-4" />
              <AlertTitle className="flex justify-between items-center">
                <span>Current Azure Configuration (Settings)</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={saving}
                  className="flex items-center gap-1 h-7 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {saving ? "Deleting..." : "Delete"}
                </Button>
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-mono text-sm">
                    Resource: {existing.resourceName}
                  </p>
                  <p className="font-mono text-sm">
                    API Key:{" "}
                    {existing.azureApiKey?.value ? "••••••••" : "Not Set"}
                  </p>
                  {activeKeySource === "settings" && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      This configuration is currently active.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Azure Resource Name
              </label>
              <Input
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="your-azure-openai-resource-name"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The name you gave your Azure OpenAI resource in the Azure portal
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Azure API Key
              </label>
              <Input
                type="password"
                value={azureApiKey}
                onChange={(e) => setAzureApiKey(e.target.value)}
                placeholder="Enter your Azure OpenAI API key"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Get this from Keys and Endpoint in your Azure OpenAI resource
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={onSave}
              disabled={saving || !azureApiKey.trim() || !resourceName.trim()}
            >
              {saving ? "Saving..." : "Save Azure Configuration"}
            </Button>
            {saved && !error && (
              <span className="flex items-center text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Saved
              </span>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Save Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Setting configuration here will override environment variables (if
            set). No app restart required.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="env-config"
        className="border rounded-lg px-4 bg-(--background-lightest)"
      >
        <AccordionTrigger className="text-lg font-medium hover:no-underline cursor-pointer">
          Environment Variables Configuration
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                Environment Variables Status:
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-muted rounded border">
                  <code className="font-mono text-foreground">
                    AZURE_API_KEY
                  </code>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${envAzureApiKey ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"}`}
                  >
                    {envAzureApiKey ? "Set" : "Not Set"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded border">
                  <code className="font-mono text-foreground">
                    AZURE_RESOURCE_NAME
                  </code>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${envAzureResourceName ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"}`}
                  >
                    {envAzureResourceName ? "Set" : "Not Set"}
                  </span>
                </div>
              </div>
              {isEnvConfigured && (
                <Alert className="mt-4">
                  <KeyRound className="h-4 w-4" />
                  <AlertTitle>Environment Variables Set</AlertTitle>
                  <AlertDescription>
                    {activeKeySource === "env" && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Environment variables are currently active (no settings
                        configuration set).
                      </p>
                    )}
                    {activeKeySource === "settings" && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Environment variables are set but being overridden by
                        the settings configuration above.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-700">
              <h5 className="font-medium mb-2 text-blue-900 dark:text-blue-200">
                How to set environment variables:
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
                <li>Get your API key from the Azure portal</li>
                <li>
                  Find your resource name (the name you gave your Azure OpenAI
                  resource)
                </li>
                <li>Set these environment variables before starting Dyad</li>
                <li>Restart Dyad after setting the environment variables</li>
              </ol>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Environment variables are used only if no settings configuration
              is set above. Requires app restart to detect changes.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
