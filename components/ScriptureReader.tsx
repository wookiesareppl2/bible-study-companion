import React, { useState, useCallback } from 'react';
import { getPassage } from '../services/bibleApiService';
import { BIBLE_BOOKS } from '../constants';
import { BookName, Passage, Book } from '../types';
import { SpinnerIcon, BookOpenIcon, XIcon } from './Icons';

const TRANSLATIONS = [
  { id: 'kjv', name: 'King James Version' },
  { id: 'web', name: 'World English Bible' },
  { id: 'bbe', name: 'Bible in Basic English' },
];

type PassageData = {
    [key: string]: {
        data: Passage | null;
        error: string | null;
        loading: boolean;
    }
};

const ScriptureReader: React.FC = () => {
    const [book, setBook] = useState<BookName>('John');
    const [chapter, setChapter] = useState('3');
    const [verses, setVerses] = useState('16');
    const [selectedTranslations, setSelectedTranslations] = useState<string[]>(['kjv', 'web']);
    const [passageData, setPassageData] = useState<PassageData>({});
    const [isFetching, setIsFetching] = useState(false);

    // RADICALLY DEFENSIVE: Use Array.isArray to prevent module loading race conditions
    // where a temporary empty object {} could be returned instead of an array.
    const safeBibleBooks: readonly Book[] = Array.isArray(BIBLE_BOOKS) ? BIBLE_BOOKS : [];

    const handleTranslationChange = (id: string) => {
        setSelectedTranslations(prev => 
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    };

    const handleFetchPassage = useCallback(async () => {
        if (selectedTranslations.length === 0) {
            alert('Please select at least one translation.');
            return;
        }
        
        setIsFetching(true);
        const passageRef = `${book} ${chapter}:${verses}`;
        
        const initialData: PassageData = {};
        selectedTranslations.forEach(t => {
            initialData[t] = { data: null, error: null, loading: true };
        });
        setPassageData(initialData);

        const results = await Promise.allSettled(
            selectedTranslations.map(transId => getPassage(passageRef, transId))
        );

        const finalData: PassageData = {};
        results.forEach((result, index) => {
            const transId = selectedTranslations[index];
            if (result.status === 'fulfilled') {
                finalData[transId] = { data: result.value, error: null, loading: false };
            } else {
                finalData[transId] = { data: null, error: (result.reason as Error).message || 'Failed to fetch passage.', loading: false };
            }
        });

        setPassageData(finalData);
        setIsFetching(false);

    }, [book, chapter, verses, selectedTranslations]);

    const bookData = safeBibleBooks.find(b => b.name === book);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="p-4 border-b border-gray-200 bg-white">
                <h1 className="text-2xl font-bold text-gray-800">Scripture Reader</h1>
                <p className="text-sm text-gray-500">Compare Bible passages across different translations.</p>
            </header>

            <div className="p-4 space-y-4 bg-white border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="book-select" className="block text-sm font-medium text-gray-700">Book</label>
                        <select id="book-select" value={book} onChange={e => setBook(e.target.value as BookName)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            {safeBibleBooks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="chapter-input" className="block text-sm font-medium text-gray-700">Chapter</label>
                         <input type="number" id="chapter-input" value={chapter} onChange={e => setChapter(e.target.value)} min="1" max={bookData?.chapters} className="mt-1 block w-full text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="verses-input" className="block text-sm font-medium text-gray-700">Verse(s)</label>
                        <input type="text" id="verses-input" value={verses} onChange={e => setVerses(e.target.value)} placeholder="e.g., 1-5 or 16" className="mt-1 block w-full text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"/>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="block text-sm font-medium text-gray-700">Translations</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {TRANSLATIONS.map(t => (
                             <label key={t.id} className="inline-flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={selectedTranslations.includes(t.id)} 
                                    onChange={() => handleTranslationChange(t.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{t.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                     <button
                        onClick={handleFetchPassage}
                        disabled={isFetching}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                        {isFetching && <SpinnerIcon />}
                        <span className={isFetching ? 'ml-2' : ''}>Load Passage</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {Object.keys(passageData).length === 0 && !isFetching && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <BookOpenIcon className="h-16 w-16 mb-4 text-gray-400"/>
                        <h2 className="text-xl font-semibold text-gray-700">Enter a passage to begin</h2>
                        <p>Select a book, chapter, verse(s), and translations, then click "Load Passage".</p>
                    </div>
                )}
                <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`}>
                    {selectedTranslations.map(transId => {
                         const translation = TRANSLATIONS.find(t => t.id === transId);
                         const pData = passageData[transId];
                        return (
                            <div key={transId} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-800 p-4 border-b border-gray-200">
                                    {translation?.name}
                                </h3>
                                <div className="p-4 flex-1">
                                    {pData?.loading && <div className="flex justify-center items-center h-32"><SpinnerIcon /></div>}
                                    {pData?.error && (
                                        <div className="text-red-600 bg-red-50 p-3 rounded-md">
                                            <p className="font-semibold">Error</p>
                                            <p className="text-sm">{pData.error}</p>
                                        </div>
                                    )}
                                    {pData?.data && (
                                        <div>
                                            <p className="text-sm font-semibold text-blue-600 mb-2">{pData.data.reference}</p>
                                            <p className="text-gray-700 leading-relaxed font-serif">{pData.data.text}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default ScriptureReader;