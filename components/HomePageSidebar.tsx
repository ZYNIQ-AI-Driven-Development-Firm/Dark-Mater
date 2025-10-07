import React from 'react';
import OllamaStatusIndicator from './OllamaStatusIndicator';

const HomePageSidebar = () => {
  return (
    <div className="h-full bg-black p-2 border-r border-gray-800">
      <ul className="flex h-full flex-col items-center justify-center gap-2">
        {/* Ollama Status */}
        <li className="w-full px-2 py-1">
          <OllamaStatusIndicator />
        </li>
        {/* Notifications Item */}
        <li className="group w-12 overflow-hidden rounded-lg border-l-2 border-transparent bg-gray-900 shadow-md shadow-black/20 transition-all duration-300 hover:w-56 hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 has-[:focus]:w-56 has-[:focus]:border-[#63bb33] has-[:focus]:shadow-lg has-[:focus]:shadow-[#63bb33]/20">
          <button className="peer flex w-full cursor-pointer items-center gap-2 p-2 text-left text-gray-300 transition-all active:scale-95">
            <div className="rounded-lg bg-gray-800 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-[#63bb33]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            <div className="font-semibold text-gray-200 text-sm">Notifications</div>
          </button>
          <div className="grid grid-rows-[0fr] overflow-hidden transition-all duration-300 peer-focus:grid-rows-[1fr]">
            <div className="overflow-hidden p-3 pt-0">
              <ul className="divide-y divide-gray-700">
                <li className="py-2">
                  <div className="flex items-center justify-between">
                    <button className="cursor-pointer font-semibold text-gray-300 hover:text-[#63bb33] text-xs">
                      Email
                    </button>
                    <div className="text-xs text-gray-500">2m ago</div>
                  </div>
                </li>
                <li className="py-2">
                  <div className="flex items-center justify-between">
                    <button className="cursor-pointer font-semibold text-gray-300 hover:text-[#63bb33] text-xs">
                      Request
                    </button>
                    <div className="text-xs text-gray-500">14m ago</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </li>
        {/* Settings Item */}
        <li className="group w-12 overflow-hidden rounded-lg border-l-2 border-transparent bg-gray-900 shadow-md shadow-black/20 transition-all duration-300 hover:w-56 hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 has-[:focus]:w-56 has-[:focus]:border-[#63bb33] has-[:focus]:shadow-lg has-[:focus]:shadow-[#63bb33]/20">
          <button className="peer flex w-full cursor-pointer items-center gap-2 p-2 text-left text-gray-300 transition-all active:scale-95">
            <div className="rounded-lg bg-gray-800 p-1">
              <svg className="size-5 text-[#63bb33]" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>
            <div className="font-semibold text-gray-200 text-sm">Settings</div>
          </button>
          <div className="grid grid-rows-[0fr] overflow-hidden transition-all duration-300 peer-focus:grid-rows-[1fr]">
            <div className="overflow-hidden">
               <ul className="divide-y divide-gray-700 p-3 pt-0">
                <li className="py-2">
                  <div className="flex items-center justify-between">
                    <button className="peer cursor-pointer font-semibold text-gray-300 hover:text-[#63bb33] text-xs">
                      System Preferences
                    </button>
                  </div>
                </li>
                <li className="py-2">
                  <div className="group/title flex items-center justify-between">
                    <button className="peer cursor-pointer font-semibold text-gray-300 hover:text-[#63bb33] text-xs">
                      Theme
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}

export default HomePageSidebar;