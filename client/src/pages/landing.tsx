import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Users, MessageSquare, Lightbulb } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-slate-800">Infobell DevBoard</h1>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-primary hover:bg-blue-700"
            >
              Sign In with Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">
            Internal Developer Collaboration Platform
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            A private platform for Infobell IT developers to post coding doubts, 
            share useful tools and tips, and collaborate securely with your team.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-blue-700"
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Post Doubts</h3>
              <p className="text-slate-600">
                Share coding challenges with markdown support and image uploads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Collaborate</h3>
              <p className="text-slate-600">
                Get help from your team with comments and voting system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Share Tips</h3>
              <p className="text-slate-600">
                Share useful development tips and tools with the community
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Code className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure Access</h3>
              <p className="text-slate-600">
                Restricted to @infobellit.com emails for internal use only
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
