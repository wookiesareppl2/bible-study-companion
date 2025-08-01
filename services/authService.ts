import { UserData, StudyMode, ChapterIdentifier, CachedChapterContent, TranslationKey, BookName } from '../types.ts';
import { supabase, Database, Json } from './supabaseClient.ts';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Type guard to check if an object is a valid ChapterIdentifier.
 * This prevents crashes from malformed data in the database.
 * @param obj The object to check.
 * @returns True if the object is a valid ChapterIdentifier.
 */
const isChapterIdentifier = (obj: any): obj is ChapterIdentifier => {
    return obj && typeof obj.book === 'string' && typeof obj.chapter === 'number';
};

const fromSupabase = (profile: ProfileRow): UserData => {
    const rawChapter = profile.user_selected_chapter as unknown;
    const validatedChapter = isChapterIdentifier(rawChapter) ? rawChapter : null;

    return {
        id: profile.id,
        username: profile.username || 'User',
        studyMode: (profile.study_mode as StudyMode) || StudyMode.READ_THROUGH,
        readThroughIndex: profile.read_through_index ?? 0,
        userSelectedChapter: validatedChapter,
        // ROBUST GUARD: Use Array.isArray to prevent crashes if the database returns a
        // non-array object (like {}) for a JSON field that should be an array.
        completedChapters: Array.isArray(profile.completed_chapters) ? profile.completed_chapters : [],
        bookmarks: Array.isArray(profile.bookmarks) ? profile.bookmarks : [],
        notes: (profile.notes as unknown as Record<string, string> | null) || {},
        cachedContent: (profile.cached_content as unknown as Record<string, CachedChapterContent> | null) || {},
        translation: (profile.translation as TranslationKey) || 'web',
        updated_at: profile.updated_at || undefined
    };
};

const toSupabase = (data: Partial<UserData>): Partial<ProfileUpdate> => {
    const dbData: Partial<ProfileUpdate> = {};
    if (data.username !== undefined) dbData.username = data.username;
    if (data.studyMode !== undefined) dbData.study_mode = data.studyMode;
    if (data.readThroughIndex !== undefined) dbData.read_through_index = data.readThroughIndex;
    if (data.userSelectedChapter !== undefined) dbData.user_selected_chapter = data.userSelectedChapter as unknown as Json;
    if (data.completedChapters !== undefined) dbData.completed_chapters = data.completedChapters;
    if (data.bookmarks !== undefined) dbData.bookmarks = data.bookmarks;
    if (data.notes !== undefined) dbData.notes = data.notes as unknown as Json;
    if (data.cachedContent !== undefined) dbData.cached_content = data.cachedContent as unknown as Json;
    if (data.translation !== undefined) dbData.translation = data.translation;
    return dbData;
};


/**
 * Creates a new user in Supabase Auth.
 * A trigger in the database will create a corresponding 'profiles' row.
 */
export async function registerUser(username: string, email: string, password: string): Promise<{ success: boolean, message: string }> {
  const { data, error } = await supabase.auth.signUp(
    {
      email,
      password,
      options: {
        data: {
          username: username,
          // Set default values that the DB trigger will use
          study_mode: StudyMode.READ_THROUGH,
          read_through_index: 0,
          completed_chapters: [],
          bookmarks: [],
          notes: {},
          cached_content: {},
          translation: 'web',
        }
      }
    }
  );

  if (error) {
    return { success: false, message: error.message };
  }
  
  if (data.user && !data.session) {
     return { success: true, message: 'Registration successful! Please check your email to confirm your account.' };
  }

  return { success: true, message: 'Registration successful!' };
}

/**
 * Logs in a user using Supabase Auth.
 */
export async function loginUser(email: string, password: string): Promise<{ success: boolean, message: string }> {
  console.log("[loginUser] Attempting login with:", email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log("[loginUser] Supabase response:", { data, error });

  if (error) {
    return { success: false, message: error.message };
  }

  if (data?.user && data?.session) {
    return { success: true, message: 'Login successful!' };
  }

  return { success: false, message: 'Invalid login credentials.' };
}

/**
 * Signs out the current user.
 */
export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error(`Error logging out: ${error.message}`, error);
  }
}

/**
 * Retrieves the current user's profile from the 'profiles' table.
 * Includes a retry mechanism to handle potential race conditions during registration
 * where the profile creation trigger might be slightly delayed.
 */
export async function getUserData(id: string): Promise<UserData | null> {
    console.log('[getUserData] START', { id });
    // Debug: show supabase client instance and current session
    console.log('[getUserData] Supabase client instance:', supabase);
    try {
        console.log('[getUserData] Before supabase.auth.getSession');
        const sessionResult = await supabase.auth.getSession();
        console.log('[getUserData] After supabase.auth.getSession:', sessionResult);
    } catch (err) {
        console.error('[getUserData] Error in supabase.auth.getSession:', err);
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`[getUserData] Attempt ${attempt} for user id: ${id}`);
        let didTimeout = false;
        const timeout = setTimeout(() => {
            didTimeout = true;
            console.error(`[getUserData] Timeout after 2000ms on attempt ${attempt} for user id: ${id}`);
        }, 2000);
        try {
            console.log('[getUserData] Before Supabase profile query');
            const { data, error } = await supabase
                .from('profiles')
                .select('id, updated_at, username, study_mode, read_through_index, user_selected_chapter, completed_chapters, bookmarks, notes, cached_content, translation')
                .eq('id', id)
                .single();
            clearTimeout(timeout);
            console.log('[getUserData] After Supabase profile query:', { data, error });
            if (error) {
                console.error('[getUserData] Supabase profile query error:', error);
            }
            if (data) {
                console.log(`[getUserData] Success on attempt ${attempt} for user id: ${id}`);
                return fromSupabase(data as ProfileRow); // Success!
            }
        } catch (err) {
            clearTimeout(timeout);
            console.error(`[getUserData] Exception thrown on attempt ${attempt} for user id: ${id}`, err);
            return null;
        }
        clearTimeout(timeout);
        if (didTimeout) {
            // Already logged timeout
            return null;
        }
        // PGRST116: "Exactly one row expected, but 0 rows returned". This is fine, it means the profile doesn't exist yet.
        if (error && error.code !== 'PGRST116') {
            console.error(`Error fetching user profile (attempt ${attempt}): ${error.message}`, error);
            return null; // Don't retry on a hard error
        }
        if (data) {
            console.log(`[getUserData] Success on attempt ${attempt} for user id: ${id}`);
            return fromSupabase(data as ProfileRow); // Success!
        }
        // If no data (profile not found yet), wait and retry (except on the last attempt)
        if (attempt < 3) {
            await delay(attempt * 500); // Wait 500ms, then 1000ms
        }
    }
    // All retries failed
    console.warn(`Could not find user profile for id: ${id} after 3 attempts.`);
    return null;
}


/**
 * Updates a user's profile data in the 'profiles' table.
 */
export async function updateUserData(id: string, data: Partial<UserData>): Promise<void> {
    const updateData = toSupabase(data);
    const { error } = await supabase
        .from('profiles')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) {
        console.error(`Error updating user data: ${error.message}`, error);
    }
}

/**
 * Creates a profile for a user who exists in auth but not in the public.profiles table.
 * This acts as a fallback for the database trigger.
 */
export async function createProfileForUser(id: string, username: string | undefined | null): Promise<UserData | null> {
    const baseUsername = (username && username.trim().length >= 3) 
        ? username.trim() 
        : `user_${id.substring(0, 8)}`;

    const profileToInsert = {
        id: id,
        username: baseUsername,
        study_mode: StudyMode.READ_THROUGH,
        read_through_index: 0,
        completed_chapters: [] as string[],
        bookmarks: [] as string[],
        notes: {} as Json,
        cached_content: {} as Json,
        translation: 'web' as const,
    };

    let { data, error } = await supabase
        .from('profiles')
        .insert(profileToInsert)
        .select('id, updated_at, username, study_mode, read_through_index, user_selected_chapter, completed_chapters, bookmarks, notes, cached_content, translation')
        .single();
    
    // If the insert failed because the username is already taken...
    if (error && error.code === '23505' && error.message.includes('profiles_username_key')) {
        console.warn(`Username "${baseUsername}" is taken. Trying a fallback.`);
        const fallbackUsername = `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`;
        
        const retryResult = await supabase
            .from('profiles')
            .insert({ ...profileToInsert, username: fallbackUsername })
            .select('id, updated_at, username, study_mode, read_through_index, user_selected_chapter, completed_chapters, bookmarks, notes, cached_content, translation')
            .single();
        
        data = retryResult.data;
        error = retryResult.error;
    }

    if (error) {
        if (error.code === '23505') { 
            console.warn("Profile creation failed, likely because it already exists. Fetching profile.");
            return getUserData(id);
        }
        console.error(`Failed to create user profile after retries: ${error.message}`, error);
        return null;
    }

    if (data) {
        console.log(`Successfully created and healed profile for user ${id} with username "${(data as ProfileRow).username}".`);
        return fromSupabase(data as ProfileRow);
    }
    
    return null;
}
