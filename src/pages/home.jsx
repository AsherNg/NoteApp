import Sidebar from '../components/Sidebar'
import Explorer from '../components/Explorer';
import Editor from '../components/Editor'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal.jsx';
import Dropdown from '../components/Dropdown.jsx';
import PrintPreview from '../components/PrintPreview.jsx';
import { IoClose } from "react-icons/io5";
import { useRef, useState, useEffect, use, act } from 'react';
import { InputField, Alert, Button } from '../components/Form';
import Loading  from "./loading.jsx";
import supabase from "../supabaseClient.jsx";
import { EditorView } from 'codemirror';

function NewTab({tabId, activeId, setShowNewNote}) {
    return (<div className={`w-full grow flex justify-center items-center flex-col gap-2 ${tabId !== activeId ? 'hidden' : ''}`}>
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
    return (
        <Alert menuRef={menuRef} events={["mousedown", "keydown"]} conditionals={[(mouseDown) => !menuRef.current.contains(mouseDown.target), (keyDown) => keyDown.key === 'Enter']} actions={[onClose, () => submitNote(name)]}>
            <div className="flex flex-col justify-center items-center text-(--color-hover)">
                <InputField id="makeFile" label="Make New Note" type="text" value={name} setter={handleSetNames} error={checkValidName() ? "" : "Invalid Name"} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} isFocused={focused} example="Untitled"/>
                <div className="text-[var(--color-text)] text-sm ml-auto">Click enter to submit, click outside the box to close this window!</div>
            </div>
        </Alert>
    )}

function Home() {
    // States to handle opening of menus
    const [openExplorer, setOpenExplorer] = useState(false);
    const [openPrint, setOpenPrint] = useState(false);
    const [openAccount, setOpenAccount] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);

    const [openTabs, setOpenTabs] = useState(() => {
        const saved = localStorage.getItem("openTabs");
        if (saved) return JSON.parse(saved); 
        const initTabs = [{id: crypto.randomUUID(), path: null}];
        localStorage.setItem("openTabs", JSON.stringify(initTabs));
        return initTabs;
    });

    // Get reference maps to editors
    const viewRefs = useRef(new Map());
    const [markdown, setMarkdown] = useState("");

    // State to handle active tab
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

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.log("Error signing out: ", error);
            return;
        }
        navigate("/login")
    }

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

    // Get theme from localstorage, set to dark by default
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") ?? "Dark";
    });
    useEffect(() => {document.documentElement.setAttribute('data-theme', theme);}, [theme]);

    const onFileCreate = (path) => {
        setOpenTabs(prev => prev.map(tab => tab.id === activeTab.id ? { ...tab, path: path } : tab));
        setActiveTab(prev => ({ ...prev, path: path }));
    }

    if (loading) return <Loading />

    return (
        <div className="flex bg-[var(--color-bg)] w-screen h-screen">
            <Sidebar setOpenExplorer={() => setOpenExplorer(!openExplorer)} setOpenPrint={() => {
                console.log(viewRefs.current.get(activeTab.id).current.state);
                const content = viewRefs.current.get(activeTab.id)?.current.state.doc.toString() ?? "";
                setMarkdown(content);
                setOpenPrint(true);
                }} setOpenAccount={() => setOpenAccount(true)} setOpenSettings={() => setOpenSettings(true)}/>
            <Explorer open={openExplorer} treeVersion={treeVersion} activeTab={activeTab} setActiveTab={setActiveTab} setOpenTabs={setOpenTabs} />
            <div className='grow h-screen flex flex-col'>
                <Navbar openTabs={openTabs} setOpenTabs={setOpenTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                {showNewNote && <NewNote homeDir={homeDir} onClose={() => setShowNewNote(false)} updateTree={refreshTree} onFileCreate={onFileCreate}/>}
                <div className='w-full h-[calc(100vh-42px)] flex flex-col items-center'>
                    {openTabs.map(fileItem => fileItem?.path !== null 
                        ? <Editor viewRefs={viewRefs} key={fileItem.id} path={fileItem.path} tabId={fileItem.id} activeTab={activeTab?.id} /> 
                        : <NewTab key={fileItem.id} tabId={fileItem.id} activeId={activeTab?.id} setShowNewNote={setShowNewNote} />
                    )}
                </div>
            </div>

            <Modal isOpen={openPrint}>
                <div className="w-3xl h-[80%] bg-(--color-bg) rounded-lg p-10 text-(--color-text) flex flex-col">
                    <div className="flex flex-row justify-between w-full">
                        <span className="font-bold text-(--color-hover)">Export to PDF</span>
                        <IoClose size={24} onClick={() => setOpenPrint(false)} className="cursor-pointer hover:text-(--color-hover)"/>
                    </div>
                    <div className="flex flex-row mt-3 grow">
                        <PrintPreview markdown={markdown}/>
                        <div className="p-3 flex flex-col justify-end grow h-full">
                            <Button text="Print"></Button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={openAccount}>
                <div className="w-3xl h-[80%] bg-(--color-bg) rounded-lg p-10 text-(--color-text)">
                    <div className="flex flex-row justify-between w-full">
                        <span className="font-bold text-(--color-hover)">Account</span>
                        <IoClose size={24} onClick={() => setOpenAccount(false)} className="cursor-pointer hover:text-(--color-hover)"/>
                    </div>
                    <div className="flex flex-row w-full">
                        <Button text="Sign Out" onClick={handleSignOut} enabled="true" type="button"></Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={openSettings}>
                <div className="w-2xl h-[80%] flex flex-col items-center bg-(--color-bg) rounded-lg p-10 text-(--color-text)">
                    <div className="flex flex-row justify-between w-full my-3">
                        <span className="font-bold text-lg text-(--color-hover)">Settings</span>
                        <IoClose size={24} onClick={() => setOpenSettings(false)} className="cursor-pointer hover:text-(--color-hover)"/>
                    </div>
                    <div className="border-1 border-(--color-border) w-full my-3"></div>
                    <div className="flex justify-between items-center w-full my-3">
                        <div className="flex flex-col">
                            <span className="font-semibold text-(--color-hover)">Theme</span>
                            <span>Choose the color theme of the app</span>
                        </div>
                        <Dropdown activeText={theme} options={[
                            { id: 1, text: "Dark", onSelect: () => { if (theme !== "Dark") setTheme("Dark"); localStorage.setItem("theme", "Dark"); }},
                            { id: 2, text: "Light", onSelect: () => { if (theme !== "Light") setTheme("Light"); localStorage.setItem("theme", "Light"); }},
                            { id: 3, text: "Custom" }
                        ]}></Dropdown>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Home;
