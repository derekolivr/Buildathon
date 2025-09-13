import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunicationTemplates } from "@/components/communications/communication-templates";
import { CommunicationScheduler } from "@/components/communications/communication-scheduler";
import { MessageHistory } from "@/components/communications/message-history";
import { MessageSquarePlus } from "lucide-react";

export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
        <Button>
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">248</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82%</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">38%</div>
                <p className="text-xs text-muted-foreground">+2% from last month</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>Recent communications with clients</CardDescription>
            </CardHeader>
            <CardContent>
              <MessageHistory />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Communication Templates</CardTitle>
              <CardDescription>Manage your automated message templates</CardDescription>
            </CardHeader>
            <CardContent>
              <CommunicationTemplates />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scheduler">
          <Card>
            <CardHeader>
              <CardTitle>Message Scheduler</CardTitle>
              <CardDescription>Schedule automated communications with clients</CardDescription>
            </CardHeader>
            <CardContent>
              <CommunicationScheduler />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}