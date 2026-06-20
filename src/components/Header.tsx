import React, { FC, useState, useEffect, useRef } from 'react';
import { Client, Case, Event } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clients: Client[];
  cases: Case[];
  events: Event[];
  setCurrentPage: (page: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  toggleSidebar: () => void;
}

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return <>{text}</>;
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="font-extrabold text-indigo-750 bg-indigo-50 px-0.5 rounded-sm">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const Header: FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  clients,
  cases,
  events,
  setCurrentPage,
  isDarkMode,
  setIsDarkMode,
  toggleSidebar,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isQueryEmpty = searchQuery.trim() === '';
  
  const matchedClients = isQueryEmpty
    ? []
    : clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.contact.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const matchedCases = isQueryEmpty
    ? []
    : cases.filter(
        (c) =>
          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.client.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const matchedEvents = isQueryEmpty
    ? []
    : events.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.lieu.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const hasResults =
    matchedClients.length > 0 || matchedCases.length > 0 || matchedEvents.length > 0;

  const handleResultClick = (targetPage: string, filterValue: string) => {
    setSearchQuery(filterValue);
    setCurrentPage(targetPage);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <header className="bg-white dark:bg-[#0c111d] border-b border-gray-100 dark:border-slate-800/60 h-16 px-4 md:px-8 flex items-center justify-between shadow-sm relative z-50 transition-colors duration-200">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="md:hidden p-2 mr-2 text-gray-500">
          <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' /></svg>
        </button>
        <div ref={containerRef} className="w-full max-w-xl relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="block w-full pl-10 pr-24 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50/50 hover:bg-gray-50 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 focus:bg-white dark:focus:bg-[#090d16] focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400"
              placeholder="Rechercher... (⌘K)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
                ⌘K
              </kbd>
            </div>
          </div>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[85vh] flex flex-col z-50 animate-fade-in">
              {isQueryEmpty ? (
                <div className="p-5 text-center text-sm text-gray-400 bg-gray-50/40">
                  <p className="font-semibold text-gray-500 mb-1">Recherche globale</p>
                  <p className="text-xs">Recherchez dans toute l'application.</p>
                </div>
              ) : !hasResults ? (
                <div className="p-8 text-center text-sm text-gray-500 bg-gray-50/40">
                  <p className="font-medium">Aucun résultat pour "{searchQuery}"</p>
                </div>
              ) : (
                <div className="overflow-y-auto divide-y divide-gray-100 custom-scrollbar max-h-96">
                  {matchedClients.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-2xs font-bold uppercase tracking-widest text-[#15447c] mb-2">Clients</h3>
                      {matchedClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleResultClick('Clients', client.name)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/50 transition duration-150">
                          <div className="text-sm font-semibold text-gray-800">{highlightText(client.name, searchQuery)}</div>
                          <div className="text-xs text-gray-400">{highlightText(client.contact, searchQuery)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedCases.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-2xs font-bold uppercase tracking-widest text-[#15447c] mb-2">Dossiers</h3>
                      {matchedCases.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleResultClick('Dossiers', c.id)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/50 transition duration-150">
                          <div>{highlightText(c.name, searchQuery)} ({highlightText(c.id, searchQuery)})</div>
                          <div className="text-xs text-gray-500">{highlightText(c.client, searchQuery)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedEvents.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-2xs font-bold uppercase tracking-widest text-[#15447c] mb-2">Événements</h3>
                      {matchedEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleResultClick('Evenements', event.name)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/50 transition duration-150">
                          <div>{highlightText(event.name, searchQuery)}</div>
                          <div className="text-xs text-gray-500">{event.date} - {highlightText(event.lieu, searchQuery)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-5">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-150 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center-center"
          title={isDarkMode ? "Mode clair" : "Mode sombre"}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-[18px] h-[18px] text-amber-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.978 4.978l1.591 1.591m10.862 10.862l1.591 1.591M21 12h-2.25m-13.5 0H3m2.285-7.022l1.591 1.591M16.409 16.409h4.25m-18 0H4.978M12 5.25a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-[18px] h-[18px] text-slate-800 dark:text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-gray-800 dark:text-slate-100">J-L Tshisekedi</span>
            <span className="text-3xs font-black tracking-widest text-[#15447c] dark:text-indigo-400 uppercase">Avocat Associé</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#15447c] to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-md border border-indigo-100 dark:border-indigo-950/60 relative">
            JT
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
