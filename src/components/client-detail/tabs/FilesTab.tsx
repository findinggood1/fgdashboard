import { format } from 'date-fns';
import { ClientFile } from '@/hooks/useClientDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { File, FileText, Image, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilesTabProps {
  files: ClientFile[];
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.includes('image')) return Image;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
};

export function FilesTab({ files }: FilesTabProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <File className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No files yet</p>
        <p className="text-sm mt-1">Uploaded files will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => {
        const Icon = getFileIcon(file.file_type);
        
        return (
          <Card key={file.id} className="shadow-soft hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {file.title || file.file_name}
                  </h4>
                  {file.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {file.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {file.category && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {file.category}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(file.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                {file.storage_url && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={file.storage_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
