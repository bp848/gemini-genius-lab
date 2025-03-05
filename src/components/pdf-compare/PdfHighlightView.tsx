import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { Difference } from '@/types/pdf-compare';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PdfHighlightViewProps {
  pdf1: File | null;
  pdf2: File | null;
  differences: Difference[];
  numPages1: number;
  numPages2: number;
  selectedDiffIndex: number | null;
  onDiffClick: (index: number) => void;
}

export function PdfHighlightView({ 
  pdf1, 
  pdf2, 
  differences, 
  numPages1, 
  numPages2,
  selectedDiffIndex,
  onDiffClick
}: PdfHighlightViewProps) {
  const [currentTab, setCurrentTab] = useState('original');
  
  // PDFとハイライトを組み合わせて表示するコンポーネント
  const PdfWithHighlights = ({ 
    file, 
    pageCount, 
    isOriginal 
  }: { 
    file: File | null, 
    pageCount: number,
    isOriginal: boolean
  }) => {
    if (!file) return null;
    
    const relevantDiffs = differences.filter(diff => 
      isOriginal ? diff.removed : diff.added
    );
    
    return (
      <div className="pdf-with-highlights relative border rounded">
        <ScrollArea className="h-[calc(100vh-25rem)]">
          <Document file={file}>
            {Array.from(new Array(pageCount), (_, i) => (
              <div key={`page_${i + 1}`} className="relative mb-4">
                <Page
                  key={`page_${i + 1}`}
                  pageNumber={i + 1}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  className="mb-4"
                />
                <div className="highlight-layer absolute top-0 left-0 w-full h-full pointer-events-none">
                  {/* ここにハイライトを表示する。実際の実装ではpdfjs-distのテキストレイヤーと連携する必要がある */}
                  {relevantDiffs.map((diff, index) => (
                    <div 
                      key={`highlight-${index}`}
                      className={`highlight-item absolute ${isOriginal ? 'bg-red-300/50' : 'bg-green-300/50'} p-1 rounded`}
                      style={{
                        top: `${Math.random() * 80}%`,  // 本来はテキスト位置から計算する
                        left: `${Math.random() * 80}%`,
                        width: `${Math.min(200, Math.random() * 300)}px`,
                        height: '20px',
                        opacity: selectedDiffIndex === index ? 1 : 0.7,
                        transform: selectedDiffIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => onDiffClick(index)}
                    >
                      <span className="text-xs">{diff.value.substring(0, 30)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Document>
        </ScrollArea>
      </div>
    );
  };
  
  return (
    <Card className="pdf-highlight-view">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="w-full">
          <TabsTrigger value="original" className="flex-1">元のPDF</TabsTrigger>
          <TabsTrigger value="new" className="flex-1">新しいPDF</TabsTrigger>
        </TabsList>
        <TabsContent value="original">
          <PdfWithHighlights 
            file={pdf1} 
            pageCount={numPages1 || 0} 
            isOriginal={true} 
          />
        </TabsContent>
        <TabsContent value="new">
          <PdfWithHighlights 
            file={pdf2} 
            pageCount={numPages2 || 0} 
            isOriginal={false} 
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
