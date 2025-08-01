import React, { useState } from 'react';
import { BIBLE_BOOKS, READING_PLAN, ChapterIdentifier, BookName } from '../constants.ts';
import { StudyMode, TranslationKey, AVAILABLE_TRANSLATIONS, Book } from '../types.ts';
import { MenuIcon, XIcon, BookOpenIcon, CollectionIcon, BookmarkIcon, ArrowLeftIcon, LightningBoltIcon, GlobeIcon, HomeIcon, LogoutIcon, TranslateIcon, CogIcon } from './Icons.tsx';

interface SidebarProps {
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  studyMode: StudyMode;
  setStudyMode: (mode: StudyMode) => void;
  currentChapter: ChapterIdentifier | null;
  completedChapters: string[];
  bookmarks: string[];
  onSelectChapter: (book: BookName, chapter: number) => void;
  onRandomChapter: () => void;
  readThroughIndex: number;
  onNavigateHome: () => void;
  onLogout: () => void;
  translation: TranslationKey;
  onTranslationChange: (newTranslation: TranslationKey) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  toggleSidebar,
  studyMode,
  setStudyMode,
  currentChapter,
  completedChapters = [],
  bookmarks = [],
  onSelectChapter,
  onRandomChapter,
  readThroughIndex,
  onNavigateHome,
  onLogout,
  translation,
  onTranslationChange
}) => {
  // RADICALLY DEFENSIVE: Use Array.isArray to prevent module loading race conditions
  // where a temporary empty object {} could be returned instead of an array.
  const safeBibleBooks: readonly Book[] = Array.isArray(BIBLE_BOOKS) ? BIBLE_BOOKS : [];
  const safeReadingPlan = Array.isArray(READING_PLAN) ? READING_PLAN : [];
  const safeCompletedChapters = Array.isArray(completedChapters) ? completedChapters : [];
  const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];

  const [selectedBook, setSelectedBook] = useState<BookName | null>(currentChapter?.book || 'Genesis');

  const readThroughPlanLength = Array.isArray(safeReadingPlan) ? safeReadingPlan.length : 0;
  const readThroughProgress = readThroughPlanLength > 0 
    ? Math.round(((readThroughIndex + 1) / readThroughPlanLength) * 100) 
    : 0;


  const renderBookList = () => (
    <div className="flex-1 overflow-y-auto">
      <h3 className="p-4 text-lg font-semibold text-gray-200">Books</h3>
      {safeBibleBooks.map((book) => (
        <button
          key={book.name}
          onClick={() => setSelectedBook(book.name)}
          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
            selectedBook === book.name ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          {book.name}
        </button>
      ))}
    </div>
  );

  const renderChapterList = () => {
    const bookData = safeBibleBooks.find(b => b.name === selectedBook);
    if (!bookData) return null;

    return (
      <div className="flex-1 flex flex-col">
        <button onClick={() => setSelectedBook(null)} className="flex items-center p-4 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
            <ArrowLeftIcon />
            <span className="ml-2">All Books</span>
        </button>
        <h3 className="px-4 pb-2 text-lg font-semibold text-gray-200">{bookData.name}</h3>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 md:grid-cols-5 gap-2">
          {Array.from({ length: bookData.chapters }, (_, i) => i + 1).map((chapter) => {
            const chapterIdentifierKey = `${bookData.name.replace(/\s/g, '_')}-${chapter}`;
            const isCompleted = completedChapters.includes(chapterIdentifierKey);
            const isCurrent = currentChapter?.book === bookData.name && currentChapter?.chapter === chapter;
            const isBookmarked = bookmarks.includes(chapterIdentifierKey);

            return (
              <button
                key={chapter}
                onClick={() => onSelectChapter(bookData.name, chapter)}
                className={`relative flex items-center justify-center h-10 w-10 rounded-full transition-all duration-200
                  ${isCurrent ? 'bg-blue-500 text-white font-bold ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-400'
                    : isCompleted ? 'bg-green-600/50 text-gray-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-blue-600 hover:scale-105'}
                `}
              >
                {chapter}
                {isBookmarked && <BookmarkIcon className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBookmarksList = () => (
    <div className="flex-1 flex flex-col">
      <h3 className="p-4 text-lg font-semibold text-gray-200">Bookmarks</h3>
      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">You haven't bookmarked any chapters yet.</p>
        ) : (
          bookmarks.map((bookmarkKey) => {
            const parts = bookmarkKey.split('-');
            const chapterStr = parts.pop() || '1';
            const bookNameWithUnderscores = parts.join('-');
            const book = bookNameWithUnderscores.replace(/_/g, ' ');
            const chapter = parseInt(chapterStr, 10);
            return (
              <button
                key={bookmarkKey}
                onClick={() => onSelectChapter(book as BookName, chapter)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  currentChapter?.book === book && currentChapter?.chapter === chapter 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {book} {chapter}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const NavButton = ({ Icon, text, onClick, active }: { Icon: React.FC<{className?: string}>, text: string, onClick: () => void, active: boolean }) => (
    <button onClick={onClick} className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        <Icon className="h-6 w-6"/>
        <span className="ml-4 font-medium">{text}</span>
    </button>
  );

  return (
    <aside className={`bg-gray-800 text-white flex flex-col shadow-2xl z-40
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-80
        fixed inset-y-0 left-0 w-80
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-blue-400" />
            <h1 className="text-xl font-bold ml-2">Bible Study</h1>
        </div>
        <button onClick={toggleSidebar} className="p-2 text-gray-400 hover:text-white rounded-md lg:hidden">
          <XIcon />
        </button>
      </div>

      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2">Study Mode</h2>
        <div className="space-y-2">
             <NavButton Icon={CollectionIcon} text="Read Through" onClick={() => setStudyMode(StudyMode.READ_THROUGH)} active={studyMode === StudyMode.READ_THROUGH}/>
             {studyMode === StudyMode.READ_THROUGH && (
                <div className="px-2 pb-2">
                    <p className="text-sm text-gray-300 mb-1">Day {readThroughIndex + 1} of {readThroughPlanLength}</p>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${readThroughProgress}%`}}></div>
                    </div>
                </div>
             )}
             <NavButton Icon={GlobeIcon} text="Book Study" onClick={() => setStudyMode(StudyMode.BOOK)} active={studyMode === StudyMode.BOOK}/>
             <NavButton Icon={TranslateIcon} text="Scripture Reader" onClick={() => setStudyMode(StudyMode.SCRIPTURE_READER)} active={studyMode === StudyMode.SCRIPTURE_READER}/>
             <NavButton Icon={LightningBoltIcon} text="Random Chapter" onClick={() => { setStudyMode(StudyMode.RANDOM); onRandomChapter(); }} active={studyMode === StudyMode.RANDOM}/>
        </div>
      </div>
      
       <div className="p-4 border-b border-gray-700">
          <h2 className="text-xs font-semibold uppercase text-gray-400 mb-3 flex items-center"><CogIcon className="h-4 w-4 mr-2"/>Preferences</h2>
           <div className="space-y-2">
               <div>
                   <label htmlFor="translation-select" className="block text-sm font-medium text-gray-300 mb-1">Bible Translation</label>
                   <select
                        id="translation-select"
                        value={translation}
                        onChange={(e) => onTranslationChange(e.target.value as TranslationKey)}
                        className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.entries(AVAILABLE_TRANSLATIONS).map(([key, name]) => (
                            <option key={key} value={key}>{name}</option>
                        ))}
                    </select>
               </div>
           </div>
       </div>

      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2">Account</h2>
        <div className="space-y-2">
             <NavButton Icon={BookmarkIcon} text="Bookmarks" onClick={() => setStudyMode(StudyMode.BOOKMARKS)} active={studyMode === StudyMode.BOOKMARKS}/>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {studyMode === StudyMode.SCRIPTURE_READER ? (
             <div className="p-4 text-center text-gray-400">
                <h3 className="font-semibold text-lg text-gray-200 mb-2">Scripture Reader</h3>
                <p className="text-sm">Use the main view to select and compare passages across different translations.</p>
            </div>
        ) : studyMode === StudyMode.READ_THROUGH ? (
            <div className="p-4 text-center text-gray-400">
                <h3 className="font-semibold text-lg text-gray-200 mb-2">Reading Plan</h3>
                <p className="text-sm">Follow the curated plan. Your next chapter is ready!</p>
            </div>
        ) : studyMode === StudyMode.BOOKMARKS ? (
            renderBookmarksList()
        ) : (
            selectedBook ? renderChapterList() : renderBookList()
        )}
      </div>
      
      <div className="p-2 border-t border-gray-700">
        <div className="space-y-1">
            <NavButton Icon={HomeIcon} text="Home" onClick={onNavigateHome} active={false}/>
            <NavButton Icon={LogoutIcon} text="Logout" onClick={onLogout} active={false}/>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;