import FolderData from '../data/FolderData'
import Folder from './Folder'
import { useState } from "react";

const Explorer = () => {
    const [explorerData, setExplorerData] = useState(FolderData)


    return (
        <div className="h-screen w-100 bg-(--color-primary) text-(--color-text)">
            <nav className="flex flex-col">
                <div className="p-2">
                    <span className=""> Local Files </span>
                    <Folder className="ml-2" TreeNode={localStorage.getItem('rootFolder')}/>
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
