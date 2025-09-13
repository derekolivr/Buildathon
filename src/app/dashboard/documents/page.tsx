import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { FileText, Plus } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground">+6 in the last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processed Automatically</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">70% automation rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.5 hrs</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>Upload a document for AI-powered processing and form filling</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUploader />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Your recently processed documents</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="forms">
          <Card>
            <CardHeader>
              <CardTitle>Forms</CardTitle>
              <CardDescription>Manage your form documents</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList type="forms" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Policies</CardTitle>
              <CardDescription>Manage your policy documents</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList type="policies" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Claims</CardTitle>
              <CardDescription>Manage your claim documents</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList type="claims" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
