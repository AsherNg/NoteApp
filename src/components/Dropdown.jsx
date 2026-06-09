import { useState, useEffect, useRef } from "react";

/* Example options
const options = [
    { id: 1, text: "First", onSelect: () => console.log() },
    { id: 2, text: "Second"},
    { id: 3, text: "Last" }
]
*/

const Dropdown = ({ options, activeText }) => {
    const [isOpen,  setIsOpen] = useState(false);
    const [active, setActive] = useState(activeText);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function clickOustide(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', clickOustide);
        return () => document.removeEventListener('mousedown', clickOustide);
    }, []);

    const selectOption = (option) => {
        option.onSelect?.();
        setActive(option.text);
        setIsOpen(false);
    }

    return (
        <div className="relative w-25" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="border-1 border-(--color-text) rounded-sm p-2 w-full text-(--color-active) cursor-pointer">
                <span>{activeText}</span>
                <span className="transition-transform"> ▾</span>
            </button>

            {isOpen && (
                <ul className="absolute border-1 rounded-sm mt-1 z-20 w-full">
                    {options.map((opt, i) => {
                        const isActive = opt.id === active.id;
                        return (
                            <li key={opt.id} className={`cursor-pointer hover:bg-(--color-secondary) py-1 px-2 rounded-sm ${isActive ? "text-(--color-active)" : ""}`}  onClick={() => selectOption(opt)}>
                                <span>{opt.text}</span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export default Dropdown;