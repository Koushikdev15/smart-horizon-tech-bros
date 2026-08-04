import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Printer } from 'lucide-react';

export default function QRModule() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Product QR Generation</CardTitle>
        <CardDescription>Generate unique consumer-facing QR codes for finished products.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <QrCode className="w-32 h-32 text-gray-900" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PRD-88192-A</p>
        </div>
        <div className="flex justify-between">
          <Button variant="outline">Preview Consumer Portal</Button>
          <Button>
            <Printer className="w-4 h-4 mr-2" /> Print Batch (100)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
