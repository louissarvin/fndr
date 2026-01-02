import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { FileText, X, ExternalLink, Download, Loader2 } from 'lucide-react';
import { ipfsToHttp } from '@/hooks/useIPFS';

interface PitchDeckViewerProps {
  pitchDeckHash: string | undefined;
  companyName?: string;
}

export default function PitchDeckViewer({ pitchDeckHash, companyName }: PitchDeckViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!pitchDeckHash) return null;

  const pdfUrl = ipfsToHttp(pitchDeckHash);
  if (!pdfUrl) return null;

  const handleOpenExternal = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
      >
        <FileText className="h-4 w-4" />
        View Pitch Deck
      </button>

      {/* Modal */}
      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-5xl h-[90vh] translate-x-[-50%] translate-y-[-50%]">
            <div className="relative bg-[#1A1A1A] rounded-2xl overflow-hidden h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <DialogPrimitive.Title className="text-lg font-semibold text-white">
                    {companyName ? `${companyName} - Pitch Deck` : 'Pitch Deck'}
                  </DialogPrimitive.Title>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenExternal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </button>
                  <a
                    href={pdfUrl}
                    download
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  <DialogPrimitive.Close asChild>
                    <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </DialogPrimitive.Close>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 relative bg-[#0A0A0A]">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#A2D5C6]" />
                  </div>
                )}
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
                  className="w-full h-full"
                  onLoad={() => setIsLoading(false)}
                  title="Pitch Deck PDF"
                />
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
