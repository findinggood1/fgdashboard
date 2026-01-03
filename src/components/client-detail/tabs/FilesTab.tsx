import { useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { ClientFile } from '@/hooks/useClientDetail';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Download,
  Upload,
  Grid3X3,
  List,
  Search,
  Trash2,
  Eye,
  MoreHorizontal,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface FilesTabProps {
  files: ClientFile[];
  clientEmail: string;
  onRefresh: () => void;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'document' | 'pdf' | 'image' | 'other';

const CATEGORIES = ['Intake', 'Assessment', 'Resource', 'Reference', 'Export', 'Other'] as const;

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xls,.xlsx';

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType === 'image') return Image;
  if (fileType === 'spreadsheet') return FileSpreadsheet;
  if (fileType === 'pdf' || fileType === 'document') return FileText;
  return File;
}

function getFileType(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  return 'other';
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesTab({ files, clientEmail, onRefresh }: FilesTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ClientFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<string>('');
  const [uploadTags, setUploadTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter files
  const filteredFiles = files.filter((file) => {
    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'document' && file.file_type !== 'document') return false;
      if (filter === 'pdf' && file.file_type !== 'pdf') return false;
      if (filter === 'image' && file.file_type !== 'image') return false;
      if (filter === 'other' && !['document', 'pdf', 'image', 'spreadsheet'].includes(file.file_type || '')) return false;
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (file.title?.toLowerCase() || '').includes(query) ||
        file.file_name.toLowerCase().includes(query) ||
        (file.description?.toLowerCase() || '').includes(query)
      );
    }
    
    return true;
  });

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory('');
    setUploadTags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const timestamp = Date.now();
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${clientEmail}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(path, selectedFile);

      if (uploadError) {
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
          throw new Error('Storage bucket not configured. Please run the setup SQL in Supabase.');
        }
        throw uploadError;
      }

      // 2. Get signed URL
      const { data: urlData } = await supabase.storage
        .from('client-files')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      // 3. Parse tags
      const tagsArray = uploadTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // 4. Insert record
      const { error: insertError } = await supabase
        .from('client_files')
        .insert({
          client_email: clientEmail,
          file_name: selectedFile.name,
          file_type: getFileType(selectedFile.type),
          storage_path: path,
          storage_url: urlData?.signedUrl || null,
          title: uploadTitle || selectedFile.name,
          description: uploadDescription || null,
          category: uploadCategory || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
        });

      if (insertError) throw insertError;

      toast.success('File uploaded successfully');
      setUploadModalOpen(false);
      resetUploadForm();
      onRefresh();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      // 1. Delete from storage if path exists
      if (fileToDelete.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('client-files')
          .remove([fileToDelete.storage_path]);
        
        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      // 2. Delete record
      const { error } = await supabase
        .from('client_files')
        .delete()
        .eq('id', fileToDelete.id);

      if (error) throw error;

      toast.success('File deleted');
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  const openFile = (file: ClientFile) => {
    if (file.storage_url) {
      window.open(file.storage_url, '_blank');
    } else {
      toast.error('File URL not available');
    }
  };

  const Icon = getFileIcon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload File
        </Button>

        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <File className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {files.length === 0 ? 'No files uploaded yet' : 'No files match your filter'}
          </p>
          <p className="text-sm mt-1">
            {files.length === 0 ? 'Click "Upload File" to add files' : 'Try adjusting your filters'}
          </p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredFiles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => {
            const FileIcon = Icon(file.file_type);
            return (
              <Card
                key={file.id}
                className="shadow-soft hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openFile(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded">
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openFile(file); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileToDelete(file);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredFiles.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => {
                const FileIcon = Icon(file.file_type);
                return (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.title || file.file_name}</p>
                          {file.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.category ? (
                        <Badge variant="outline" className="capitalize">
                          {file.category}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{file.file_type || '-'}</TableCell>
                    <TableCell>{format(new Date(file.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setFileToDelete(file);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>

          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop a file here, or
              </p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES}
                onChange={handleFileInputChange}
              />
              <p className="text-xs text-muted-foreground mt-4">
                Accepted: PDF, DOC, DOCX, TXT, PNG, JPG, XLS, XLSX
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {selectedFile.type.includes('image') ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="p-2 bg-background rounded">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={resetUploadForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="File title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="Comma-separated tags"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{fileToDelete?.title || fileToDelete?.file_name}" from
              storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
