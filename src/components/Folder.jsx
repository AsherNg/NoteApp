import { IoChevronDownSharp } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { Alert, ContextMenu, InputField } from "./Form";

const checkValidName = (name) => /^[a-zA-Z0-9_\-\.]+$/.test(name);
const newNote = (path) => { console.log("Hello World!") }
const newFolder = (path) => { console.log("Hello World!") }
const deleteFolder = (path) => { console.log("Hello World!") }
const renameFolder = (path) => { console.log("Hello World!") }
const deleteFile = (path) => { console.log("Hello World!") }
const renameFile = (path) => { console.log("Hello World!") }
const copyFolder = (path) => { console.log("Hello World!") }
const moveFolder = (path) => { console.log("Hello World!") }
const copyFile = (path) => { console.log("Hello World!") }
const moveFile = (path) => { console.log("Hello World!") }

const Folder = ({ TreeNode, activeTab, setActiveTab, setOpenTabs, indents }) => {
    const [expand, setExpand] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    
    if (TreeNode.isFolder) {
        return (
            <div>
                <div id={TreeNode.path} style={{ paddingLeft: `${indents}px`}} onClick={() => setExpand(!expand)} className="flex items-center text-ellipsis overflow-hidden pr-2 cursor-pointer hover:bg-(--color-secondary)">
                    <IoChevronDownSharp size={12} className={`transition-transform mr-1 mt-1 ${expand ? "rotate-0" : "rotate-180"} `}/>
                    <span onContextMenu=
                        {(e) => {
                            e.preventDefault();
                            setContextMenu({visible: true, x: e.clientX, y: e.clientY});
                        }}
                        className="w-full">
                        {TreeNode.name}
                    </span>
                </div>

                <div className={ expand ? "" : "hidden"}>
                    {TreeNode.items.map((item) => {
                        return <Folder key={item.path} TreeNode={item} activeTab={activeTab} setActiveTab={setActiveTab} setOpenTabs={setOpenTabs} indents={indents + 10} />
                    })}
                </div>
            {contextMenu.visible && (<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => {setContextMenu({ visible: false, x: 0, y: 0 })}} items={
                [
                    {id: 1, name: "Create New Note", onClick: (() => newNote(TreeNode.path))},
                    {id: 2, name: "Create New Folder", onClick: (() => newFolder(TreeNode.path))},
                    {id: 3, name: "Delete Folder", onClick: (() => deleteFolder(TreeNode.path))},
                    {id: 4, name: "Rename Folder", onClick: (() => renameFolder(TreeNode.path))},
                    {id: 5, name: "Make a Copy", onClick: (() => copyFolder(TreeNode.path))},
                    {id: 6, name: "Move Folder", onClick: (() => moveFolder(TreeNode.path))}
                ]
            }/>)}
            </div>
        );
    } else {
        return (
            <div style={{ paddingLeft: `${indents}px`}} className={`w-full cursor-pointer text-ellipsis overflow-hidden pr-2 ${activeTab?.path === TreeNode.path ? 'bg-[var(--color-tertiary)]' : 'hover:bg-(--color-secondary)'}`} onClick={() => {
                    setActiveTab(prev => ({...prev, path: TreeNode.path}))
                    setOpenTabs(prev => prev.map(tab => tab.id === activeTab.id
                            ? {...tab, path: TreeNode.path}
                            : tab
                    ))
                }
            } onContextMenu={
                    (e) => {
                        e.preventDefault();
                        setContextMenu({visible: true, x:e.clientX, y:e.clientY})
                    }
                }>
                <span className="w-full">{TreeNode.name}</span>
                {contextMenu.visible && (<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => {setContextMenu({ visible: false, x: 0, y: 0})}} items={
                    [
                        {id: 1, name: "Delete Note", onClick: (() => deleteFile(TreeNode.path))},
                        {id: 2, name: "Rename Note", onClick: (() => renameFile(TreeNode.path))},
                        {id: 3, name: "Make a Copy", onClick: (() => copyFile(TreeNode.path))},
                        {id: 4, name: "Move File", onClick: (() => moveFile(TreeNode.path))}
                    ]
                }/>)}
            </div>
        );
    }
}

export default Folder;
