import { IoChevronDownSharp } from "react-icons/io5";
import { useState } from "react";

const Folder = ({ TreeNode }) => {
    const [expand, setExpand] = useState(false);

    if (TreeNode.isFolder) {
        return (
            <div>
                <div onClick={() => setExpand(!expand)} className="flex items-center cursor-pointer">
                    <IoChevronDownSharp size={12} className={`transition-transform mr-1 mt-1 ${expand ? "rotate-0" : "rotate-180"} `}/>
                    <span>{TreeNode.name}</span>
                </div>

                <div className={ expand ? "pl-3" : "hidden"}>
                    {TreeNode.items.map((item) => {
                        return <Folder TreeNode={item} />
                    })}
                </div>
            </div>
        );
    } else {
        return (
            <div className="">
                <span>{TreeNode.name}</span>
            </div>
        );
    }
}

export default Folder;
