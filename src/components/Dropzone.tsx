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
          "relative w-full max-w-2xl min-h-[440px] aspect-video rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-8 cursor-pointer transition-all duration-500 overflow-hidden group shadow-2xl",
          isDragActive 
            ? "border-primary bg-primary/10 scale-[1.03] shadow-primary/20" 
            : "border-primary/20 bg-surface/30 hover:border-primary hover:bg-primary/5 hover:scale-[1.01]"
        )}
      >

        <input {...getInputProps()} />
        
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center shadow-[var(--primary-glow)] group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
          <Box size={40} className="text-primary" />
        </div>

        <div className="text-center space-y-4 px-8">
          <p className="text-3xl font-black text-foreground tracking-tight">
            {isDragActive ? "SOLTE PARA ANALISAR" : "UPLOAD DO MODELO 3D"}
          </p>

          <p className="text-muted text-sm">
            Suporte para arquivos <span className="text-primary font-bold">.STL</span> ou <span className="text-primary font-bold">.3MF</span>
          </p>
          
          <button className="bg-primary/10 border border-primary/30 text-primary font-black uppercase tracking-[0.2em] rounded-full px-8 py-3 text-[10px] mt-6 hover:bg-primary hover:text-[#0d0d14] hover:shadow-[var(--primary-glow)] transition-all duration-300">
            ou selecione o arquivo
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