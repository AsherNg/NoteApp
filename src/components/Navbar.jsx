import { IoCloseCircleOutline } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { useState, useEffect } from "react";

const allTabs = "flex w-36 justify-between items-center px-7 py-2 border-1 border-l-0 border-(--color-border) cursor-pointer";
const activeClass = allTabs + " bg-(--color-bg) border-t-(--color-accent) border-b-(--color-bg)";
const hoverClass = allTabs + " bg-(--color-secondary)";
const inactiveClass = allTabs + " bg-(--color-primary)";

const Tab = ({fileItem, hoverTab, setHoverTab, activeTab, setActiveTab, closeTab}) => {
    return (
        <li id={fileItem.id} className={activeTab?.id === fileItem.id ? activeClass : hoverTab?.id === fileItem.id ? hoverClass : inactiveClass} onMouseOver={() => setHoverTab(fileItem)} onMouseLeave={() => setHoverTab(null)} onClick={() => setActiveTab(fileItem)}>
            <div className="text-base text-ellipsis text-(--color-text) overflow-hidden whitespace-nowrap">
                {fileItem.path !== null ? fileItem.path.split(/[\\/]/).pop() : "New Tab"}
            </div>
            {(activeTab?.id === fileItem.id || hoverTab?.id === fileItem.id) && <IoCloseCircleOutline size={16} className="text-(--color-text) hover:text-(--color-hover) cursor-pointer" onClick={(e) => {e.stopPropagation(); closeTab(fileItem.id)}}/>}
        </li>
    )
}

const Navbar = ({openTabs, setOpenTabs, activeTab, setActiveTab}) => {
    const [hoverTab, setHoverTab] = useState(null);

    useEffect(() => {
        localStorage.setItem("activeTab", JSON.stringify(activeTab));
        localStorage.setItem("openTabs", JSON.stringify(openTabs));
    }, [openTabs, activeTab]);

    function newTab() {
        const blankTab = {id: crypto.randomUUID(), path: null}
        setOpenTabs(prev => [...prev, blankTab]);
        setActiveTab(blankTab);
    }

    function closeTab(tabId) {
        let tmp = openTabs.findIndex(item => item.id === tabId);
        const updated = openTabs.filter(item => item.id !== tabId);
        setOpenTabs(updated);
        if (updated.length === 0) {
            newTab();
        } else {
            if (tmp === updated.length) {
                setActiveTab(updated[tmp-1]);
            } else {
                setActiveTab(updated[tmp]);
            }
        }
    }

    return (
        <div className="flex w-full bg-(--color-primary)">
            <ul className="flex justify-start items-center">
                {
                    openTabs.map(tab => (
                        <Tab
                            key={tab.id}
                            fileItem={tab}
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
