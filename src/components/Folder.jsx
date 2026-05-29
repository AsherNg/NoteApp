import { IoChevronDownSharp } from "react-icons/io5";
import { useState } from "react";

const Folder = ({ TreeNode }) => {
    const [expand, setExpand] = useState(false);

    if (window.fileApi.isFolder(TreeNode)) {
        return (
            <div>
                <div onClick={() => setExpand(!expand)} className="flex items-center cursor-pointer">
                    <IoChevronDownSharp size={12} className={`transition-transform mr-1 mt-1 ${expand ? "rotate-0" : "rotate-180"} `}/>
                    <span>{window.fileApi.getName(TreeNode)}</span>
                </div>

                <div className={ expand ? "pl-3" : "hidden"}>
                    {window.fileApi.listFiles(TreeNode).map((file) => {
                        return <Folder TreeNode={file.path} key={file.id}/>
                    })}
                </div>
            </div>
        );
    } else {
        return (
            <div className="">
                <span>{window.fileApi.getName(TreeNode)}</span>
            </div>
        );
    }
}

export default Folder;
