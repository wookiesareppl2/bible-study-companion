import React, { useMemo, useState } from 'react';
import { 
  ChapterIdentifier, 
  EnrichmentType, 
  AllEnrichmentData,
  CrossReference,
  WordStudy,
  HistoricalContext,
  LiteraryAnalysis,
  Interpretation
} from '../types.ts';
import ChatPanel from './ChatPanel.tsx';
import { 
    BookOpenIcon, 
    ChatAlt2Icon, 
    XIcon, 
    ChevronDoubleRightIcon, 
    ChevronDoubleLeftIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from './Icons.tsx';

// --- Inlined component from EnrichmentModule.tsx for maximum robustness ---
interface EnrichmentModuleProps {
  type: EnrichmentType;
  data: any;
}

const EnrichmentModule: React.FC<EnrichmentModuleProps> = ({ type, data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);

  const renderContent = () => {
    switch (type) {
      case EnrichmentType.CrossReferences:
      case EnrichmentType.WordStudies:
      case EnrichmentType.Interpretations: {
        // This block handles any data that is expected to be an array of objects.
        if (!Array.isArray(data)) {
          return <p className="text-sm text-gray-500">No data available.</p>;
        }
        const validItems = data.filter(item => item && typeof item === 'object');
        if (validItems.length === 0) {
          return <p className="text-sm text-gray-500">No specific data available for this chapter.</p>;
        }

        return validItems.map((item, index) => {
          if (type === EnrichmentType.CrossReferences) {
            const { reference = 'N/A', verse = 'N/A', explanation = '' } = item as CrossReference;
            return (
              <div key={index} className="py-2 border-b border-gray-100 last:border-b-0">
                <p className="font-semibold text-gray-700">{reference} (v. {verse})</p>
                <p className="text-gray-600 text-sm">{explanation}</p>
              </div>
            );
          }
          if (type === EnrichmentType.WordStudies) {
            const { originalWord = 'N/A', transliteration = 'N/A', verse = 'N/A', meaning = '', contextualUse = '' } = item as WordStudy;
            return (
              <div key={index} className="py-2 border-b border-gray-100 last:border-b-0">
                <p className="font-semibold text-gray-700">{originalWord} ({transliteration}) (v. {verse})</p>
                <p className="text-gray-600 text-sm"><span className="font-medium">Meaning:</span> {meaning}</p>
                <p className="text-gray-600 text-sm"><span className="font-medium">Use:</span> {contextualUse}</p>
              </div>
            );
          }
          if (type === EnrichmentType.Interpretations) {
            const { viewpoint = 'N/A', verse = 'N/A', summary = '' } = item as Interpretation;
            return (
              <div key={index} className="py-2 border-b border-gray-100 last:border-b-0">
                  <p className="font-semibold text-gray-700">{viewpoint} (v. {verse})</p>
                  <p className="text-gray-600 text-sm">{summary}</p>
              </div>
            );
          }
          return null;
        });
      }
      
      case EnrichmentType.HistoricalContext: {
        // Defensively destructure the object, providing defaults for every property.
        const { geography = '', customs = '', politicalClimate = '' } = (data || {}) as HistoricalContext;
        if (!geography.trim() && !customs.trim() && !politicalClimate.trim()) {
           return <p className="text-sm text-gray-500">No specific data available for this chapter.</p>;
        }
        return (
           <>
               {geography.trim() && (<>
                 <h4 className="font-semibold text-gray-700">Geography</h4>
                 <p className="text-gray-600 text-sm mb-2">{geography}</p>
               </>)}
               {customs.trim() && (<>
                 <h4 className="font-semibold text-gray-700">Customs</h4>
                 <p className="text-gray-600 text-sm mb-2">{customs}</p>
               </>)}
               {politicalClimate.trim() && (<>
                 <h4 className="font-semibold text-gray-700">Political Climate</h4>
                 <p className="text-gray-600 text-sm">{politicalClimate}</p>
               </>)}
           </>
        );
      }

       case EnrichmentType.LiteraryAnalysis: {
         // Defensively destructure, ensuring `themes` is always an array.
         const { structure = '', themes = [] } = (data || {}) as LiteraryAnalysis;
         const validThemes = (Array.isArray(themes) ? themes : []).filter(t => typeof t === 'string' && t.trim());
         
         if (!structure.trim() && validThemes.length === 0) {
            return <p className="text-sm text-gray-500">No specific data available for this chapter.</p>;
         }
         return (
            <>
                {structure.trim() && (<>
                  <h4 className="font-semibold text-gray-700">Structure</h4>
                  <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">{structure}</p>
                </>)}
                
                {validThemes.length > 0 && (<>
                  <h4 className="font-semibold text-gray-700">Themes</h4>
                  <ul className="list-disc list-inside text-gray-600 text-sm">
                      {validThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                  </ul>
                </>)}
            </>
         );
       }
      default:
        return <p className="text-sm text-gray-500">No data available.</p>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        <span>{type}</span>
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-white space-y-2">
          {renderContent()}
        </div>
      )}
    </div>
  );
};


// --- Original EnrichmentPanel Component ---
interface EnrichmentPanelProps {
  chapterIdentifier: ChapterIdentifier | null;
  isMobileOpen: boolean;
  closePanel: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  enrichmentData: AllEnrichmentData | null;
}

const EnrichmentPanel: React.FC<EnrichmentPanelProps> = ({ 
  chapterIdentifier, 
  isMobileOpen, 
  closePanel, 
  isCollapsed,
  toggleCollapse,
  enrichmentData,
}) => {
  const [activeTab, setActiveTab] = React.useState<'enrich' | 'chat'>('enrich');

  // This `dataMap` is now extremely robust. It guarantees a safe, fully-formed
  // object is passed to the EnrichmentModule, even if `enrichmentData` is null
  // or has missing properties.
  const dataMap = useMemo(() => {
    const {
      crossReferences = [],
      wordStudies = [],
      interpretations = [],
      historicalContext = { geography: '', customs: '', politicalClimate: '' },
      literaryAnalysis = { structure: '', themes: [] },
    } = enrichmentData || {}; // The `|| {}` handles the null case.

    return {
      [EnrichmentType.CrossReferences]: crossReferences,
      [EnrichmentType.WordStudies]: wordStudies,
      [EnrichmentType.HistoricalContext]: historicalContext,
      [EnrichmentType.LiteraryAnalysis]: literaryAnalysis,
      [EnrichmentType.Interpretations]: interpretations,
    };
  }, [enrichmentData]);
  
  const enrichmentTypes = useMemo(() => Object.keys(dataMap) as EnrichmentType[], [dataMap]);

  if (!chapterIdentifier) return null;

  const TabButton = ({ isActive, onClick, icon, text }: {isActive: boolean, onClick:() => void, icon: React.ReactNode, text: string}) => (
    <button
        onClick={onClick}
        className={`flex-1 p-4 flex items-center justify-center text-sm font-semibold transition-colors ${
        isActive ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-200'
        }`}
    >
        {icon}
        {!isCollapsed && <span className="ml-2">{text}</span>}
    </button>
  );

  return (
    <aside className={`bg-gray-100 border-l border-gray-200 flex flex-col h-full z-40
        transition-all duration-300
        lg:relative lg:flex
        ${isCollapsed ? 'lg:w-20' : 'lg:w-96'}
        fixed inset-y-0 right-0 w-96
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
    `}>
        <div className="flex items-center justify-between p-2 border-b border-gray-200 lg:hidden">
            <span className="font-semibold ml-2">Tools</span>
            <button onClick={closePanel} className="p-2 text-gray-500 hover:text-gray-800 rounded-full">
                <XIcon />
            </button>
        </div>
      <div className="flex border-b border-gray-200">
        <TabButton 
            isActive={activeTab === 'enrich'}
            onClick={() => setActiveTab('enrich')}
            icon={<BookOpenIcon className="h-5 w-5"/>}
            text="Enrichments"
        />
        <TabButton 
            isActive={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            icon={<ChatAlt2Icon className="h-5 w-5"/>}
            text="Ask a Question"
        />
      </div>

      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'hidden' : 'block'}`}>
        {activeTab === 'enrich' ? (
          <div className="p-4 space-y-3">
            {enrichmentData === null ? (
               <div className="p-4 text-center text-sm text-gray-500">Loading enrichments...</div>
            ) : (
                enrichmentTypes.map((type) => (
                <EnrichmentModule 
                    key={type} 
                    type={type} 
                    data={dataMap[type]}
                />
                ))
            )}
          </div>
        ) : (
          <ChatPanel chapterIdentifier={chapterIdentifier} />
        )}
      </div>

       <div className="p-2 border-t border-gray-200 hidden lg:block">
        <button onClick={toggleCollapse} className="w-full flex items-center justify-center p-3 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
            {isCollapsed ? <ChevronDoubleLeftIcon /> : <ChevronDoubleRightIcon />}
        </button>
      </div>
    </aside>
  );
};

export default EnrichmentPanel;
