import Sidebar from '../components/Sidebar'
import Explorer from '../components/Explorer';
import Editor from '../components/Editor'
import Navbar from '../components/Navbar'
import { useRef, useState, useEffect } from 'react';
import { InputField, Alert, Button } from '../components/form';
import Loading  from "./loading.jsx";

function NewTab({tabId, activeId, setShowNewNote}) {
    return (<div className={`w-full h-full flex justify-center items-center flex-col gap-2 ${tabId !== activeId ? 'hidden' : ''}`}>
                <Button text="Create New Note" onClick={() => setShowNewNote(true)} enabled={true} type="button" />
                <div className='text-sm text-[var(--color-text)]'>Click any of your previous files to change this tab!</div>
            </div>)
}

function NewNote({ homeDir, onClose, updateTree, onFileCreate }) {
    const nameRef = useRef('');
    const [name, setName] = useState('');
    const [focused, setFocused] = useState(false);

    const handleSetNames = (val) => {
        setName(val);
        nameRef.current = val;
    }

    const checkValidName = () => /^[a-zA-Z0-9_\-]+$/.test(nameRef.current);
    const menuRef = useRef(null);

    const submitNote = async () => {
        if (checkValidName()) {
            const path = homeDir + `/${nameRef.current}.md`;
            try {
                await window.fileApi.createFile(path);
                onFileCreate(path);
                updateTree();
                onClose();
            } catch(e) {
                console.error('createFile failed:', e);
            }
        }
    }
    return (<Alert menuRef={menuRef} events={["mousedown", "keydown"]} conditionals={[(mouseDown) => !menuRef.current.contains(mouseDown.target), (keyDown) => keyDown.key === 'Enter']} actions={[onClose, () => submitNote(name)]}>
            <div className="flex flex-col justify-center items-center">
            <InputField id="makeFile" label="Make New Note" type="text" value={name} setter={handleSetNames} error={checkValidName() ? "" : "Invalid Name"} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} isFocused={focused} example="Untitled"/>
            <div className="text-[var(--color-text)] text-sm ml-auto">Click enter to submit, click outside the box to close this window!</div>
            </div>
        </Alert>)
}

function Home() {
    const [openExplorer, setOpenExplorer] = useState(false);

    const [openTabs, setOpenTabs] = useState(() => {
        const saved = localStorage.getItem("openTabs");
        if (saved) return JSON.parse(saved); 
        const initTabs = [{id: crypto.randomUUID(), path: null}];
        localStorage.setItem("openTabs", JSON.stringify(initTabs));
        return initTabs;
    });
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem("activeTab");
        if (saved) return JSON.parse(saved);
        return JSON.parse(localStorage.getItem("openTabs"))[0];
    });

    const [showNewNote, setShowNewNote] = useState(false);
    const [homeDir, setHomeDir] = useState(null);
    const [treeVersion, setTreeVersion] = useState(0);
    const [loading, setLoading] = useState(true);
    const refreshTree = () => setTreeVersion(v => v+1);

    useEffect(() => {localStorage.setItem("activeTab", JSON.stringify(activeTab))}, [activeTab]);
    useEffect(() => {localStorage.setItem("openTabs", JSON.stringify(openTabs))}, [openTabs]);

    useEffect(() => {
        const saved = localStorage.getItem('rootFolder');
        if (saved) {
            setHomeDir(saved);
            setLoading(false);
        } else {
            window.fileApi.initDefault().then(h => {
                setHomeDir(h);
                localStorage.setItem('rootFolder', h);
                setLoading(false);
            });
        };
    }, []);

    function onFileCreate(path) {
        setOpenTabs(prev => prev.map(tab => tab.id === activeTab.id ? { ...tab, path: path } : tab));
        setActiveTab(prev => ({ ...prev, path: path }));
    }

    if (loading) return <Loading />

    return (
        <div className="flex bg-[var(--color-bg)] w-screen h-screen">
            <Sidebar setOpenExplorer={() => setOpenExplorer(!openExplorer)} />
            <Explorer open={openExplorer} treeVersion={treeVersion} activeTab={activeTab} setActiveTab={setActiveTab} setOpenTabs={setOpenTabs} />
            <div className='w-full h-full flex flex-col'>
                <Navbar openTabs={openTabs} setOpenTabs={setOpenTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                {showNewNote && <NewNote homeDir={homeDir} onClose={() => setShowNewNote(false)} updateTree={refreshTree} onFileCreate={onFileCreate}/>}
                <div className='w-full h-full flex flex-col'>
                    {openTabs.map(fileItem => fileItem?.path !== null 
                        ? <Editor key={fileItem.id} path={fileItem.path} tabId={fileItem.id} activeTab={activeTab?.id} /> 
                        : <NewTab key={fileItem.id} tabId={fileItem.id} activeId={activeTab?.id} setShowNewNote={setShowNewNote} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Home;
