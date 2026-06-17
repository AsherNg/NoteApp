import aginoteLogoOnly from "../assets/aginoteLogoOnly.png";
import { PiUserCircle, PiFolders, PiFilePdf, PiGear, PiChats } from "react-icons/pi";
import Tooltip from "./Tooltip";
import { useState } from "react";

const Sidebar = ({setOpenExplorer, setOpenPrint, setOpenChat, setOpenAccount, setOpenSettings})  => {
    return (
        <>
            <aside className="flex flex-col bg-(--color-primary) h-screen border-r-2 border-(--color-border)">
                <div className="flex item-center p-3 my-1">
                    <img src={aginoteLogoOnly} alt="Logo" className="h-8 "/>
                </div>

                <hr className="text-(--color-border) border-1"/>

                <nav>
                    <ul>
                        <Tooltip text="Explorer">
                            <li onClick={() => setOpenExplorer()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                                <PiFolders size={32} className="text-(--color-icon) group-hover:text-(--color-hover)"/>
                            </li>
                        </Tooltip>
                        <Tooltip text="Print">
                            <li onClick={() => setOpenPrint()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                                <PiFilePdf size={32} className="text-(--color-icon) group-hover:text-(--color-hover)"/>
                            </li>
                        </Tooltip>
                        <Tooltip text="Chat">
                            <li onClick={() => setOpenChat()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer">
                                <PiChats size={32} className="text-(--color-icon)"/>
                            </li>
                        </Tooltip>
                        <li className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer">
                            <PiFilePdf size={32} className="text-(--color-icon)"/>
                        </li>
                    </ul>
                </nav>

                <hr className="text-(--color-border) border-1"/>

                <nav>
                    <ul>
                        <Tooltip text="Account">
                            <li onClick={() => setOpenAccount()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                                <PiUserCircle size={32} className="text-(--color-icon) group-hover:text-(--color-hover)"/>
                            </li>
                        </Tooltip>
                    </ul>
                    <ul>
                        <Tooltip text="Settings">
                            <li onClick={() => setOpenSettings()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                                <PiGear size={32} className="text-(--color-icon) group-hover:text-(--color-hover)"/>
                            </li>
                        </Tooltip>
                    </ul>
                </nav>
                
            </aside>
        </>
    )
}

export default Sidebar;