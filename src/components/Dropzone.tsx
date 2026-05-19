import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, AlertCircle } from "lucide-react";
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
      setFile(file);
      useAppStore.getState().updateWizard({ fileName: file.name, fileSize: file.size });
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
    <div className="w-full h-full flex items-center justify-center p-6 bg-background dropzone-radial-gradient">
      <div
        {...getRootProps()}
        className={cn(
          "relative w-full max-w-2xl min-h-[400px] aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300",
          isDragActive 
            ? "border-primary/80 bg-primary/5 scale-[1.02]" 
            : "border-primary/35 hover:border-primary/80 hover:bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        
        <Box size={64} className="text-primary" />

        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-foreground mt-4">
            {isDragActive ? "Solte para analisar" : "Arraste seu arquivo aqui"}
          </p>
          <p className="text-muted text-sm">
            Suporte para arquivos <span className="text-primary font-bold">.STL</span> ou <span className="text-primary font-bold">.3MF</span>
          </p>
          
          <button className="border border-primary text-primary bg-transparent rounded-full px-5 py-1.5 text-sm mt-3 hover:bg-primary-subtle transition-colors">
            ou clique para selecionar
          </button>
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