import React from 'react';
import { DeepDiveData } from '../types';

interface DeepDiveProps {
  data: DeepDiveData | null;
  isLoading: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mt-8 mb-4 pb-2 border-b-2 border-blue-200">
            {title}
        </h3>
        <div className="text-gray-700 leading-relaxed space-y-4">
            {children}
        </div>
    </div>
);

const SkeletonLoader = () => (
    <div className="space-y-8 animate-pulse">
        {[...Array(4)].map((_, i) => (
            <div key={i}>
                <div className="h-7 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        ))}
    </div>
);

const DeepDive: React.FC<DeepDiveProps> = ({ data, isLoading }) => {
  const { 
    summaryAndThemes = '', 
    historicalContext = '', 
    keyVerses = [], 
    reflectionQuestions = [] 
  } = data || {};
  // Defensive: Ensure arrays are always arrays
  const safeKeyVerses = Array.isArray(keyVerses) ? keyVerses : [];
  const safeReflectionQuestions = Array.isArray(reflectionQuestions) ? reflectionQuestions : [];

  // Further validation on the destructured arrays
  const validKeyVerses = Array.isArray(safeKeyVerses)
    ? safeKeyVerses.filter(item => item && typeof item === 'object' && item.verse && item.analysis)
    : [];

  const validReflectionQuestions = Array.isArray(safeReflectionQuestions)
    ? safeReflectionQuestions.filter(q => typeof q === 'string' && (q.trim() || '').length > 0)
    : [];

  return (
    <section className="mt-8 py-6 border-t-2 border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Chapter Deep Dive</h2>
      {isLoading ? (
        <SkeletonLoader />
      ) : !data ? (
        <div className="text-center py-10">
            <p className="text-gray-500">Could not load study guide. Please try again later.</p>
        </div>
      ) : (
        <div>
            {summaryAndThemes && (
              <Section title="Summary and Key Themes">
                  <p>{summaryAndThemes}</p>
              </Section>
            )}
            
            {historicalContext && (
              <Section title="Historical and Cultural Context">
                  <p>{historicalContext}</p>
              </Section>
            )}

            {Array.isArray(validKeyVerses) && validKeyVerses.length > 0 && (
              <Section title="Key Verses & Analysis">
                  {validKeyVerses.map((item, index) => (
                      <div key={index} className="py-2">
                          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600">
                             "{item.verse}"
                          </blockquote>
                          <p className="mt-2">{item.analysis}</p>
                      </div>
                  ))}
              </Section>
            )}

            {Array.isArray(validReflectionQuestions) && validReflectionQuestions.length > 0 && (
              <Section title="Reflection Questions">
                  <ul className="list-disc list-outside pl-5 space-y-2">
                      {validReflectionQuestions.map((q, index) => (
                      <li key={index}>{q}</li>
                  ))}
                  </ul>
              </Section>
            )}
        </div>
      )}
    </section>
  );
};

export default DeepDive;
