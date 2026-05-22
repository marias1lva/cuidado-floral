import { Paperclip, Download, FileText, Image as ImageIcon } from "lucide-react";

import type { AppointmentAttachment } from "../../domain/types";

interface AppointmentAttachmentsProps {
  attachments: AppointmentAttachment[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon size={14} className="text-pink-600" />;
  }
  return <FileText size={14} className="text-pink-600" />;
}

export function AppointmentAttachments({ attachments }: AppointmentAttachmentsProps) {
  return (
    <div className="rounded-xl border border-pink-100 bg-white/70 p-3">
      <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--foreground)]">
        <Paperclip size={12} />
        Anexos ({attachments.length})
      </p>
      <ul className="flex flex-col gap-1.5">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.filename}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--foreground)] transition-colors hover:bg-pink-50"
            >
              <span className="inline-flex min-w-0 items-center gap-2 truncate">
                {iconFor(attachment.mimeType)}
                <span className="truncate font-medium">{attachment.filename}</span>
                <span className="shrink-0 text-[var(--muted-foreground)]">
                  {formatFileSize(attachment.size)}
                </span>
              </span>
              <Download size={12} className="shrink-0 text-pink-600" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
