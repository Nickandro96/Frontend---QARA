import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantChatPanelProps {
  title: string;
  placeholder?: string;
  emptyStateHint: string;
  disclaimer: string;
  onSend: (messages: AssistantChatMessage[]) => Promise<string>;
}

/**
 * Panneau de chat générique — assistant IA réglementaire (2 modes, voir
 * docs/audit/13-ia-reglementaire.md). Réutilisé pour le mode utilisateur
 * ("Aide-moi à répondre") et le mode auditeur ("Analyser mes résultats") ;
 * seul `onSend` (l'appel tRPC réel) change entre les deux.
 */
export function AssistantChatPanel({ title, placeholder, emptyStateHint, disclaimer, onSend }: AssistantChatPanelProps) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const content = input.trim();
    if (!content || isSending) return;

    const nextMessages: AssistantChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const reply = await onSend(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'assistant n'a pas pu répondre.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        {title}
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border bg-slate-50 p-3">
        {messages.length === 0 && <p className="text-xs text-muted-foreground">{emptyStateHint}</p>}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
              m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-white border"
            )}
          >
            {m.content}
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            L'assistant réfléchit...
          </div>
        )}
      </div>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{error}</div>}

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder ?? "Posez votre question..."}
          className="min-h-[44px] resize-none"
          rows={2}
        />
        <Button type="button" size="icon" onClick={handleSend} disabled={isSending || !input.trim()} className="h-11 w-11 shrink-0">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">{disclaimer}</p>
    </div>
  );
}
