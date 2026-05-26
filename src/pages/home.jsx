import Sidebar from '../components/Sidebar'
import Explorer from '../components/Explorer';
import Editor from '../components/Editor'
import Navbar from '../components/Navbar'
import { useState } from 'react';

function Home() {
    const [ openExplorer, setOpenExplorer ] = useState(false)
    const toggleExplorer = () => { setOpenExplorer(!openExplorer)}
    
    return (
        <div className="flex bg-(--color-bg) w-screen h-screen">
            <Sidebar setOpenExplorer={toggleExplorer}/>
            { openExplorer ? <Explorer/> : <></> }
            <div className='w-full h-full'>
                <Navbar />
                <Editor />
            </div>    
        </div>
    );
}

export default Home;