import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EvidenceUploadProps {
  questionId: number;
}

export function EvidenceUpload({ questionId }: EvidenceUploadProps) {
  const { data: evidences, refetch } = trpc.evidence.list.useQuery({ questionId });
  const uploadEvidence = trpc.evidence.upload.useMutation();
  const deleteEvidence = trpc.evidence.delete.useMutation();
  
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} dépasse la taille maximale de 10MB`);
          continue;
        }

        // Read file as base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to server
        await uploadEvidence.mutateAsync({
          questionId,
          fileName: file.name,
          fileData,
          mimeType: file.type,
        });
      }

      toast.success(`${files.length} fichier(s) uploadé(s)`);
      refetch();
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDelete = async (evidenceId: number) => {
    try {
      await deleteEvidence.mutateAsync({ fileId: evidenceId });
      toast.success("Document supprimé");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div>
        <label htmlFor={`file-upload-${questionId}`}>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById(`file-upload-${questionId}`)?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter des documents
              </>
            )}
          </Button>
        </label>
        <input
          id={`file-upload-${questionId}`}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Evidence List */}
      {evidences && evidences.length > 0 && (
        <div className="space-y-2">
          {evidences.map((evidence) => (
            <Card key={evidence.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{evidence.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {evidence.fileSize ? (evidence.fileSize / 1024).toFixed(1) + ' KB' : 'Taille inconnue'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(evidence.fileUrl, "_blank")}
                  >
                    Voir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(evidence.id)}
                    disabled={deleteEvidence.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
