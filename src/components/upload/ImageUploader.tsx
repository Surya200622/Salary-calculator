"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, Image as ImageIcon, X, FileImage } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  isProcessing: boolean;
  progress: number;
}

export function ImageUploader({ onImageSelected, isProcessing, progress }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/image\/(png|jpe?g)/)) {
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      onImageSelected(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = () => {
    setPreview(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card className="overflow-hidden border-dashed border-2 transition-all duration-300 hover:border-primary/40">
      <CardContent className="p-0">
        {preview ? (
          <div className="relative animate-scale-in">
            <div className="relative aspect-video max-h-64 overflow-hidden bg-muted/30">
              <img
                src={preview}
                alt="Uploaded work log"
                className="h-full w-full object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Extracting table data...</span>
                  </div>
                  <div className="w-48">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="text-xs text-muted-foreground">{progress}% complete</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <FileImage className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{fileName}</span>
              </div>
              {!isProcessing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPreview}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-4 p-8 sm:p-12 cursor-pointer transition-all duration-300",
              isDragOver && "drop-zone-active bg-primary/5"
            )}
          >
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300",
              isDragOver && "scale-110 bg-primary/20 animate-pulse-glow"
            )}>
              {isDragOver ? (
                <ImageIcon className="h-8 w-8" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">
                {isDragOver ? "Drop your image here" : "Upload Work Log Image"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drag & drop or click to browse • PNG, JPG, JPEG
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleInputChange}
              className="hidden"
              id="image-upload-input"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
