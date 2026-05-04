import { MdPerson, MdEditDocument, MdChat, MdBubbleChart } from "react-icons/md";
import SidebarItem from "./SidebarItem";

const Sidebar = () => {
    const sidebarItems = [{
        name: "Editor",
        icon: <MdEditDocument /> 
    }, {
        name: "AI Chat",
        icon: <MdChat />
    }, {
        name: "Graph View",
        icon: <MdBubbleChart />
    }];
   
    const listItems = sidebarItems.map(sidebarItem =>
        <li>
            <SidebarItem name={sidebarItem.name} icon={sidebarItem.icon} />
        </li>
    )
    return (
        <div>
            <ul className="place-items-center text-3xl text-gray-400">
                <li className="p-2 m-2 rounded-lg hover:bg-green-100">
                    <a href="/" className="text-3xl"><MdPerson/></a>
                </li>
                {listItems}
            </ul>
        </div>
    )
}

export default Sidebar;