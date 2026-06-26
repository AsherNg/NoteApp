import { useState, useEffect, useRef } from "react";

/* Example options
const options = [
    { id: 1, text: "First", onSelect: () => console.log() },
    { id: 2, text: "Second"},
    { id: 3, text: "Last" }
]
*/

const Dropdown = ({ options, activeText, search=false, widthClass='w-24' }) => { 
    const [isOpen,  setIsOpen] = useState(false);
    const [active, setActive] = useState(activeText);
    const [hover, setHover] = useState(null);
    const [searchField, setSearchField] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        function clickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', clickOutside);
        return () => document.removeEventListener('mousedown', clickOutside);
    }, []);

    const selectOption = (option) => {
        option.onSelect?.();
        setActive(option.text);
        setIsOpen(false);
    }

    return (
        <div className={`relative ${widthClass} p-2`} ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="border-1 border-(--color-text) p-2 rounded-sm w-full text-(--color-active) cursor-pointer flex justify-start items-center ">
                <span>{activeText}</span>
                <span className="transition-transform"> ▾</span>
            </button>

            {isOpen && (
                <div className="absolute border-1 rounded-sm mt-1 z-20 w-full bg-(--color-bg) flex flex-col justify-start items-center">
                    <input className="w-full text-(--color-text) outline-none px-2 py-1" placeholder="Search" type="text" value={searchField} onChange={(e) => setSearchField(e.target.value)}/>
                    <div className="border-1 border-(--color-border) w-full"></div>
                    <ul className="w-full max-h-24 overflow-y-auto scrollbar-thumb-(--color-secondary) scrollbar-track-transparent">
                        {options.filter(opt => opt.text.includes(searchField)).map((opt, i) => {
                            const isActive = opt.id === active.id;
                            return (
                                <li key={opt.text} className={`flex ${hover === opt.text ? "justify-between items-center bg-(--color-secondary)" : "justify-start"} cursor-pointer py-1 px-2 rounded-sm ${isActive ? "text-(--color-active)" : ""}`} onMouseOver={(e) => {e.stopPropagation(); setHover(opt.text);}} onMouseLeave={(e) => {e.stopPropagation(); setHover(null);}} onClick={() => {setSearchField(''); selectOption(opt);}}>
                                    <span>{opt.text}</span>
                                    {hover === opt.text && (<div className="flex justify-center items-center gap-1">
                                        {opt.icons?.map(({icon: Icon, onClick}, index) => (<Icon key={index} size={16} className="text-(--color-active) hover:text-(--color-accentHover)" onClick={onClick} />))}
                                    </div>)}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default Dropdown;
