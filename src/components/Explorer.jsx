import FolderData from '../data/FolderData'
import Folder from './Folder'
import { useState, useEffect } from "react";

const Explorer = ({ open }) => {
    const [data, setData] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            const result = await window.fileApi.readFolder("C:/Users/asher/Documents/Projects/NoteApp/src/components")
            setData(result)
        } 
        fetchData()
    }, [])

    return (
        <div className={`h-screen w-100 bg-(--color-primary) text-(--color-text) ${ open ? "block" : "hidden"}`}>
            <nav className="flex flex-col">
                <div className="p-2">
                    <span className=""> Local Files </span>
                    {data ? <Folder className="ml-2" TreeNode={data}/> : <></>}
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
