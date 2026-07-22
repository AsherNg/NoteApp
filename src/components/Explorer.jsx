import Folder from './Folder'
import { useState, useEffect } from "react";

const Explorer = ({ open, treeVersion, activeTab, setActiveTab, openTabs, setOpenTabs, setTreeVersion, stateTracker }) => {
    const [data, setData] = useState(null);
    const [dragItem, setDragItem] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const result = await window.fileApi.readFolder(localStorage.getItem('rootFolder'));
            setData(result);
        } 
        fetchData();
    }, [treeVersion]);

    return (
        <div className={`h-screen w-[15%] border-r-1 border-(--color-border) bg-(--color-primary) text-(--color-text) overflow-hidden whitespace-nowrap ${ open ? "block" : "hidden"}`}>
            <nav className="flex flex-col">
                <div className="p-2">
                    <span className=""> Local Files </span>
                    {data ? <Folder className="ml-2" TreeNode={data} activeTab={activeTab} setActiveTab={setActiveTab} openTabs={openTabs} setOpenTabs={setOpenTabs} indents={0} setTreeVersion={setTreeVersion} dragItem={dragItem} setDragItem={setDragItem} stateTracker={stateTracker} /> : <></>}
                </div>

                <hr className='mx-2'/>

                <div className='p-2'>
                    <span>Shared Files</span>
                </div>
            </nav>
        </div>
    );
}

export default Explorer;
