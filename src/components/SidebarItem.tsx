import { useState } from "react";

const SidebarItem = ({ name, icon }: { name: string, icon: any }) => {
    const [userToggle, setUserToggle] = useState(false);
    return (
        <div className="relative group" onMouseEnter={() => setUserToggle(true)} onMouseLeave={() => setUserToggle(false)}>
            <div className="p-2 m-2 rounded-lg group-hover:bg-blue-400/50 cursor-pointer">
                {icon}
            </div>

            {userToggle && (
                <div className="absolute top-0 translate-x-14.5 translate-y-2.5 bg-blue-400 rounded-lg flex flex-nowrap text-center p-1.5">
                    <div className="absolute top-0 left-0 -translate-x-1 translate-y-2 transform rotate-45 h-3 w-3 bg-blue-400 z-1"></div>
                    <span className="text-white text-xs whitespace-nowrap z-2">{name}</span>
                </div>
             )}
        </div>
    );
};

export default SidebarItem;