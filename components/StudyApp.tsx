import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar.tsx';
import StudyView from './StudyView.tsx';
import EnrichmentPanel from './EnrichmentPanel.tsx';
import { StudyMode, AllEnrichmentData, DeepDiveData, UserData, TranslationKey, Verse, Book } from '../types.ts';
import { BIBLE_BOOKS, READING_PLAN, ChapterIdentifier, BookName } from '../constants.ts';
import { getAllChapterEnrichments, getChapterDeepDive } from '../services/geminiService.ts';
import { robustSafeParse } from '../utils/cache.ts'; // Robust cache parsing
import { getChapterTextFromApi } from '../services/bibleApiService.ts';
import { BookOpenIcon, SpinnerIcon } from './Icons.tsx';
import ScriptureReader from './ScriptureReader.tsx';

interface StudyAppProps {
  userData: UserData | null;
  onUpdateUserData: (data: Partial<UserData>) => Promise<void>;
  onLogout: () => void;
  onNavigateHome: () => void;
}

const getCacheKey = (identifier: ChapterIdentifier, translation: TranslationKey): string => {
    return `${identifier.book.replace(/\s/g, '_')}-${identifier.chapter}-${translation}`;
};

export default function StudyApp({ userData, onUpdateUserData, onLogout, onNavigateHome }: StudyAppProps) {
  // RADICAL DEFENSE: If userData is not available, show a loader and do nothing else.
  // This is the primary guard against all downstream errors.
  if (!userData) {
      return (
        <div className="flex-1 flex items-center justify-center bg-white h-full">
            <SpinnerIcon />
        </div>
      );
  }

  // CENTRALIZED SANITIZATION: Create guaranteed-safe local variables from userData.
  // This prevents passing null/undefined arrays or objects downstream.
  const { id } = userData;
  const safeStudyMode = userData.studyMode || StudyMode.READ_THROUGH;
  const safeReadThroughIndex = userData.readThroughIndex ?? 0;
  const safeUserSelectedChapter = userData.userSelectedChapter || null;
  // ROBUST CHECK: Use Array.isArray to prevent crashes if the data is malformed during loading.
  let safeCompletedChapters = Array.isArray(userData.completedChapters) ? userData.completedChapters : [];
  // Defensive: Prevent .length on undefined/null
  if (!Array.isArray(safeCompletedChapters)) safeCompletedChapters = [];
  let safeBookmarks = Array.isArray(userData.bookmarks) ? userData.bookmarks : [];
  if (!Array.isArray(safeBookmarks)) safeBookmarks = [];
  const safeNotes = (userData.notes && typeof userData.notes === 'object') ? userData.notes : {};
  // Defensive: Always parse cachedContent from localStorage if present, else fallback to userData
  const [cacheResetBanner, setCacheResetBanner] = useState(false);
  let safeCachedContent = userData.cachedContent || {};
  safeCachedContent = robustSafeParse('cachedContent', safeCachedContent, () => setCacheResetBanner(true));
  if (typeof safeCachedContent !== 'object' || safeCachedContent === null) safeCachedContent = {};
  const safeTranslation = userData.translation || 'web';
  
  // RADICALLY DEFENSIVE: Use Array.isArray to prevent module loading race conditions
  // where a temporary empty object {} could be returned instead of an array.
  const safeBibleBooks: readonly Book[] = Array.isArray(BIBLE_BOOKS) ? BIBLE_BOOKS : [];
  const safeReadingPlan = Array.isArray(READING_PLAN) ? READING_PLAN : [];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEnrichmentOpen, setIsEnrichmentOpen] = useState(false);
  const [isEnrichmentCollapsed, setIsEnrichmentCollapsed] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem('enrichmentCollapsed') || 'false');
      } catch {
        return false;
      }
  });

  useEffect(() => {
    localStorage.setItem('enrichmentCollapsed', JSON.stringify(isEnrichmentCollapsed));
  }, [isEnrichmentCollapsed]);
  
  const [isChapterLoading, setIsChapterLoading] = useState(true);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [deepDiveData, setDeepDiveData] = useState<DeepDiveData | null>(null);
  const [allEnrichmentData, setAllEnrichmentData] = useState<AllEnrichmentData | null>(null);

  // All downstream logic now uses the guaranteed-safe variables.
  const currentChapter = useMemo(() => {
    if (safeStudyMode === StudyMode.READ_THROUGH) {
      if (safeReadThroughIndex < safeReadingPlan.length) {
        return safeReadingPlan[safeReadThroughIndex] || null;
      }
      return null;
    }
    return safeUserSelectedChapter;
  }, [safeStudyMode, safeReadThroughIndex, safeUserSelectedChapter, safeReadingPlan]);

  const cacheKey = useMemo(() => currentChapter ? getCacheKey(currentChapter, safeTranslation) : null, [currentChapter, safeTranslation]);
  const chapterIdentifierKey = useMemo(() => currentChapter ? `${currentChapter.book.replace(/\s/g, '_')}-${currentChapter.chapter}` : null, [currentChapter]);

  useEffect(() => {
    if (currentChapter && cacheKey && safeStudyMode !== StudyMode.SCRIPTURE_READER) {
      const fetchAllChapterData = async () => {
        setIsChapterLoading(true);

        const cachedData = safeCachedContent?.[cacheKey];
        if (cachedData) {
            setVerses(cachedData.verses);
            setDeepDiveData(cachedData.deepDiveData);
            setAllEnrichmentData(cachedData.allEnrichmentData);
            setIsChapterLoading(false);
            return;
        }

        setVerses([]);
        setDeepDiveData(null);
        setAllEnrichmentData(null); 
        
        try {
          // Fetch text first, as it's the most critical piece of content.
          const chapterVerses = await getChapterTextFromApi(currentChapter, safeTranslation);
          setVerses(chapterVerses);

          // If text fails, we still show the error message but can fetch enrichments.
          const [deepDive, enrichments] = await Promise.all([
            getChapterDeepDive(currentChapter),
            getAllChapterEnrichments(currentChapter)
          ]);

          setDeepDiveData(deepDive);
          setAllEnrichmentData(enrichments);
          
          // Cache only if all data points are successfully fetched.
          if (chapterVerses.length > 0 && deepDive && enrichments) {
            const dataToCache = {
                verses: chapterVerses,
                deepDiveData: deepDive,
                allEnrichmentData: enrichments
            };
            await onUpdateUserData({ 
                cachedContent: { ...safeCachedContent, [cacheKey]: dataToCache } 
            });
          }
        
        } catch (error) {
            console.error("Failed to fetch chapter data:", error);
            const errorMessage = (error instanceof Error && error.message.includes("quota"))
                 ? 'Failed to load chapter data: Daily API quota exceeded. Please try again tomorrow.'
                 : `There was an error loading the chapter text: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
            
            setVerses([{
                book_id: '',
                book_name: currentChapter.book,
                chapter: currentChapter.chapter,
                verse: 0, // Special value to indicate an error message
                text: errorMessage
            }]);
             
             setAllEnrichmentData({
                crossReferences: [],
                wordStudies: [],
                historicalContext: { geography: '', customs: '', politicalClimate: '' },
                literaryAnalysis: { structure: '', themes: [] },
                interpretations: []
            });
        } finally {
            setIsChapterLoading(false);
        }
      };
      
      fetchAllChapterData();
    } else {
        setIsChapterLoading(false);
    }
  }, [currentChapter, safeStudyMode, id, cacheKey, safeTranslation, onUpdateUserData, safeCachedContent]);


  const setStudyModeState = (mode: StudyMode) => onUpdateUserData({ studyMode: mode });

  const handleTranslationChange = async (newTranslation: TranslationKey) => {
    await onUpdateUserData({ translation: newTranslation });
  };

  const handleSelectChapter = useCallback(async (book: BookName, chapter: number) => {
    await onUpdateUserData({ userSelectedChapter: { book, chapter } });
    setIsSidebarOpen(false);
  }, [onUpdateUserData]);

  const markChapterComplete = useCallback(async () => {
    if (chapterIdentifierKey && !safeCompletedChapters.includes(chapterIdentifierKey)) {
      await onUpdateUserData({ completedChapters: [...safeCompletedChapters, chapterIdentifierKey] });
    }
  }, [safeCompletedChapters, onUpdateUserData, chapterIdentifierKey]);

  const handleNextChapter = useCallback(async () => {
    await markChapterComplete();
    if (safeStudyMode === StudyMode.READ_THROUGH) {
      if (safeReadThroughIndex < safeReadingPlan.length - 1) {
        await onUpdateUserData({ readThroughIndex: safeReadThroughIndex + 1 });
      }
    } else if (currentChapter) {
      const currentBook = safeBibleBooks.find(b => b.name === currentChapter.book);
      if (!currentBook) return;

      if (currentChapter.chapter < currentBook.chapters) {
        await onUpdateUserData({ userSelectedChapter: { book: currentChapter.book, chapter: currentChapter.chapter + 1 } });
      } else {
        const currentBookIndex = safeBibleBooks.findIndex(b => b.name === currentChapter.book);
        if (currentBookIndex > -1 && currentBookIndex < safeBibleBooks.length - 1) {
          const nextBook = safeBibleBooks[currentBookIndex + 1];
          await onUpdateUserData({ userSelectedChapter: { book: nextBook.name, chapter: 1 } });
        }
      }
    }
  }, [currentChapter, safeStudyMode, safeReadThroughIndex, markChapterComplete, onUpdateUserData, safeReadingPlan, safeBibleBooks]);
  
  const handlePreviousChapter = useCallback(async () => {
    if (safeStudyMode === StudyMode.READ_THROUGH) {
      if (safeReadThroughIndex > 0) {
        await onUpdateUserData({ readThroughIndex: safeReadThroughIndex - 1 });
      }
    } else if (currentChapter) {
      const currentBookIndex = safeBibleBooks.findIndex(b => b.name === currentChapter.book);
      if(currentBookIndex === -1) return;

      if (currentChapter.chapter > 1) {
        await onUpdateUserData({ userSelectedChapter: { book: currentChapter.book, chapter: currentChapter.chapter - 1 } });
      } else {
        if (currentBookIndex > 0) {
          const prevBook = safeBibleBooks[currentBookIndex - 1];
          await onUpdateUserData({ userSelectedChapter: { book: prevBook.name, chapter: prevBook.chapters } });
        }
      }
    }
  }, [currentChapter, safeStudyMode, safeReadThroughIndex, onUpdateUserData, safeBibleBooks]);

  const handleRandomChapter = useCallback(async () => {
    const allChapters = safeBibleBooks.flatMap(book =>
      Array.from({ length: book.chapters }, (_, i) => `${book.name.replace(/\s/g, '_')}-${i + 1}`)
    );
    const unreadChapters = allChapters.filter(ch => !safeCompletedChapters.includes(ch));
    
    let chapterToSetKey;
    if (unreadChapters.length > 0) {
      chapterToSetKey = unreadChapters[Math.floor(Math.random() * unreadChapters.length)];
    } else {
      await onUpdateUserData({ completedChapters: [] });
      chapterToSetKey = allChapters[Math.floor(Math.random() * allChapters.length)];
    }
    const parts = chapterToSetKey.split('-');
    const chapterStr = parts.pop();
    const bookNameWithUnderscores = parts.join('-');
    const book = bookNameWithUnderscores.replace(/_/g, ' ') as BookName;
    const chapter = parseInt(chapterStr!, 10);
    await onUpdateUserData({ userSelectedChapter: { book, chapter } });
    setIsSidebarOpen(false);
  }, [safeCompletedChapters, onUpdateUserData, safeBibleBooks]);

  const handleToggleBookmark = useCallback(async () => {
    if (!chapterIdentifierKey) return;
    const newBookmarks = safeBookmarks.includes(chapterIdentifierKey) 
        ? safeBookmarks.filter(b => b !== chapterIdentifierKey) 
        : [...safeBookmarks, chapterIdentifierKey];
    await onUpdateUserData({ bookmarks: newBookmarks });
  }, [chapterIdentifierKey, safeBookmarks, onUpdateUserData]);
  
  const handleNoteChange = useCallback(async (newNote: string) => {
    if(!chapterIdentifierKey) return;
    const newNotes = {...safeNotes, [chapterIdentifierKey]: newNote};
    await onUpdateUserData({ notes: newNotes });
  }, [chapterIdentifierKey, safeNotes, onUpdateUserData]);

  const renderMainContent = () => {
    if (safeStudyMode === StudyMode.SCRIPTURE_READER) {
      return <ScriptureReader />;
    }

    if (currentChapter) {
      return (
        <StudyView
          isLoading={isChapterLoading}
          chapterIdentifier={currentChapter}
          verses={verses}
          enrichmentData={allEnrichmentData}
          deepDiveData={deepDiveData}
          onNext={handleNextChapter}
          onPrevious={handlePreviousChapter}
          onMarkComplete={markChapterComplete}
          isBookmarked={safeBookmarks.includes(chapterIdentifierKey || '')}
          onToggleBookmark={handleToggleBookmark}
          note={safeNotes?.[chapterIdentifierKey || ''] || ''}
          onNoteChange={handleNoteChange}
          toggleSidebar={() => setIsSidebarOpen(true)}
          toggleEnrichment={() => setIsEnrichmentOpen(true)}
        />
      );
    }
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-700 p-8 text-center">
          <BookOpenIcon className="h-16 w-16 text-blue-500 mb-6"/>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to your Study Companion</h1>
          <p className="text-lg text-gray-600 max-w-md">
            Your journey into the scriptures begins here. Select a study mode from the sidebar to get started.
          </p>
      </div>
    );
  };

  return (
    <>
      {cacheResetBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 border-b border-yellow-400 text-yellow-800 py-2 px-4 text-center font-semibold shadow">
          Corrupted cache was detected and reset. Please re-try your last action if something was missing.
          <button onClick={() => setCacheResetBanner(false)} className="ml-4 px-3 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900">Dismiss</button>
        </div>
      )}
      <div className="relative flex h-screen max-h-screen font-sans bg-gray-50 overflow-hidden">
        <Sidebar
          isMobileOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        studyMode={safeStudyMode}
        setStudyMode={setStudyModeState}
        currentChapter={currentChapter}
        completedChapters={safeCompletedChapters}
        onSelectChapter={handleSelectChapter}
        onRandomChapter={handleRandomChapter}
        bookmarks={safeBookmarks}
        readThroughIndex={safeReadThroughIndex}
        onNavigateHome={onNavigateHome}
        onLogout={onLogout}
        translation={safeTranslation}
        onTranslationChange={handleTranslationChange}
      />
       {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0">
        {renderMainContent()}
      </main>

      <EnrichmentPanel
        chapterIdentifier={currentChapter}
        isMobileOpen={isEnrichmentOpen}
        closePanel={() => setIsEnrichmentOpen(false)}
        isCollapsed={isEnrichmentCollapsed}
        toggleCollapse={() => setIsEnrichmentCollapsed(!isEnrichmentCollapsed)}
        enrichmentData={allEnrichmentData}
      />
      {isEnrichmentOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setIsEnrichmentOpen(false)} />}
    </div>
    </>
  );
}