import aginoteLogoOnly from "../assets/aginoteLogoOnly.png";
import { PiUserCircle } from "react-icons/pi";
import { PiFolders } from "react-icons/pi";
import { PiFilePdf } from "react-icons/pi";
import { PiGear } from "react-icons/pi";

const Sidebar = ({setOpenExplorer})  => {
    return (
        <>
            <aside className="flex flex-col bg-(--color-primary) h-screen border-r-2 border-(--color-secondary)">
                <div className="flex item-center p-3 my-1">
                    <img src={aginoteLogoOnly} alt="Logo" className="h-8    " />
                </div>

                <hr className="text-(--color-text) border-1"/>

                <nav>
                    <ul>
                        <li onClick={() => setOpenExplorer()} className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                            <PiFolders size={32} className="text-(--color-text) group-hover:text-(--color-hover)"/>
                        </li>
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
                        <li className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                            <PiUserCircle size={32} className="text-(--color-text) group-hover:text-(--color-hover)"/>
                        </li>
                    </ul>
                    <ul>
                        <li className="flex item-center p-3 my-1 hover:bg-(--color-secondary) cursor-pointer group">
                            <PiGear size={32} className="text-(--color-text) group-hover:text-(--color-hover)"/>
                        </li>
                    </ul>
                </nav>
                
            </aside>
        </>
    )
}

export default Sidebar;