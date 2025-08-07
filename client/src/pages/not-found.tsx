import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex items-center justify-center pt-32 pb-16">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
            <p className="text-gray-600 mb-6">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Back Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
