import { IoCloseCircleOutline } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { useState, useEffect } from "react";

const allTabs = "flex justify-between items-center px-7 py-2 border-1 border-l-0 border-(--color-border) cursor-pointer";
const activeClass = allTabs + " bg-(--color-bg) border-t-(--color-accent) border-b-(--color-bg)";
const hoverClass = allTabs + " bg-(--color-secondary)";
const inactiveClass = allTabs + " bg-(--color-primary)";

const tabNameHelper = (activeScreenId, screen) => {
    if (screen.screenId === activeScreenId) {
        return screen.path;
    } 
    if (screen.displayType === "file") {
        return undefined;
    }
    if (screen.displays) {
        for (let i = 0; i < screen.displays.length; i++) {
            let possibleStr = tabNameHelper(activeScreenId, screen.displays[i]);
            if (possibleStr !== undefined) {
                return possibleStr;
            }
        }
    }
    return undefined;
}

const tabName = (tab) => {
    if (tab.noOfTabs === 1) {
        return tab.screens.path;
    } else {
        return tabNameHelper(tab.activeScreen, tab.screens);
    }
}

const Tab = ({tab, hoverTab, setHoverTab, activeTab, setActiveTab, closeTab}) => {
    let path = tabName(tab);
    return (
        <li id={tab.tabId} className={activeTab === tab.tabId ? activeClass : hoverTab === tab.tabId ? hoverClass : inactiveClass} onMouseOver={() => setHoverTab(tab.tabId)} onMouseLeave={() => setHoverTab('')} onClick={() => setActiveTab(tab.tabId)}>
            <div className="text-base w-18 text-ellipsis text-(--color-text) overflow-hidden whitespace-nowrap">
                <span className="text-(--color-accent)">{tab.noOfTabs === 1 ? "" : `${tab.noOfTabs} `}</span>
                {path != null ? path.split(/[\\/]/).pop() : "New Tab"}
            </div>
            <IoCloseCircleOutline size={16} className={`text-(--color-text) hover:text-(--color-hover) cursor-pointer ${(activeTab === tab.tabId || hoverTab === tab.tabId) ? "" : "invisible"}`} onClick={(e) => {e.stopPropagation(); closeTab(tab.tabId)}}/>
        </li>
    )
}

const Navbar = ({openTabs, setOpenTabs, activeTab, setActiveTab}) => {
    const [hoverTab, setHoverTab] = useState('');

    useEffect(() => {
        localStorage.setItem("activeTab", activeTab);
        localStorage.setItem("openTabs", JSON.stringify(openTabs));
    }, [openTabs, activeTab]);

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

    return (
        <div className="w-full h-[42px] bg-(--color-primary)">
            <ul className="w-full flex flex-row items-center overflow-x-auto scrollbar-gutter-stable scrollbar-thumb-(--color-secondary) scrollbar-thin scrollbar-track-transparent">
                {
                    openTabs.map(tab => (
                        <Tab
                            key={tab.tabId}
                            tab={tab}
                            hoverTab={hoverTab}
                            setHoverTab={setHoverTab}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            closeTab={closeTab}
                        />
                    ))
                }
                <li><GoPlus size={16} className="mx-2 text-(--color-text) hover:text-(--color-hover) cursor-pointer" onClick={newTab}/></li>
            </ul>
        </div> 
    )
}

export default Navbar;
