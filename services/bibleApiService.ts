import { ChapterIdentifier, TranslationKey, Passage, Verse } from '../types.ts';

const API_BASE = 'https://bible-api.com';

/**
 * Fetches a Bible passage from the public bible-api.com.
 * @param passage - The scripture reference, e.g., "John 3:16" or "Genesis 1:1-5".
 * @param translation - The Bible translation to use (e.g., 'kjv', 'web').
 * @returns A promise that resolves to the passage data or throws an error.
 */
export async function getPassage(passage: string, translation: string): Promise<Passage> {
    try {
        // Sanitize passage for URL: replace spaces with '+'
        const formattedPassage = passage.trim().replace(/\s/g, '+');
        const url = `${API_BASE}/${formattedPassage}?translation=${translation}`;
        
        const response = await fetch(url);

        if (!response.ok) {
            let errorMessage = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Ignore if response body is not JSON
            }
             if (response.status === 404) {
                throw new Error(`Passage not found in ${translation.toUpperCase()}. Please check the reference.`);
            }
            throw new Error(errorMessage);
        }

        const data: Passage = await response.json();
        return data;

    } catch (error) {
        console.error(`Error fetching passage [${passage}] for translation [${translation}]:`, error);
        // Re-throw the caught error to be handled by the component
        throw error;
    }
}

/**
 * Fetches the full text of a Bible chapter from bible-api.com and returns a structured array of verses.
 * @param identifier - The chapter to fetch.
 * @param translation - The user's preferred Bible translation.
 * @returns A promise that resolves to an array of Verse objects.
 */
export async function getChapterTextFromApi(identifier: ChapterIdentifier, translation: TranslationKey): Promise<Verse[]> {
    const passageRef = `${identifier.book} ${identifier.chapter}`;

    try {
        const passageData = await getPassage(passageRef, translation);
         // ROBUST GUARD: Use Array.isArray to prevent crashes if the API returns a malformed object
         // where `verses` is not an array. This is the definitive fix for the persistent crash.
         if (!Array.isArray(passageData.verses) || passageData.verses.length === 0) {
            throw new Error(passageData.text || 'Passage not found or API returned empty/malformed verses.');
        }
        // Clean up verse text by removing extraneous newlines that some translations might have.
        return passageData.verses.map(v => ({...v, text: v.text.replace(/\n/g, ' ').trim()}));
    } catch (error) {
        console.error(`Error fetching chapter text for ${passageRef} (${translation.toUpperCase()}):`, error);
        throw error;
    }
}