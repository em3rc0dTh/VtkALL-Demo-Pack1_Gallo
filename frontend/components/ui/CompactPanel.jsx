import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function CompactPanel({ title, children, action }) {
  return (
    <Card className="min-h-0">
      <CardHeader className="flex-row items-center justify-between gap-4 py-3">
        <CardTitle className="text-xs uppercase tracking-wider text-text-secondary">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-3 p-4">{children}</CardContent>
    </Card>
  );
}
