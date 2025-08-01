import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChapterIdentifier, AllEnrichmentData, CrossReference, WordStudy, Interpretation, EnrichmentType, DeepDiveData, Verse } from '../types.ts';
import { ChevronLeftIcon, ChevronRightIcon, BookmarkIcon, CheckCircleIcon, MenuIcon, SparklesIcon, InformationCircleIcon, XIcon, SpinnerIcon } from './Icons.tsx';
import DeepDive from './DeepDive.tsx';

interface StudyViewProps {
  isLoading: boolean;
  chapterIdentifier: ChapterIdentifier;
  verses: Verse[];
  enrichmentData: AllEnrichmentData | null;
  deepDiveData: DeepDiveData | null;
  onNext: () => void;
  onPrevious: () => void;
  onMarkComplete: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  note: string;
  onNoteChange: (newNote: string) => void;
  toggleSidebar: () => void;
  toggleEnrichment: () => void;
}

type PopoverPosition = 'above' | 'below';

const Popover: React.FC<{
  content: any[];
  position: { top: number; left: number };
  placement: PopoverPosition;
  onClose: () => void;
}> = ({ content, position, placement, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState('none');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (popoverRef.current) {
        const rect = popoverRef.current.getBoundingClientRect();
        const space = 32; // ~2rem padding/margin
        if (placement === 'above') {
            setMaxHeight(`${rect.top - space}px`);
        } else {
            setMaxHeight(`${window.innerHeight - rect.bottom - space}px`);
        }
    }
  }, [position, placement]);

  const renderContent = (item: any, type: string) => {
    switch(type) {
      case EnrichmentType.CrossReferences:
        const cr = item as CrossReference;
        return <>
          <p className="font-semibold text-blue-700">{cr.reference}</p>
          <p className="text-gray-600">{cr.explanation}</p>
        </>;
      case EnrichmentType.WordStudies:
        const ws = item as WordStudy;
        return <>
          <p className="font-semibold text-blue-700">{ws.originalWord} ({ws.transliteration})</p>
          <p className="text-gray-600"><span className="font-medium">Meaning:</span> {ws.meaning}</p>
        </>;
      case EnrichmentType.Interpretations:
        const i = item as Interpretation;
        return <>
          <p className="font-semibold text-blue-700">{i.viewpoint}</p>
          <p className="text-gray-600">{i.summary}</p>
        </>;
      default: return null;
    }
  }

  const placementClasses = {
      above: 'transform -translate-y-full -mt-2',
      below: 'mt-2'
  }

  return (
    <div
      ref={popoverRef}
      className={`fixed z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-200 ${placementClasses[placement]}`}
      style={{ top: position.top, left: position.left }}
    >
      <div className="relative p-4 max-h-[450px] overflow-y-auto" style={{ maxHeight }}>
        <button onClick={onClose} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-800 rounded-full z-10 transition-colors">
          <XIcon className="h-4 w-4" />
        </button>
        <div className="space-y-3 text-sm pt-2 pr-4">
            {content.map((item, index) => (
              <div key={index} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                {renderContent(item.data, item.type)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};


const StudyView: React.FC<StudyViewProps> = ({
  isLoading,
  chapterIdentifier,
  verses,
  enrichmentData,
  deepDiveData,
  onNext,
  onPrevious,
  onMarkComplete,
  isBookmarked,
  onToggleBookmark,
  note,
  onNoteChange,
  toggleSidebar,
  toggleEnrichment
}) => {
  const [popover, setPopover] = useState<{
    visible: boolean;
    content: any[] | null;
    position: { top: number; left: number };
    placement: PopoverPosition;
  }>({ visible: false, content: null, position: { top: 0, left: 0 }, placement: 'above' });

  const viewRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isLoading && viewRef.current) {
        viewRef.current.scrollTop = 0;
    }
    setPopover(p => ({...p, visible: false}));
  }, [isLoading, chapterIdentifier]);


  const findEnrichmentsForVerse = useCallback((verse: number) => {
    if (!enrichmentData) return [];
    const results: {type: string, data: any}[] = [];
    (enrichmentData.crossReferences || []).forEach(d => d.verse === verse && results.push({type: EnrichmentType.CrossReferences, data: d}));
    (enrichmentData.wordStudies || []).forEach(d => d.verse === verse && results.push({type: EnrichmentType.WordStudies, data: d}));
    (enrichmentData.interpretations || []).forEach(d => d.verse === verse && results.push({type: EnrichmentType.Interpretations, data: d}));
    return results;
  }, [enrichmentData]);
  
  const handleAnnotationClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, content: any[]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 288; // w-72
    const spaceFromEdge = 16;
    const popoverHeightEstimate = 300;

    let left = rect.left + (rect.width / 2) - (popoverWidth / 2);
    if (left < spaceFromEdge) {
      left = spaceFromEdge;
    } else if (left + popoverWidth > window.innerWidth - spaceFromEdge) {
      left = window.innerWidth - popoverWidth - spaceFromEdge;
    }

    const placement: PopoverPosition = rect.top < popoverHeightEstimate ? 'below' : 'above';
    const top = placement === 'above' ? rect.top : rect.bottom;

    setPopover({
      visible: true,
      content,
      position: { top, left },
      placement
    });
  }, []);

  const renderedContent = useMemo(() => {
    if (!Array.isArray(verses) || verses.length === 0) {
      return <p className="text-red-600 bg-red-50 p-4 rounded-md font-sans">No verses available for this chapter.</p>;
    }
    if (verses.length === 1 && verses[0].verse === 0) {
      return <p className="text-red-600 bg-red-50 p-4 rounded-md font-sans">{verses[0].text}</p>;
    }

    return verses.map((verse) => {
        const verseEnrichments = findEnrichmentsForVerse(verse.verse);

        return (
            <span key={verse.verse} className="inline-block mb-1">
                <sup className="font-sans font-bold text-blue-500 mr-1 select-none">{verse.verse}</sup>
                <span className="leading-loose">{verse.text}</span>
                {verseEnrichments.length > 0 && (
                    <button 
                      onClick={(e) => handleAnnotationClick(e, verseEnrichments)} 
                      className="inline-block -translate-y-0.5 mx-1 text-blue-400 hover:text-blue-600 transition-colors"
                      aria-label={`Show enrichments for verse ${verse.verse}`}
                    >
                        <InformationCircleIcon />
                    </button>
                )}
            </span>
        );
    });
  }, [verses, findEnrichmentsForVerse, handleAnnotationClick]);

  return (
    <div ref={viewRef} className="flex-1 flex flex-col bg-white overflow-y-auto pb-24 relative">
      {popover.visible && <Popover content={popover.content!} position={popover.position} placement={popover.placement} onClose={() => setPopover({...popover, visible: false})}/>}
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm p-3 border-b border-gray-200 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
            <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full lg:hidden">
                <MenuIcon />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {chapterIdentifier.book} {chapterIdentifier.chapter}
            </h1>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${
              isBookmarked ? 'text-yellow-500' : 'text-gray-500'
            }`}
            aria-label="Bookmark chapter"
          >
            <BookmarkIcon solid={isBookmarked} />
          </button>
          <button onClick={toggleEnrichment} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full lg:hidden">
              <SparklesIcon />
          </button>
        </div>
      </header>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <SpinnerIcon />
        </div>
      ) : (
        <>
            <article className="p-4 md:p-8 flex-grow">
              <div
                className="font-serif text-lg text-gray-800"
              >
                {renderedContent}
              </div>
            </article>

            <div className="px-4 md:px-8">
              <DeepDive data={deepDiveData} isLoading={isLoading} />
            </div>

            <footer className="p-4 md:px-8 mt-8">
              <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Personal Notes</h3>
                  <textarea
                      value={note}
                      onChange={(e) => onNoteChange(e.target.value)}
                      placeholder="Write your reflections here..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                      rows={5}
                  />
              </div>
              <button
                onClick={onMarkComplete}
                className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
              >
                <CheckCircleIcon />
                <span className="ml-2">Mark as Completed</span>
              </button>
            </footer>
        </>
      )}
      
      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-2 flex justify-center items-center gap-x-4 lg:hidden z-20">
          <button
            onClick={onPrevious}
            className="p-3 rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors shadow"
            aria-label="Previous chapter"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={onNext}
            className="p-3 rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors shadow"
            aria-label="Next chapter"
          >
            <ChevronRightIcon />
          </button>
      </nav>
    </div>
  );
};

export default StudyView;