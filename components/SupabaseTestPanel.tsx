import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SupabaseTestPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setError(null);
    console.log('[SupabaseTestPanel] Test button clicked. Starting Supabase test...');
    try {
      console.log('[SupabaseTestPanel] About to call supabase.from("profiles").select("*").limit(1)');
      // You need to initialize supabase here or import it from your client
      // For example: import { supabase } from '../services/supabaseClient';
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      console.log('[SupabaseTestPanel] Supabase call finished:', { data, error });
      if (error) {
        setError('Error: ' + error.message);
        console.error('[SupabaseTestPanel] Supabase error:', error);
      } else if (data && data.length > 0) {
        setResult(JSON.stringify(data[0], null, 2));
        console.log('[SupabaseTestPanel] Supabase data:', data);
      } else {
        setResult('No data found in profiles table.');
        console.warn('[SupabaseTestPanel] No data found in profiles table.');
      }
    } catch (err: any) {
      setError('Unexpected error: ' + (err?.message || String(err)));
      console.error('[SupabaseTestPanel] Unexpected error:', err);
    } finally {
      setLoading(false);
      console.log('[SupabaseTestPanel] Test finished. Loading set to false.');
    }
  };

  // Simple fetch test
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleSimpleFetch = async () => {
    setFetchLoading(true);
    setFetchResult(null);
    setFetchError(null);
    const url = 'https://seixvrxytfyrswpunzno.supabase.co/rest/v1/';
    console.log('[SupabaseTestPanel] Simple fetch test to', url);
    try {
      const resp = await fetch(url, { method: 'GET' });
      const text = await resp.text();
      setFetchResult(`Status: ${resp.status}\n${text}`);
      console.log('[SupabaseTestPanel] Simple fetch result:', resp.status, text);
    } catch (err: any) {
      setFetchError('Fetch error: ' + (err?.message || String(err)));
      console.error('[SupabaseTestPanel] Simple fetch error:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, margin: 16, borderRadius: 8 }}>
      <h3>Supabase Connection Test</h3>
      <button onClick={handleTest} disabled={loading} style={{ padding: '8px 16px', fontSize: 16, marginRight: 8 }}>
        {loading ? 'Testing...' : 'Test Supabase'}
      </button>
      <button onClick={handleSimpleFetch} disabled={fetchLoading} style={{ padding: '8px 16px', fontSize: 16 }}>
        {fetchLoading ? 'Fetching...' : 'Simple Fetch Test'}
      </button>
      {result && (
        <pre style={{ background: '#f4f4f4', marginTop: 16, padding: 8 }}>{result}</pre>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 16 }}>{error}</div>
      )}
      {fetchResult && (
        <pre style={{ background: '#e0f7fa', marginTop: 16, padding: 8 }}>{fetchResult}</pre>
      )}
      {fetchError && (
        <div style={{ color: 'red', marginTop: 16 }}>{fetchError}</div>
      )}
      <button onClick={async () => {
        setLoading(true);
        setResult(null);
        setError(null);
        console.log('[SupabaseTestPanel] Inline client test: creating client and querying profiles table...');
        try {
          const url = 'https://seixvrxytfyrswpunzno.supabase.co';
          const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaXh2cnh5dGZ5cnN3cHVuem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjQzMTAsImV4cCI6MjA2OTIwMDMxMH0.SonXWWhn5yoPwpwtGHRLLcFSEe0VhOk01AlU_rzd9rw';
          const client = createClient(url, key);
          const { data, error } = await client.from('profiles').select('*').limit(1);
          console.log('[SupabaseTestPanel] Inline client call finished:', { data, error });
          if (error) {
            setError('Inline client error: ' + error.message);
            console.error('[SupabaseTestPanel] Inline client error:', error);
          } else if (data && data.length > 0) {
            setResult(JSON.stringify(data[0], null, 2));
            console.log('[SupabaseTestPanel] Inline client data:', data);
          } else {
            setResult('No data found in profiles table (inline client).');
            console.warn('[SupabaseTestPanel] Inline client: No data found in profiles table.');
          }
        } catch (err: any) {
          setError('Inline client unexpected error: ' + (err?.message || String(err)));
          console.error('[SupabaseTestPanel] Inline client unexpected error:', err);
        } finally {
          setLoading(false);
          console.log('[SupabaseTestPanel] Inline client test finished. Loading set to false.');
        }
      }} disabled={loading} style={{ padding: '8px 16px', fontSize: 16, marginLeft: 8 }}>
        Inline Client Test
      </button>
    </div>
  );
};

export default SupabaseTestPanel;
