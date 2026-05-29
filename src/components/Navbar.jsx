import { IoCloseCircleOutline } from "react-icons/io5";

const allTabs = "flex items-center px-7 py-2 border-(--color-secondary) border-1 border-l-0 cursor-pointer"
const activeClass = allTabs + " bg-(--color-bg) border-t-(--color-accent) border-b-0";
const inactiveClass = allTabs + " bg-(--color-primary) hover:bg-(--color-secondary)"

const Navbar = ({activeTab, setActiveTab}) => {
    return (
        <div className="flex w-full bg-(--color-primary)">
            <ul className="flex">
                <li onClick={() => setActiveTab(1)} className={activeTab == 1 ? activeClass : inactiveClass}>
                    <a href="#" className="flex items-center justify-center text-(--color-text)">Tab 1</a>
                    <IoCloseCircleOutline size={16} className="ml-3 text-(--color-text) hover:text-(--color-hover) cursor-pointer"/>
                </li>
                <li onClick={() => setActiveTab(2)} className={activeTab == 2 ? activeClass : inactiveClass}>
                    <a href="#" className="flex items-center justify-center text-(--color-text)">Tab 2</a>
                </li>
                <li onClick={() => setActiveTab(3)} className={activeTab == 3 ? activeClass : inactiveClass}>
                    <a href="#" className="flex items-center justify-center text-(--color-text)">Tab 3</a>
                </li>
            </ul>
        </div> 
    )
}

export default Navbar;