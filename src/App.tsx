import { useState } from 'react';
import { Editor } from './components/Editor';
import Sidebar from './components/Sidebar'

export default function App() {
  const [content, setContent] = useState('');

  return (
    <div className="flex h-screen w-screen">
      <header className="p-0.1 bg-black">
        <Sidebar />
      </header>
      <main className="w-screen px-6 py-2 bg-[#222222]">
        <div className='text-center my-2 text-gray-400'>
          ST2131/1
        </div>
        <Editor value={content} onChange={setContent}/>
      </main>
    </div>
  );
}