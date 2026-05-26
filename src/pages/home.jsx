import Sidebar from '../components/Sidebar'
import Explorer from '../components/Explorer';
import Editor from '../components/Editor'
import Navbar from '../components/Navbar'
import { useState } from 'react';

function Home() {
    const [ openExplorer, setOpenExplorer ] = useState(false)
    const toggleExplorer = () => { setOpenExplorer(!openExplorer)}

    const [ activeTab, setActiveTab ] = useState(1)
    
    return (
        <div className="flex bg-(--color-bg) w-screen h-screen">
            <Sidebar setOpenExplorer={toggleExplorer}/>
            { openExplorer ? <Explorer/> : <></> }
            <div className='w-full h-full flex flex-col'>
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab}/>
                <Editor tabId={1} activeTab={activeTab}/>
                <Editor tabId={2} activeTab={activeTab}/>
                <Editor tabId={3} activeTab={activeTab}/>    
            </div>    
        </div>
    );
}

export default Home;