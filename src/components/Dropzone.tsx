import React, { useRef, useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Upload, AlertCircle } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";

export const Dropzone: React.FC = () => {
  const { setFile, setStatus } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.stl') && !file.name.toLowerCase().endsWith('.3mf')) {
        setError("Formato não suportado. Use .STL ou .3MF.");
        return;
      }
      setError(null);
      setFile({
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith('.stl') ? 'stl' : '3mf'
      });
      setStatus('parsing');
    }
  }, [setFile, setStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/stl': ['.stl'],
      'model/3mf': ['.3mf'],
    },
    multiple: false
  });

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-background">
      <div
        {...getRootProps()}
        className={cn(
          "relative w-full max-w-2xl aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-white/10 hover:border-primary/50 hover:bg-white/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="w-24 h-24 bg-surface-raised rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
          <Box className={cn("w-12 h-12 transition-colors", isDragActive ? "text-primary" : "text-muted")} />
        </div>

        <div className="text-center space-y-2">
          <p className="text-2xl font-black text-white">
            {isDragActive ? "Solte para analisar" : "Arraste seu arquivo aqui"}
          </p>
          <p className="text-muted font-medium">
            Suporte para arquivos <span className="text-white">.STL</span> ou <span className="text-white">.3MF</span>
          </p>
        </div>

        {error && (
          <div className="absolute -bottom-16 flex items-center gap-2 text-destructive font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
