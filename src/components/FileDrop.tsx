import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCode } from "lucide-react";
import { useStore } from "../lib/store";

interface FileDropProps {
  onFileChange: (file: File) => void;
}

export const FileDrop: React.FC<FileDropProps> = ({ onFileChange }) => {
  const updateWizard = useStore((state) => state.updateWizard);
  const wizard = useStore((state) => state.wizard);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        updateWizard({
          fileName: file.name,
          fileSize: file.size,
        });
        onFileChange(file);
      }
    },
    [updateWizard, onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "model/stl": [".stl"],
      "model/3mf": [".3mf"],
    },
    multiple: false,
  });

  if (wizard.fileName) {
    return (
      <div className="flex items-center gap-3 p-4 bg-surface-raised border border-border-strong rounded-xl w-full max-w-md mx-auto">
        <img src="/slicerai-icon.svg" alt="SlicerAI" className="w-8 h-8 rounded-xl" style={{filter: "none", opacity: 1}}/>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{wizard.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {(wizard.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          onClick={() => updateWizard({ fileName: "", fileSize: 0, geometryStats: undefined })}
          className="text-xs text-destructive hover:underline"
        >
          Remover
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        w-full max-w-md mx-auto border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all
        ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-surface-raised"
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mb-4">
        <img src="/slicerai-icon.svg" alt="SlicerAI" className="w-8 h-8 rounded-xl" style={{filter: "none", opacity: 1}}/>
      </div>
      <p className="text-center font-medium">
        {isDragActive ? "Solte o arquivo aqui" : "Arraste um arquivo .STL ou .3MF"}
      </p>
      <p className="text-center text-sm text-muted-foreground mt-2">
        Ou clique para selecionar manualmente
      </p>
    </div>
  );
};
