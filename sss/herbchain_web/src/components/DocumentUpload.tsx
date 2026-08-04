import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';

interface DocumentUploadProps {
  accept?: string;
  multiple?: boolean;
  label?: string;
  onChange?: (files: File[]) => void;
  className?: string;
}

export default function DocumentUpload({
  accept = '.pdf,.jpg,.jpeg,.png',
  multiple = true,
  label = 'Click to upload files',
  onChange,
  className = '',
}: DocumentUploadProps) {
  const [files, setFiles] = useState<{ file: File; progress: number; status: 'uploading' | 'completed' }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateProgress = (file: File) => {
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setFiles(prev =>
          prev.map(f =>
            f.file.name === file.name && f.file.size === file.size
              ? { ...f, progress: 100, status: 'completed' }
              : f
          )
        );
      } else {
        setFiles(prev =>
          prev.map(f =>
            f.file.name === file.name && f.file.size === file.size
              ? { ...f, progress: currentProgress }
              : f
          )
        );
      }
    }, 150);
  };

  const handleFilesAdded = (newFileList: FileList | null) => {
    if (!newFileList) return;
    const addedFiles: File[] = Array.from(newFileList);
    
    // Filter duplicates
    const uniqueNewFiles = addedFiles.filter(
      nf => !files.some(existing => existing.file.name === nf.name && existing.file.size === nf.size)
    );

    if (uniqueNewFiles.length === 0) return;

    const formatted = uniqueNewFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    const nextFiles = multiple ? [...files, ...formatted] : [formatted[0]];
    setFiles(nextFiles);
    
    if (onChange) {
      onChange(nextFiles.map(f => f.file));
    }

    formatted.forEach(item => {
      simulateProgress(item.file);
    });
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFilesAdded(e.target.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    if (onChange) {
      onChange(nextFiles.map(f => f.file));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-primary bg-primary/[0.04]' 
            : 'border-border hover:border-primary/45 hover:bg-muted/30'
          }`}
      >
        <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Accepted formats: {accept.toUpperCase().replace(/\./g, ' ')} (Up to 10MB each)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3 max-h-48 overflow-y-auto divide-y divide-border">
          {files.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0 text-left">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate text-foreground">{item.file.name}</p>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors rounded p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(item.file.size)}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-200 rounded-full ${
                        item.status === 'completed' ? 'bg-success' : 'bg-primary'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <span className="text-[9px] text-muted-foreground font-mono shrink-0">{item.progress}%</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
