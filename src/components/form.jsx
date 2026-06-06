import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function InputField({ id, label, type, value, setter, error, onFocus, onBlur, isFocused, example }) {
    const base = "text-black text-base p-2 w-md text-clip rounded-lg border-2 box-border outline-none";
    const state = isFocused
        ? "border-blue-500 bg-gray-300"
        : error
        ? "border-red-500 bg-red-50"
        : "border-gray-200 bg-gray-300";

    return (
        <div className="flex flex-col items-start justify-center">
            <div className="flex flex-row justify-start items-center gap-2">
                <label htmlFor={id} className="my-2 text-base font-bold">{ label }</label>
                {error && <span className="text-red-500 text-sm">{error}</span>}
            </div>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                className={`${base} ${state}`}
                placeholder={example}
            />
        </div>
    );
}

function Button({ text, onClick, enabled = true, type = "button", className }) {
    const base = "px-4 py-2 text-lg font-bold flex justify-center items-center rounded-lg box-border";
    const enabledStyle = "text-(--color-tertiary) bg-(--color-accent) hover:bg-(--color-accentHover) cursor-pointer";
    const disabledStyle = "text-white bg-gray-400 cursor-not-allowed opacity-60";

    return (
        <button
            className={`${base} ${enabled ? enabledStyle : disabledStyle} ${className}`}
            onClick={onClick}
            disabled={!enabled}
            type={type}
        >
            {text}
        </button>
    );
}

function Linker({ to, text, className }) {
    return (
        <Link to={to} className={`text-gray-400 text-xs hover:underline cursor-pointer ${className}`}>{text}</Link>
    )
}

function ContextMenu({ x, y, onClose, items}) {
    const [hoverField, setHoverField] = useState('');
    const onHover = (id) => {setHoverField(id)}
    const menuRef = useRef(null);

    useEffect(() => {
        function handleOpen(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleOpen);
        return () => document.removeEventListener("mousedown", handleOpen);
    }, []);

    return (
        <div ref={menuRef} className="fixed rounded-lg bg-[var(--color-primary)] z-50 p-1" style={{ top: y, left: x }}>
            <ul className="list-none">
            {
                items.map((item) => (
                    <li key={item.id} className={hoverField === item.id ? "text-sm bg-[var(--color-secondary)] text-[var(--color-text)]" : "text-sm bg-[var(--color-primary)] text-[var(--color-text)]"} onMouseOver={() => onHover(item.id)} onClick={item.onClick} onMouseLeave={() => onHover('')}>
                        {item.name}
                    </li>
                ))
            }
            </ul>
        </div>
    )
}

function Alert({ children, menuRef, conditionals, actions, events}) {
    useEffect(() => {
        function handleEvent (e) {
            if (menuRef.current && conditionals[events.indexOf(e.type)](e)) {
                actions[events.indexOf(e.type)]();
            }
        }
        events.forEach(event => document.addEventListener(event, handleEvent));
        return () => events.forEach(event => document.removeEventListener(event, handleEvent));
    }, []);

    return (
        <div className="fixed inset-0 flex justify-center items-center w-full h-full z-20 bg-black/20"> 
            <div ref={menuRef} className="bg-(--color-primary) rounded-lg p-2">
                {children}
            </div>
        </div>
    );
}

export { InputField, Button, Linker, ContextMenu, Alert };
