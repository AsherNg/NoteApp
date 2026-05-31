import Folder from './Folder'
import { useState, useEffect } from "react";

const Explorer = ({ open, treeVersion, activeTab, setActiveTab, setOpenTabs }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const result = await window.fileApi.readFolder(localStorage.getItem('rootFolder'));
            setData(result);
        } 
        fetchData();
    }, [treeVersion]);

    return (
        <div className={`h-screen w-100 bg-(--color-primary) text-(--color-text) ${ open ? "block" : "hidden"}`}>
            <nav className="flex flex-col">
                <div className="p-2">
                    <span className=""> Local Files </span>
                    {data ? <Folder className="ml-2" TreeNode={data} activeTab={activeTab} setActiveTab={setActiveTab} setOpenTabs={setOpenTabs}/> : <></>}
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
