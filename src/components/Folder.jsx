import { IoChevronDownSharp } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { Alert, ContextMenu, InputField, Button } from "./form.jsx";
import supabase from '../supabaseClient.jsx';

const checkValidName = (name) => /^[a-zA-Z0-9_\-\.\s]+$/.test(name.trim());

const FileAction = ({ menuRef, label, onSubmit, onClose, example }) => {
    const [name, setName] = useState('');
    const [focused, setFocused] = useState(true);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        const err = await onSubmit(name);
        if (err) setError(err);
    }

    return (
        <Alert menuRef={menuRef} 
            events={["mousedown", "keydown"]}
            conditionals={[(mouseDown) => !menuRef.current.contains(mouseDown.target), (keyDown) => keyDown.key === 'Enter']}
            actions={[onClose, handleSubmit]}
        >
            <div className="flex flex-col justify-center items-center text-(--color-hover)">
                <InputField id={label} label={label} type="text" value={name} setter={setName} error={error} onFocus={() => {setFocused(true); setError('')}} onBlur={() => setFocused(false)} isFocused={focused} example={example}/>
                <div className="text-[var(--color-text)] text-sm ml-auto">Click enter to submit, click outside the box to close this window!</div>
            </div>
        </Alert>
    )
}

const NewNote = ({currDir, updateTree, onClose, onFileCreate}) => { 
    const menuRef = useRef(null);
    const onSubmit = async (name) => {
        if (checkValidName(name)) {
            const path = currDir + `/${name}.md`;
            if (!(await window.fileApi.checkExists(path))) {
                await window.fileApi.createFile(path);
                onFileCreate(path);
                updateTree();
                onClose();
                return '';
            } else {
                return "File Already Exist!"
            }
        } else {
            return "Invalid Name!"
        }
    }

    return (
        <FileAction menuRef={menuRef} label="Create New Note" onSubmit={onSubmit} onClose={onClose} example="Untitled"/>
    )
}

const NewFolder = ({currDir, updateTree, onClose}) => {
    const menuRef = useRef(null);
    const onSubmit = async (name) => {
        if (checkValidName(name)) {
            const path = currDir + `/${name}/`;
            if (!(await window.fileApi.checkExists(path))) {
                await window.fileApi.createFolder(path);
                updateTree();
                onClose();
                return '';
            } else {
                return "File Already Exist!"
            }
        } else {
            return "Invalid Name!"
        }
    }

    return (
        <FileAction menuRef={menuRef} label="Create New Folder" onSubmit={onSubmit} onClose={onClose} example="Untitled"/>
    )
}

const DeletePath = ({path, onClose, updateTree, onFileDestroy}) => { 
    const menuRef = useRef(null);
    const handleSubmit = async () => {
        await window.fileApi.deleteFile(path);
        if (path === localStorage.getItem('rootFolder')) {
            await window.fileApi.initDefault();
        }
        updateTree();
        onFileDestroy();
        onClose();
    }

    return (
        <Alert menuRef={menuRef} events={["mousedown", "keydown"]} conditionals = {[(e) => !menuRef.current.contains(e.target), (e) => e.key === 'Enter']} actions={[onClose, handleSubmit]}>
            <div className="flex flex-col justify-center items-center text-(--color-hover)">
                <div className="text-[var(--color-text)] text-md">Once this is done, it cannot be undone!</div>
                <div className="text-[var(--color-text)] text-md">Are you sure to delete <em>{path.substring(path.lastIndexOf('/')+1)}</em>?</div>
                <div className="text-[var(--color-text)] text-sm mb-1">(If you aren't just click outside this box! If you are, just click Enter!)</div>
                <div className="flex justify-center gap-4">
                    <Button text="Cancel" onClick={onClose} />
                    <Button text="Confirm" onClick={handleSubmit} className="bg-(--color-danger) hover:bg-(--color-dangerHover)"/>
                </div>
            </div>
        </Alert>
    )
}

const RenameFolder = ({currDir, updateTree, onClose, onFolderRename}) => { 
    const menuRef = useRef(null);
    const onSubmit = async (name) => {
        if (checkValidName(name)) {
            const dir = currDir.substring(0, currDir.lastIndexOf('\\'));
            const newPath = `${dir}/${name}/`
            if (!(await window.fileApi.checkExists(newPath))) {
                await window.fileApi.rename(currDir, newPath);
                updateTree();
                onFolderRename(currDir, newPath);
                onClose();
                return '';
            } else {
                return "File Already Exist!"
            }
        } else {
            return "Invalid Name!"
        }
    }

    return (
        <FileAction menuRef={menuRef} label="Rename Folder" onSubmit={onSubmit} onClose={onClose} example="Untitled"/>
    )
}

const RenameFile = ({currDir, updateTree, onClose, onFileRename}) => { 
    const menuRef = useRef(null);
    const onSubmit = async (name) => {
        if (checkValidName(name)) {
            const dir = currDir.substring(0, currDir.lastIndexOf('\\'));
            const newPath = `${dir}/${name}.md`
            if (!(await window.fileApi.checkExists(newPath))) {
                await window.fileApi.rename(currDir, newPath);
                onFileRename(currDir, newPath);
                updateTree();
                onClose();
                return '';
            } else {
                return "File Already Exist!"
            }
        } else {
            return "Invalid Name!"
        }
    }

    return (
        <FileAction menuRef={menuRef} label="Rename File" onSubmit={onSubmit} onClose={onClose} example="Untitled"/>
    )
}

const copyFolder = async (path, updateTree) => { 
    console.log(`Path: ${path}`);
    if (path === localStorage.getItem('rootFolder')) {
        return;
    } else {
        const dir = path.substring(0, path.lastIndexOf('\\'));
        const name = await window.fileApi.getName(path);
        let newPath;
        if (await window.fileApi.checkExists(`${dir}/${name}_copy/`)) {
            let i = 1;
            while (await window.fileApi.checkExists(`${dir}/${name}_copy${i}/`)) {
                i++;
            }
            newPath = `${dir}/${name}_copy${i}/`;
        } else {
            newPath = `${dir}/${name}_copy/`;
        }
        console.log(`New Path: ${newPath}`);
        await window.fileApi.createFolder(newPath)
        await window.fileApi.copy(path, newPath);
        updateTree();
    }
}

const copyFile = async (path, updateTree) => { 
    const dir = path.substring(0, path.lastIndexOf('\\'));
    const name = (await window.fileApi.getName(path)).replace('.md', '');
    let newPath;
    if (await window.fileApi.checkExists(`${dir}/${name}_copy.md`)) {
        let i = 1;
        while (await window.fileApi.checkExists(`${dir}/${name}_copy${i}.md`)) {
            i++;
        }
        newPath = `${dir}/${name}_copy${i}.md`;
    } else {
        newPath = `${dir}/${name}_copy.md`;
    }
    await window.fileApi.copy(path, newPath);
    updateTree();
}

const uploadFileToCloud = async (path) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const fileName = await window.fileApi.getName(path);
        const content = await window.fileApi.readFile(path);

        const { error } = await supabase
            .from('cloud_notes')
            .upsert({
                user_id: user.id,
                file_name: fileName,
                content: content,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,file_name' });

        if (error) {
            console.error('Upload failed:', error);
        } else {
            setCloudVersion(v => v + 1);
        }
    } catch (e) {
        console.error('Failed to upload to cloud:', e);
    }
}

const Folder = ({ TreeNode, activeTab, setActiveTab, openTabs, setOpenTabs, indents, setTreeVersion, dragItem, setDragItem, setCloudVersion }) => {
    const [expand, setExpand] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [alertState, setAlertState] = useState('');
    const dragCounter = useRef(0);
    const [dragOver, setDragOver] = useState(false);

    const fileCreateHelper = (path, screen, activeScreenId) => {
        if (screen.screenId === activeScreenId) {
            return { ...screen, path: path }
        }
        if (screen.displayType === "file") {
            return screen;
        }
        if (screen.displays) {
            return { ...screen, displays: screen.displays.map(d => fileCreateHelper(path, d, activeScreenId)) };
        }
        return screen;
    }

    const checkPathIsOpen = (path, screen) => {
        if (screen.displayType === "file") {
            if (screen.path === path) {
                return true;
            }
            return false;
        }
        return screen.displays.reduce((tot, curr) => tot || checkPathIsOpen(path, curr), false);
    }

    const screenIdWithPath = (path, screen) => {
        if (screen.displayType === "file") {
            if (screen.path === path) {
                return screen.screenId;
            }
            return '';
        }
        return screen.displays.reduce((tot, curr) => screenIdWithPath(path, curr) ? screenIdWithPath(path, curr) : tot, '');
    }

    const fileCreate = (path) => {
        const tabWithPath = openTabs.filter(s => checkPathIsOpen(path, s.screens));
        if (tabWithPath.length === 0) {
            const tabToChange = openTabs[openTabs.findIndex(tab => tab.tabId === activeTab)];
            let modified = fileCreateHelper(path, tabToChange.screens, tabToChange.activeScreen);
            setOpenTabs(prev => prev.map(tab => tab.tabId === activeTab ? { ...tab, screens: modified } : tab));
        } else {
            setOpenTabs(prev => prev.map(tab => tab.tabId === tabWithPath[0].tabId ? { ...tab, activeScreen: screenIdWithPath(path, tabWithPath[0].screens)} : tab));
            setActiveTab(tabWithPath[0].tabId);
        }
    }

    const fileDestroyHelper = async (screen) => {
        if (screen.displayType === "file") {
            if (!screen.path) return screen;
            const exists = await window.fileApi.checkExists(screen.path);
            return exists ? screen : { ...screen, path: null };
        }
        if (screen.displays) {
            const updatedDisplays = await Promise.all(
                screen.displays.map(async d => await fileDestroyHelper(d))
            );
            return { ...screen, displays: updatedDisplays }
        }
        return screen;
    }

    const fileDestroy = async () => {
        const newTabs = await Promise.all(openTabs.map(async tab => ({ ...tab, screens: await fileDestroyHelper(tab.screens) })))
        setOpenTabs(newTabs);
    }

    const fileRenameHelp = (screen, oldPath, newPath) => {
        if (screen.displayType === 'file') {
            return screen.path === oldPath ? { ...screen, path: newPath } : screen;
        }
        if (screen.displays) {
            return { ...screen, displays: screen.displays.map(d => fileRenameHelp(d, oldPath, newPath)) };
        }
        return screen;
    }

    const fileRename = (oldPath, newPath) => {
        setOpenTabs(tabs => tabs.map(tab => {
            return { ...tab, screens: fileRenameHelp(tab.screens, oldPath, newPath) }
        }));
    }

    const folderRenameHelp = (screen, oldPath, newPath) => {
        if (screen.displayType === 'file') {
            return screen.path && screen.path.startsWith(oldPath) ? { ...screen, path: screen.path.replace(oldPath, newPath) } : screen;
        }
        if (screen.displays) {
            return { ...screen, displays: screen.displays.map(d => folderRenameHelp(d, oldPath, newPath)) };
        }
        return screen;
    }

    const folderRename = (oldPath, newPath) => {
        setOpenTabs(tabs => tabs.map(tab => {
            return { ...tab, screens: folderRenameHelp(tab.screens, oldPath, newPath) }
        }));
    }
    
    if (TreeNode.isFolder) {
        return (
            <div draggable
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragStart={(e) => {
                    e.stopPropagation();
                    setDragItem(TreeNode.path);
                    e.dataTransfer.setData("path", TreeNode.path);
                }}
                onDragEnter={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    dragCounter.current++;
                    setDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    dragCounter.current--
                    if (dragCounter.current === 0) setDragOver(false);
                }}
                onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    const src = e.dataTransfer.getData("path");
                    const dest = TreeNode.path;
                    if (dest !== src && !dest.startsWith(src)) {
                        window.fileApi.rename(src, `${dest}/${src.substring(src.lastIndexOf('\\')+1)}`);
                        setTreeVersion(v => v+1);
                    }
                    dragCounter.current = 0;
                    setDragOver(false);
                }}
                onDragEnd={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setDragItem('');
                }}
                >
                <div id={TreeNode.path} style={{ paddingLeft: `${indents}px`}} onClick={() => setExpand(!expand)} className={`flex items-center text-ellipsis overflow-hidden pr-2 cursor-pointer ${dragItem === TreeNode.path ? "bg-(--color-accentHover)" : dragOver && dragItem !== TreeNode.path ? "bg-(--color-accent)" : "hover:bg-(--color-secondary)"}`}>
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
                        return <Folder key={item.path} TreeNode={item} activeTab={activeTab} setActiveTab={setActiveTab} openTabs={openTabs} setOpenTabs={setOpenTabs} indents={indents + 10} setTreeVersion={setTreeVersion} dragItem={dragItem} setDragItem={setDragItem} setCloudVersion={setCloudVersion} />
                    })}
                </div>
            {contextMenu.visible && (<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => {setContextMenu({ visible: false, x: 0, y: 0 })}} items={
                [
                    {id: 1, name: "Create New Note", onClick: (() => setAlertState("Create New Note"))},
                    {id: 2, name: "Create New Folder", onClick: (() => setAlertState("Create New Folder"))},
                    {id: 3, name: "Delete Folder", onClick: (() => setAlertState("Delete Folder"))},
                    {id: 4, name: "Rename Folder", onClick: (() => setAlertState("Rename Folder"))},
                    {id: 5, name: "Make a Copy", onClick: (() => copyFolder(TreeNode.path, () => setTreeVersion(v => v+1)))},
                ]
            }/>)}
            { alertState === "Create New Note" && <NewNote 
                    currDir={TreeNode.path} updateTree={() => setTreeVersion(v => v+1)} onClose={() => setAlertState('')} 
                    onFileCreate={(path) => {fileCreate(path)}}
                /> 
            }
            { alertState === "Create New Folder" && <NewFolder currDir={TreeNode.path} updateTree={() => setTreeVersion(v => v+1)} onClose={() => setAlertState('')}/>}
            { alertState === "Delete Folder" && <DeletePath 
                path={TreeNode.path} onClose={() => setAlertState('')} updateTree={() => setTreeVersion(v => v+1)} 
                onFileDestroy={fileDestroy}/>
            }
            { alertState === "Rename Folder" && <RenameFolder currDir={TreeNode.path} updateTree={() => setTreeVersion(v => v+1)} onClose={() => setAlertState('')} onFolderRename={(oldPath, newPath) => folderRename(oldPath, newPath)}/>}
            </div>
        );
    } else {
        return (
            <div draggable 
                onDragStart={(e) => {
                    e.stopPropagation();
                    setDragItem(TreeNode.path);
                    e.dataTransfer.setData("path", TreeNode.path);
                }}
                onDragEnd={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setDragItem('');
                }}
                style={{ paddingLeft: `${indents}px`}} className={`w-full cursor-pointer text-ellipsis overflow-hidden pr-2 ${dragItem === TreeNode.path ? 'bg-(--color-accentHover)' : activeTab?.path === TreeNode.path ? 'bg-[var(--color-tertiary)]' : 'hover:bg-(--color-secondary)'}`} onClick={() => fileCreate(TreeNode.path)} 
                onContextMenu={
                    (e) => {
                        e.preventDefault();
                        setContextMenu({visible: true, x:e.clientX, y: e.clientY});
                    }
                }>
                <span className="w-full">{TreeNode.name}</span>
                {contextMenu.visible && (<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => {setContextMenu({ visible: false, x: 0, y: 0})}} items={
                    [
                        {id: 1, name: "Delete Note", onClick: (() => setAlertState("Delete File"))},
                        {id: 2, name: "Rename Note", onClick: (() => setAlertState("Rename File"))},
                        {id: 3, name: "Make a Copy", onClick: (() => copyFile(TreeNode.path, () => setTreeVersion(v => v+1)))},
                        {id: 4, name: "Upload to Cloud", onClick: (() => uploadFileToCloud(TreeNode.path))},
                    ]
                }/>)}
                { alertState === "Delete File" && <DeletePath 
                    path={TreeNode.path} onClose={() => setAlertState('')} updateTree={() => setTreeVersion(v => v+1)} 
                    onFileDestroy={fileDestroy}/>
                }
                { alertState === "Rename File" && <RenameFile 
                    currDir={TreeNode.path} updateTree={() => setTreeVersion(v => v+1)} onClose={() => setAlertState('')} 
                    onFileRename={(oldPath, newPath) => {fileRename(oldPath, newPath)}}/>
                }
            </div>
        );
    }
}

export default Folder;
