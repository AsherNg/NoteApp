import Sidebar from '../components/Sidebar'
import Explorer from '../components/Explorer';
import Editor from '../components/Editor'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal.jsx';
import Dropdown from '../components/Dropdown.jsx';
import PrintPreview from '../components/PrintPreview.jsx';
import { IoClose, IoMenu } from "react-icons/io5";
import { useRef, useState, useEffect } from 'react';
import { InputField, Alert, Button, ContextMenu } from '../components/form.jsx';
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

function ScreenHelper({activeTab, openTabs, setOpenTabs, screens, tabId, onRightSplit, onDownSplit, onCloseDisplay, setShowNewNote, viewRefs}) {
    const [tabMenu, setTabMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const tabIndex = openTabs.findIndex(tab => tab.tabId === activeTab);
    if (tabIndex === -1) return null; // or loading state

    if (screens.displayType === "file") {
        return (
            <div className={`relative flex flex-1 flex-col ${screens.path ? "justify-start" : "justify-center" } justify-center items-center box-border rounded-lg w-full h-full ${openTabs[openTabs.findIndex(tab => tab.tabId === activeTab)].activeScreen === screens.screenId ? "outline-1 outline-(--color-accentHover)" : ""}`} onClick={() => {
                setOpenTabs(tabs => tabs.map(tab => tab.tabId === activeTab ? { ...tab, activeScreen: screens.screenId } : tab))
            }}> 
                <IoMenu size={16} className="absolute text-(--color-text) hover:text-(--color-hover) top-2 right-2 p-1 outline-2 outline-(--color-primary) z-10" 
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ x: rect.right, y: rect.bottom - 4 });
                        setTabMenu(true);
                    }}
                />
                {tabMenu && <ContextMenu 
                    x={menuPos.x} y={menuPos.y} onClose={() => setTabMenu(false)} align="right"
                    items={[
                        {id: 1, name: "Split Right", onClick: ((e) => {e.stopPropagation(); onRightSplit()})},
                        {id: 2, name: "Split Down", onClick: ((e) => {e.stopPropagation(); onDownSplit()})},
                        {id: 3, name: "Close Display", onClick: ((e) => {e.stopPropagation(); onCloseDisplay()})},
                        {id: 4, name: "Print Preview", onClick: () => console.log("...")},
                    ]}
                />}
                {screens.path !== null ? <Editor viewRefs={viewRefs} path={screens.path} tabId={tabId} activeTab={activeTab} screenId={screens.screenId}></Editor> : <NewTab tabId={tabId} activeId={activeTab} setShowNewNote={setShowNewNote}/>}
            </div>
        )
    } else if (screens.displayType === "v-split") {
        return (
            <div className="flex flex-1 w-full h-full gap-2">
                {screens.displays.map(screen => (<ScreenHelper key={screen.screenId} activeTab={activeTab} openTabs={openTabs} setOpenTabs={setOpenTabs} screens={screen} tabId={tabId} onRightSplit={onRightSplit} onDownSplit={onDownSplit} onCloseDisplay={onCloseDisplay} viewRefs={viewRefs} setShowNewNote={setShowNewNote}/>))}
            </div>
        )
    } else if (screens.displayType === "h-split") {
        return (
            <div className="flex flex-1 flex-col w-full h-full gap-2">
                {screens.displays.map(screen => (<ScreenHelper key={screen.screenId} activeTab={activeTab} openTabs={openTabs} setOpenTabs={setOpenTabs} screens={screen} tabId={tabId} onRightSplit={onRightSplit} onDownSplit={onDownSplit} onCloseDisplay={onCloseDisplay} viewRefs={viewRefs} setShowNewNote={setShowNewNote}/>))}
            </div>
        )
    }
}

function Screen({tab, openTabs, setOpenTabs, activeTab, onRightSplit, onDownSplit, onCloseDisplay, setShowNewNote, viewRefs}) {
    return <ScreenHelper key={tab.screens.screenId} activeTab={activeTab} screens={tab.screens} tabId={tab.tabId} openTabs={openTabs} setOpenTabs={setOpenTabs} onRightSplit={onRightSplit} onDownSplit={onDownSplit} onCloseDisplay={onCloseDisplay} viewRefs={viewRefs} setShowNewNote={setShowNewNote}/>
}

function Home() {
    // States to handle opening of menus
    const [openExplorer, setOpenExplorer] = useState(false);
    const [openPrint, setOpenPrint] = useState(false);
    const [openAccount, setOpenAccount] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);

    const [openTabs, setOpenTabs] = useState(() => {
        const saved = localStorage.getItem("openTabs");
        if (saved) return JSON.parse(saved); 
        const id = crypto.randomUUID();
        const initTabs = [
            {
                tabId: crypto.randomUUID(),
                noOfTabs: 1,
                activeScreen: id,
                screens: {
                    screenId: crypto.randomUUID(),
                    displayType: "file",
                    path: null
                }
            }
        ];
        localStorage.setItem("openTabs", JSON.stringify(initTabs));
        localStorage.setItem("activeTab", initTabs[0].tabId);
        return initTabs;
    });

    // Get reference maps to editors
    const viewRefs = useRef(new Map());
    const [markdown, setMarkdown] = useState("");

    // State to handle active tab
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem("activeTab");
        if (saved) return saved;
        return JSON.parse(localStorage.getItem("openTabs"))[0].tabId;
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

    useEffect(() => {localStorage.setItem("activeTab", activeTab)}, [activeTab]);
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

    const updateScreenHelper = (screen, path, activeScreenId) => {
        if (screen.screenId === activeScreenId) {
            return { ...screen, path: path }
        }
        if (screen.displayType !== "file") {
            return { ...screen, displays: screen.displays.map(d => updateScreenHelper(d, path, activeScreenId)) }
        }
        return screen;
    }

    const onFileCreate = (path) => {
        const activeScreenId = openTabs[openTabs.findIndex(tab => tab.tabId === activeTab)].activeScreen;
        setOpenTabs(tabs => tabs.map(tab => tab.tabId !== activeTab ? tab : { ...tab, screens: updateScreenHelper(tab.screens, path, activeScreenId) }));
    }

    const splitScreen = (screen, direction, newPane, activeScreenId) => {
        if (!screen.displays) return screen;
        let idx;
        if (screen.displays) {
            idx = screen.displays.findIndex(d => d.screenId === activeScreenId);
        }
        if (idx === -1) {
            return { ...screen, displays: screen.displays.map(d => splitScreen(d, direction, newPane, activeScreenId)) }
        }
        const target = screen.displays[idx];
        if (screen.displayType === direction) {
            const newDisplays = [...screen.displays];
            newDisplays.splice(idx+1, 0, newPane);
            return { ...screen, displays: newDisplays }
        } else {
            const newDisplay = {
                screenId: crypto.randomUUID(),
                displayType: direction,
                displays: [target, newPane],
            }
            const newDisplays = [...screen.displays];
            newDisplays.splice(idx, 1, newDisplay);
            return { ...screen, displays: newDisplays}
        }
    }

    const splitRight = () => {
        let sId = crypto.randomUUID();
        const newScreen = { screenId: sId, displayType: "file", path: null }
        setOpenTabs(tabs => tabs.map(
            tab => { if (tab.tabId !== activeTab) {
                return tab;
            } else {
                if (tab.noOfTabs === 1) {
                    return { ...tab, noOfTabs: tab.noOfTabs+1, activeScreen: sId, screens: {
                        screenId: crypto.randomUUID(),
                        displayType: "v-split",
                        displays: [
                            tab.screens,
                            newScreen
                        ]
                    }}
                } else {
                    return { ...tab, noOfTabs: tab.noOfTabs+1, activeScreen: sId, screens: splitScreen(tab.screens, "v-split", newScreen, tab.activeScreen) }
                }
            }
        }));
    }

    const splitDown = () => {
        let sId = crypto.randomUUID();
        const newScreen = { screenId: sId, displayType: "file", path: null }
        setOpenTabs(tabs => tabs.map(
            tab => { 
                if (tab.tabId !== activeTab) {
                    return tab;
                } else {
                    if (tab.noOfTabs === 1) {
                        return { ...tab, noOfTabs: tab.noOfTabs+1, activeScreen: sId, screens: {
                            screenId: crypto.randomUUID(),
                            displayType: "h-split",
                            displays: [
                                tab.screens,
                                newScreen
                            ]
                        }}
                    } else {
                        return { ...tab, noOfTabs: tab.noOfTabs+1, activeScreen: sId, screens: splitScreen(tab.screens, "h-split", newScreen, tab.activeScreen) }
                    }
                }
            }
        ));
    }

    const closeDisplayHelper = (screen, targetId) => {
        if (!screen.displays) return screen;
        const filtered = screen.displays.map(d => closeDisplayHelper(d, targetId)).filter(d => d.screenId !== targetId);
        if (filtered.length === 1) {
            return filtered[0];
        }
        return { ...screen, displays: filtered };
    }

    const closeDisplay = () => {
        let tmp = openTabs.findIndex(tab => tab.tabId === activeTab);
        if (openTabs[tmp].noOfTabs === 1) {
            const updated = openTabs.filter(tab => tab.tabId !== activeTab);
            if (updated.length === 0) {
                let sId = crypto.randomUUID();
                const blankTab = {tabId: crypto.randomUUID(), noOfTabs: 1, activeScreen: sId, screens: {
                    screenId: sId, displayType: "file", path: null
                }};
                setActiveTab(blankTab.tabId);
                updated[0] = blankTab;
            } else {
                if (tmp === updated.length) {
                    setActiveTab(updated[tmp-1].tabId);
                } else {
                    setActiveTab(updated[tmp].tabId);
                }
            }
            setOpenTabs(updated);
        } else {
            const updated = closeDisplayHelper(openTabs[tmp].screens, openTabs[tmp].activeScreen);
            console.log(JSON.stringify(updated));
            let replacementActiveScreen = updated;
            while (replacementActiveScreen.displayType !== "file") {
                replacementActiveScreen = replacementActiveScreen.displays[0];
            }
            console.log(JSON.stringify(replacementActiveScreen));
            setOpenTabs(tabs => tabs.map(tab => tab.tabId !== activeTab ? tab :
                { ...tab, noOfTabs: tab.noOfTabs-1, activeScreen: replacementActiveScreen.screenId, screens: updated }
            ));
        }
    }

    if (loading) return <Loading />

    return (
        <div className="flex bg-[var(--color-bg)] w-screen h-screen">
            <Sidebar setOpenExplorer={() => setOpenExplorer(!openExplorer)} setOpenPrint={() => {
                const tab = openTabs.find(t => t.tabId === activeTab);
                const content = viewRefs.current.get(tab?.activeScreen)?.current.state.doc.toString() ?? "";
                setMarkdown(content);
                setOpenPrint(true);
                }} setOpenAccount={() => setOpenAccount(true)} setOpenSettings={() => setOpenSettings(true)}/>
            <Explorer open={openExplorer} treeVersion={treeVersion} activeTab={activeTab} setActiveTab={setActiveTab} openTabs={openTabs} setOpenTabs={setOpenTabs} setTreeVersion={setTreeVersion} />
            <div className='grow h-screen flex flex-col'>
                <Navbar openTabs={openTabs} setOpenTabs={setOpenTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                {showNewNote && <NewNote homeDir={homeDir} onClose={() => setShowNewNote(false)} updateTree={refreshTree} onFileCreate={onFileCreate}/>}
                <div className='w-full h-[calc(100vh-42px)] flex flex-col items-center'>
                    {
                        openTabs.map(tab => (
                            <div key={tab.tabId} className={`p-2 w-full h-full ${tab.tabId === activeTab ? "" : "hidden"}`}>
                                <Screen tab={tab} activeTab={activeTab} openTabs={openTabs} setOpenTabs={setOpenTabs} onRightSplit={splitRight} onDownSplit={splitDown} onCloseDisplay={closeDisplay} setShowNewNote={setShowNewNote} viewRefs={viewRefs}/>
                            </div>
                        ))
                    }
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
                        <Button text="Sign Out" onClick={handleSignOut} enabled="true" type="button" className="bg-(--color-danger) hover:bg-(--color-dangerHover)"></Button>
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
