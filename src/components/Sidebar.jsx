import aginoteLogoOnly from "../assets/aginoteLogoOnly.png";
import { PiUserCircle } from "react-icons/pi";
import { PiFolders } from "react-icons/pi";
import { PiFilePdf } from "react-icons/pi";
import { PiGear } from "react-icons/pi";
import Tooltip from "./Tooltip";
import { useState } from "react";

const Sidebar = ({setOpenExplorer, setOpenAccount, setOpenSettings})  => {
    return (
        <>
            <aside className="flex flex-col bg-(--color-primary) h-screen border-r-2 border-(--color-secondary)">
                <div className="flex item-center p-3 my-1">
                    <img src={aginoteLogoOnly} alt="Logo" className="h-8 "/>
                </div>

                <hr className="text-(--color-text) border-1"/>

                <nav>
                    <ul>
                        <Tooltip text="Explorer">
                            <li onClick={() => setOpenExplorer()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                                <PiFolders size={32} className="text-(--color-text) group-hover:text-(--color-hover)"/>
                            </li>
                        </Tooltip>
                        <li className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                            <PiFilePdf size={32} className="text-(--color-text) group-hover:text-(--color-hover)"/>
                        </li>
                        <li className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer">
                            <PiFilePdf size={32} className="text-(--color-text)"/>
                        </li>
                        <li className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer">
                            <PiFilePdf size={32} className="text-(--color-text)"/>
                        </li>
                    </ul>
                </nav>

                <hr className="text-(--color-text) border-1"/>

                <nav>
                    <ul>
                        <Tooltip text="Account">
                            <li onClick={() => setOpenAccount()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                                <PiUserCircle size={32} className="text-(--color-text) group-hover:text-(--color-hover)"/>
                            </li>
                        </Tooltip>
                    </ul>
                    <ul>
                        <Tooltip text="Settings">
                            <li onClick={() => setOpenSettings()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                                <PiGear size={32} className="text-(--color-text) group-hover:text-(--color-hover)"/>
                            </li>
                        </Tooltip>
                    </ul>
                </nav>
                
            </aside>
        </>
    )
}

export default Sidebar;