import Sidebar from '../components/Sidebar.jsx'
import Explorer from '../components/Explorer.jsx';
import Editor from '../components/Editor.jsx'
import Navbar from '../components/Navbar.jsx'
import Chat from '../components/Chat.jsx';
import Modal from '../components/Modal.jsx';
import Dropdown from '../components/Dropdown.jsx';
import PrintPreview from '../components/PrintPreview.jsx';
import { IoClose, IoMenu, IoTrashOutline, IoPencil } from "react-icons/io5";
import { useRef, useState, useEffect, useMemo } from 'react';
import { InputField, Alert, Button, ContextMenu } from '../components/form.jsx';
import Loading  from "./loading.jsx";
import supabase from "../supabaseClient.jsx";
import CustomPage from './settings/customPage.jsx';
import { EditorView } from 'codemirror';
import { useNavigate } from 'react-router-dom';
import { initHotkeys, HotkeysPage } from '../pages/settings/hotkeys.jsx';

function NewTab({tabId, activeId, setShowNewNote}) {
    return (<div className={`w-full grow flex justify-center items-center flex-col gap-2 ${tabId !== activeId ? 'hidden' : ''}`}>
                <Button text="Create New Note" onClick={() => setShowNewNote(true)} enabled={true} type="button" />
                <div className='text-sm text-[var(--color-text)]'>Click any of your previous files to change this tab!</div>
            </div>);
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
    );
}

function ScreenHelper({activeTab, openTabs, setOpenTabs, screens, tabId, onRightSplit, onDownSplit, onCloseDisplay, setShowNewNote, viewRefs}) {
    const [tabMenu, setTabMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const tabIndex = openTabs.findIndex(tab => tab.tabId === activeTab);
    if (tabIndex === -1) return null;

    if (screens.displayType === "file") {
        return (
            <div className={`relative flex flex-1 flex-col ${screens.path ? "justify-start" : "justify-center" } justify-center items-center box-border rounded-lg w-full h-full min-w-0 min-h-0 overflow-hidden ${openTabs[openTabs.findIndex(tab => tab.tabId === activeTab)].activeScreen === screens.screenId ? "ring-1 ring-(--color-accentHover)" : ""}`} onClick={() => {
                setOpenTabs(tabs => tabs.map(tab => tab.tabId === activeTab ? { ...tab, activeScreen: screens.screenId } : tab))
            }}> 
                <IoMenu size={16} className="absolute text-(--color-text) hover:text-(--color-hover) top-2 right-2 p-1 outline-2 outline-(--color-primary) z-10" 
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ x: rect.right, y: rect.bottom - 4 });
                        setTabMenu(true);
                    }}
                />
                {tabMenu && <ContextMenu bgColor="(--color-secondary)"
                    x={menuPos.x} y={menuPos.y} onClose={() => setTabMenu(false)} align="right"
                    items={[
                        {id: 1, name: "Split Right", onClick: ((e) => {e.stopPropagation(); onRightSplit()})},
                        {id: 2, name: "Split Down", onClick: ((e) => {e.stopPropagation(); onDownSplit()})},
                        {id: 3, name: "Close Display", onClick: ((e) => {e.stopPropagation(); onCloseDisplay()})},
                    ]}
                />}
                {screens.path !== null ? <Editor viewRefs={viewRefs} path={screens.path} tabId={tabId} activeTab={activeTab} screenId={screens.screenId}></Editor> : <NewTab tabId={tabId} activeId={activeTab} setShowNewNote={setShowNewNote}/>}
            </div>
        )
    } else if (screens.displayType === "v-split") {
        return (
            <div className="flex flex-1 w-full h-full gap-2 min-w-0 min-h-0 ">
                {screens.displays.map(screen => (<ScreenHelper key={screen.screenId} activeTab={activeTab} openTabs={openTabs} setOpenTabs={setOpenTabs} screens={screen} tabId={tabId} onRightSplit={onRightSplit} onDownSplit={onDownSplit} onCloseDisplay={onCloseDisplay} viewRefs={viewRefs} setShowNewNote={setShowNewNote}/>))}
            </div>
        )
    } else if (screens.displayType === "h-split") {
        return (
            <div className="flex flex-1 flex-col w-full h-full gap-2 min-w-0 min-h-0 ">
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
    const [openChat, setOpenChat] = useState(false);
    const [openAccount, setOpenAccount] = useState(false);
    const [openThemes, setOpenThemes] = useState(false);
    const [openCustomiseStyle, setOpenCustomiseStyle] = useState(false);
    const [openHotkeys, setOpenHotkeys] = useState(false);
    const [deleteFileAlert, setDeleteFileAlert] = useState(false)

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
    const [stylesDir, setStylesDir] = useState(null);
    const [hotkeysDir, setHotkeysDir] = useState(null);
    const [treeVersion, setTreeVersion] = useState(0);
    const [loading, setLoading] = useState(true);
    const refreshTree = () => setTreeVersion(v => v+1);

    const navigate = useNavigate();

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
        const savedNotes = localStorage.getItem('rootFolder');
        const savedStyles = localStorage.getItem('stylesFolder');
        const savedHotkeys = localStorage.getItem('savedHotkeys');
        if (savedNotes && savedStyles && savedHotkeys) {
            setHomeDir(savedNotes);
            setStylesDir(savedStyles);
            setHotkeysDir(savedHotkeys);
            setLoading(false);
        } else {
            window.fileApi.initDefault().then(h => {
                setHomeDir(h[0]);
                localStorage.setItem('rootFolder', h[0]);
                setStylesDir(h[1]);
                localStorage.setItem('stylesFolder', h[1]);
                setHotkeysDir(h[2]);
                localStorage.setItem('savedHotkeys', h[2]);
                setLoading(false);
            });
        };
    }, []);


    // Get theme from localstorage, set to dark by default
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") ?? "Dark";
    });

    const [themeOptionsVersion, setThemeOptionsVersion] = useState(0);

    const [themeOptions, setThemeOptions] = useState([]);

    const [deleteThemeAlert, setDeleteThemeAlert] = useState('');
    const deleteThemeRef = useRef(null);
    const deleteThemeFunc = async (name) => {
        await window.fileApi.deleteFile(`${stylesDir}/${name}.css`);
        setTheme("Dark");
        setThemeOptionsVersion(prev => prev+1);
        setDeleteThemeAlert('');
        console.log("Deleted");
    }

    const [stylesContent, setStylesContent] = useState('');

    useEffect(() => {
        const themeSettingFunc = async () => {
            if (theme === "Dark" || theme === "Light") {
                setStylesContent('');
                document.documentElement.setAttribute('data-theme', theme);
            }
            else if (stylesDir && theme !== "Dark" && theme !== "Light") {
            const path = `${stylesDir}/${theme}.css`;
                try {
                    const content = await window.fileApi.readFile(path);
                    setStylesContent(content || '');
                } catch (err) {
                    console.error("Failed to load custom theme:", err);
                    setStylesContent('');
                }}
            localStorage.setItem('theme', theme);
        }
        themeSettingFunc();
    }, [theme, stylesDir])
    
    useEffect(() => {
        const leadThemeOptions = async () => {
            let themeOpt = [
                { id: 1, text: "Dark", onSelect: () => setTheme("Dark") },
                { id: 2, text: "Light", onSelect: () => setTheme("Light") },
            ];
            let i = 3;
            if (!stylesDir) return;
            await window.fileApi.readFolder(stylesDir).then(folder => {
                const stylesList = folder.items.map(item => {
                    let name = item.name.substring(0, item.name.lastIndexOf('.'));
                    let option = { id: i, text: name, onSelect: () => setTheme(name), icons: [
                        {icon: IoTrashOutline, onClick: () => { setDeleteThemeAlert(name) }},
                        {icon: IoPencil, onClick: () => {setTheme(name); setOpenCustomiseStyle(true);}},
                    ]};
                    i++;
                    return option;
                });
                setThemeOptions([ ...themeOpt, ...stylesList ]);
            });
        }
        leadThemeOptions();
    }, [stylesDir, themeOptionsVersion]);


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

    function newTab() {
        const blankTabsId = crypto.randomUUID();
        const blankTab = {
            tabId: crypto.randomUUID(), noOfTabs: 1, activeScreen: blankTabsId,
            screens: {
                screenId: blankTabsId, displayType: "file", path: null
            }
        }
        setOpenTabs(prev => [ ...prev, blankTab ]);
        setActiveTab(blankTab.tabId);
    }

    function closeTab(tabId) {
        let tmp = openTabs.findIndex(item => item.tabId === tabId);
        const updated = openTabs.filter(item => item.tabId !== tabId);
        setOpenTabs(updated);
        if (updated.length === 0) {
            newTab();
        } else {
            if (tmp === updated.length) {
                setActiveTab(updated[tmp-1].tabId);
            } else {
                setActiveTab(updated[tmp].tabId);
            }
        }
    }

    const currPathHelp = (screen, activeScreenId) => {
        if (activeScreenId === screen.screenId) {
            return screen.path;
        } else {
            if (!screen.displays) {
                return;
            }
            for (const d of screen.displays) {
                let tmp = currPathHelp(d, activeScreenId);
                if (tmp) {
                    return tmp;
                }
            }
        }
    }

    const currPath = () => {
        const tab = openTabs.find(tab => activeTab.id === tab.id);
        return currPathHelp(tab.screens, tab.activeScreen);
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

    const [renameFileAlert, setRenameFileAlert] = useState(false);

    const RenameFile = ({ path, onClose, updateTree, onFileRename }) => {
        const menuRef = useRef(null);
        const [name, setName] = useState('');
        const [focused, setFocused] = useState(true);
        const checkValidName = (n) => /^[a-zA-Z0-9_\-\.\s]+$/.test(n.trim());

        const handleSubmit = async () => {
            if (!checkValidName(name)) return;
            const dir = path.substring(0, path.lastIndexOf('\\'));
            const newPath = `${dir}/${name}.md`;
            if (await window.fileApi.checkExists(newPath)) return; // could surface an error state here
            await window.fileApi.rename(path, newPath);
            onFileRename(path, newPath);
            updateTree();
            onClose();
        };

        return (
            <Alert menuRef={menuRef} events={["mousedown", "keydown"]}
            conditionals={[(e) => !menuRef.current.contains(e.target), (e) => e.key === 'Enter']}
            actions={[onClose, handleSubmit]}>
            <div className="flex flex-col justify-center items-center text-(--color-hover)">
            <InputField id="renameFile" label="Rename Note" type="text" value={name} setter={setName}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} isFocused={focused} example="Untitled"/>
            <div className="text-[var(--color-text)] text-sm ml-auto">Click enter to submit, click outside the box to close this window!</div>
            </div>
            </Alert>
        );
    };

    const fileRenameHelp = (screen, oldPath, newPath) => {
        if (screen.displayType === 'file') {
            return screen.path === oldPath ? { ...screen, path: newPath } : screen;
        }
        if (screen.displays) {
            return { ...screen, displays: screen.displays.map(d => fileRenameHelp(d, oldPath, newPath)) };
        }
        return screen;
    };

    const onFileRename = (oldPath, newPath) => {
        setOpenTabs(tabs => tabs.map(tab => ({ ...tab, screens: fileRenameHelp(tab.screens, oldPath, newPath) })));
    };

    const [hotkeys, setHotkeys] = useState(initHotkeys);
    const [blockCount, setBlockCount] = useState(0);
    const actions = {
        1: () => { setShowNewNote(true); setBlockCount(v => v + 1); },
        2: () => {},
        3: () => { setDeleteFileAlert(true); setBlockCount(v => v + 1); },
        4: () => { setRenameFileAlert(true); setBlockCount(v => v + 1); },
        5: splitRight,
        6: splitDown,
        7: closeDisplay,
        8: newTab,
        9: () => { closeTab(activeTab); }
    };

    useEffect(() => {
        if (!hotkeysDir) return;
        const loadHotkeys = async () => {
            const exists = await window.fileApi.checkExists(hotkeysDir);
            if (exists) {
                const content = await window.fileApi.readFile(hotkeysDir);
                setHotkeys(JSON.parse(content));
            } else {
                await window.fileApi.writeFile(hotkeysDir, JSON.stringify(initHotkeys));
            }
        };
        loadHotkeys();
    }, [hotkeysDir]);

    useEffect(() => {
        if (!hotkeysDir) return;
        window.fileApi.writeFile(hotkeysDir, JSON.stringify(hotkeys));
        const handler = (e) => {
            if (e.repeat) return;
            if (blockCount > 0) return;
            const mod = e.metaKey || e.ctrlKey;
            const match = hotkeys.find(kb => kb.key === e.key.toLowerCase() && kb.mod === mod && !!kb.shift === e.shiftKey);
            if (match && actions[match.id]) {
                e.preventDefault();
                actions[match.id]();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [openTabs, blockCount, hotkeysDir, hotkeys, actions]);

    if (loading) return <Loading />

    return (
        <div className="flex bg-(--color-bg) w-screen h-screen">
        {stylesContent && (<style> {stylesContent} </style>)}
            <Sidebar setOpenExplorer={() => setOpenExplorer(!openExplorer)} setOpenPrint={() => {
                const tab = openTabs.find(t => t.tabId === activeTab);
                const content = viewRefs.current.get(tab?.activeScreen)?.current.state.doc.toString() ?? "";
                setMarkdown(content);
                setOpenPrint(true);
                }} setOpenChat={() => setOpenChat(!openChat)} setOpenAccount={() => setOpenAccount(true)} setOpenThemes={() => setOpenThemes(true)} setOpenHotkeys={() => setOpenHotkeys(true)}/>
            <Explorer open={openExplorer} treeVersion={treeVersion} activeTab={activeTab} setActiveTab={setActiveTab} openTabs={openTabs} setOpenTabs={setOpenTabs} setTreeVersion={setTreeVersion} />
            <div className='grow w-[calc(100vh-56px)] h-screen flex flex-col'>
                <Navbar openTabs={openTabs} activeTab={activeTab} setActiveTab={setActiveTab} newTab={newTab} closeTab={closeTab}/>
                {showNewNote && <NewNote homeDir={homeDir} onClose={() => {setShowNewNote(false); setBlockCount(v => Math.max(0, v - 1)); }} updateTree={refreshTree} onFileCreate={onFileCreate}/>}
                <div className='w-full h-[calc(100vh-42px)] flex flex-col items-center mt-1'>
                    {
                        openTabs.map(tab => (
                            <div key={tab.tabId} className={`p-2 w-full h-full ${tab.tabId === activeTab ? "" : "hidden"}`}>
                                <Screen tab={tab} activeTab={activeTab} openTabs={openTabs} setOpenTabs={setOpenTabs} onRightSplit={splitRight} onDownSplit={splitDown} onCloseDisplay={closeDisplay} setShowNewNote={setShowNewNote} viewRefs={viewRefs}/>
                            </div>
                        ))
                    }
                </div>
            </div>

            <Chat open={openChat} closeChat={() => setOpenChat(false)}/>

            {deleteFileAlert && (<DeletePath path={currPath()} onClose={() => {setDeleteFileAlert(false); setBlockCount(c => Math.max(0, c - 1));}} updateTree={() => setTreeVersion(v => v + 1)} onFileDestroy={fileDestroy}/>)}
            {renameFileAlert && (
                <RenameFile 
                path={currPath()} 
                onClose={() => { setRenameFileAlert(false); setBlockCount(c => Math.max(0, c - 1)); }}
                updateTree={() => setTreeVersion(v => v + 1)} 
                onFileRename={onFileRename}
                />
            )}

            <Modal isOpen={openPrint} setOpen={setOpenPrint} stateTracker={setBlockCount}>
                <div className="w-3xl h-[80%] bg-(--color-bg) rounded-lg p-10 text-(--color-text) flex flex-col">
                    <div className="flex flex-row justify-between w-full">
                        <span className="font-bold text-(--color-hover)">Export to PDF</span>
                        <IoClose size={24} onClick={() => setOpenPrint(false)} className="cursor-pointer hover:text-(--color-hover)"/>
                    </div>
                    <div className="border-1 border-(--color-border) w-full my-3"></div>
                    <PrintPreview markdown={markdown} setOpenPrint={setOpenPrint} openTabs={openTabs} activeTab={activeTab}/>
                </div>
            </Modal>

            <Modal isOpen={openAccount} setOpen={setOpenAccount} stateTracker={setBlockCount}>
                <div className="w-3xl h-[80%] bg-(--color-bg) rounded-lg p-10 text-(--color-text)">
                    <div className="flex flex-row justify-between w-full">
                        <span className="font-bold text-(--color-hover)">Account</span>
                        <IoClose size={24} onClick={() => setOpenAccount(false)} className="cursor-pointer hover:text-(--color-hover)"/>
                    </div>
                    <div className="border-1 border-(--color-border) w-full my-3"></div>
                    <div className="flex flex-row w-full">
                        <Button text="Sign Out" onClick={handleSignOut} enabled="true" type="button" className="bg-(--color-danger) hover:bg-(--color-dangerHover)"></Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={openThemes} setOpen={setOpenThemes} stateTracker={setBlockCount}>
                <div className="w-2xl h-[80%] flex flex-col items-center bg-(--color-bg) rounded-lg p-10 text-(--color-text)">
                    <div className="flex flex-row justify-between w-full my-3">
                        <span className="font-bold text-lg text-(--color-hover)">Themes</span>
                        <IoClose size={24} onClick={() => setOpenThemes(false)} className="cursor-pointer hover:text-(--color-hover)"/>
                    </div>
                    <div className="border-1 border-(--color-border) w-full my-3"></div>
                    <div className="flex justify-between items-center w-full my-3">
                        <div className="flex flex-col">
                            <span className="font-semibold text-(--color-hover)">Choose Theme</span>
                            <span>Choose the color theme of the app</span>
                        </div>
                        <Dropdown activeText={theme} options={ themeOptions } search={true} widthClass='w-48'></Dropdown>
                    </div>
                    <div className="flex justify-between items-center w-full my-3">
                        <div className="flex flex-col">
                            <span className="font-semibold text-(--color-hover)">Add Theme</span>
                            <span>Add a custom color theme for the app</span>
                        </div>
                        <button onClick={() => {setOpenThemes(false); setTheme("Dark"); setOpenCustomiseStyle(true);}} className="border-1 border-(--color-text) rounded-sm px-4 py-2 text-(--color-active) cursor-pointer">Customise</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={openCustomiseStyle} setOpen={setOpenCustomiseStyle} stateTracker={setBlockCount}>
                <CustomPage themeName={theme} setTheme={setTheme} setOpenCustomiseStyle={setOpenCustomiseStyle} setOpenThemes={setOpenThemes} stylesDir={stylesDir} setThemeOptionsVersion={setThemeOptionsVersion}/>
            </Modal>
            {deleteThemeAlert.length > 0 && <Alert menuRef={deleteThemeRef} events={["mousedown", "keydown"]} conditionals={[(mousedown) => !deleteThemeRef.current.contains(mousedown.target), (keydown) => keydown.key === 'Enter']} actions={[() => setDeleteThemeAlert(false), () => deleteThemeFunc(deleteThemeAlert)]}>
                <div className="flex flex-col justify-center items-center text-(--color-hover)">
                    <div className="text-[var(--color-text)] text-md">Once this is done, it cannot be undone!</div>
                    <div className="text-[var(--color-text)] text-md">Are you sure to delete "<em>{deleteThemeAlert}</em>" theme?</div>
                    <div className="text-[var(--color-text)] text-sm mb-1">(If you aren't just click outside this box! If you are, just click Enter!)</div>
                    <div className="flex justify-center gap-4">
                        <Button text="Cancel" onClick={() => setDeleteThemeAlert('')} />
                        <Button text="Confirm" onClick={() => deleteThemeFunc(deleteThemeAlert)} className="bg-(--color-danger) hover:bg-(--color-dangerHover)"/>
                    </div>
                </div>
            </Alert>}
            <Modal isOpen={openHotkeys} setOpen={setOpenHotkeys} stateTracker={setBlockCount}>
                <HotkeysPage hotkeys={hotkeys} setHotkeys={setHotkeys} setOpenHotkeys={setOpenHotkeys}/>
            </Modal>
        </div>
    );
}

export default Home;
