"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Eye, EyeOff, Copy } from "lucide-react";
import { useState } from "react";

export function APISettings() {
  const [showKeys, setShowKeys] = useState({
    apiKey: false,
    secretKey: false,
  });

  const toggleShowKey = (key: keyof typeof showKeys) => {
    setShowKeys({
      ...showKeys,
      [key]: !showKeys[key],
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>Manage your API keys for external service integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKeys.apiKey ? "text" : "password"}
                defaultValue="api_key_12345678901234567890"
                readOnly
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-8 top-0 h-full"
                onClick={() => toggleShowKey("apiKey")}
              >
                {showKeys.apiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => {
                  navigator.clipboard.writeText("api_key_12345678901234567890");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this key for public API calls. Never share this key in publicly accessible areas.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="secret-key">Secret Key</Label>
            <div className="relative">
              <Input
                id="secret-key"
                type={showKeys.secretKey ? "text" : "password"}
                defaultValue="sk_12345678901234567890"
                readOnly
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-8 top-0 h-full"
                onClick={() => toggleShowKey("secretKey")}
              >
                {showKeys.secretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => {
                  navigator.clipboard.writeText("sk_12345678901234567890");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this key secure. Only use for server-side operations and never expose in client-side code.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Reset Keys</Button>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate New Keys
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Webhook Configuration</CardTitle>
          <CardDescription>Configure endpoints for receiving event notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input id="webhook-url" type="url" placeholder="https://yourdomain.com/api/webhook" />
            <p className="text-xs text-muted-foreground">URL where event notifications will be sent.</p>
          </div>

          <div className="grid gap-2">
            <Label>Webhook Events</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="event-document" className="h-4 w-4" defaultChecked />
                <Label htmlFor="event-document" className="text-sm">
                  Document processing events
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="event-payment" className="h-4 w-4" defaultChecked />
                <Label htmlFor="event-payment" className="text-sm">
                  Payment events
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="event-communication" className="h-4 w-4" defaultChecked />
                <Label htmlFor="event-communication" className="text-sm">
                  Communication events
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="event-workflow" className="h-4 w-4" defaultChecked />
                <Label htmlFor="event-workflow" className="text-sm">
                  Workflow events
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto">Save Webhook Configuration</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
