import { useState, useRef } from "react";
import { IoClose } from "react-icons/io5"
import { Button } from "../../components/form.jsx"

const initHotkeys = [
    { "id": 1, "Action": "Create New Note", "key": "n", "mod": true, "shift": false, "Default": "CTRL + N" },
    { "id": 2, "Action": "Create New Note in Root", "key": "n", "mod": true, "shift": true, "Default": "CTRL + SHIFT + N" },
    { "id": 3, "Action": "Delete Current Note", "key": "d", "mod": true, "shift": true, "Default": "CTRL + SHIFT + D" },
    { "id": 4, "Action": "Rename New Note", "key": "r", "mod": true, "shift": false, "Default": "CTRL + R" },
    { "id": 5, "Action": "Split Right", "key": "s", "mod": true, "shift": false, "Default": "CTRL + S" },
    { "id": 6, "Action": "Split Down", "key": "v", "mod": true, "shift": false, "Default": "CTRL + V" },
    { "id": 7, "Action": "Close Pane", "key": "q", "mod": true, "shift": false, "Default": "CTRL + Q" },
    { "id": 8, "Action": "New Tab", "key": "t", "mod": true, "shift": false, "Default": "CTRL + T" },
    { "id": 9, "Action": "Close Tab", "key": "w", "mod": true, "shift": true, "Default": "CTRL + W" },
];

const formatCombo = (combo) => {
    if (!combo) return '';
    const parts = [];
    if (combo.mod) parts.push("CTRL");
    if (combo.shift) parts.push("SHIFT");
    if (combo.key) parts.push(combo.key.toUpperCase());
    return parts.join(" + ");
};

const KeybindInput = ({ value, onChange, placeholder, defaultValue }) => {
    const [focused, setFocused] = useState(false);
    const [pending, setPending] = useState(null)
    const inputRef = useRef(null);
    const eventHandler = (e) => {
        e.preventDefault();
        if (e.key === 'Enter') {
            if (!pending) {
                onChange(defaultValue); 
            } else {
                onChange(pending); 
            }
            setPending(null);
            inputRef.current.blur();
            setFocused(false);
            return;
        }
        if (['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) return;
        const combo = {
            key: e.key.toLowerCase(),
            mod: e.metaKey || e.ctrlKey,
            shift: e.shiftKey
        };
        setPending(combo);
        onChange(combo);
    }
    return (
        <input
            ref={inputRef}
            readOnly
            value={focused ? ( pending ? formatCombo(pending) : '' ) : formatCombo(value)}
            placeholder={focused ? placeholder : ''}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setPending(null); }}
            onKeyDown={(e) => eventHandler(e)}
            className={`w-full text-(--color-hover) text-base p-2 text-clip rounded-lg border-1 box-border ${focused ? "outline-1 border-(--color-accentHover) outline-(--color-accentHover)" : "outline-none border-(--color-accent)"}`}
        />
    );
}

function HotkeysPage({ hotkeys, setHotkeys, setOpenHotkeys }) {
    return (<div className="w-2xl h-[80%] flex flex-col justify-start items-center bg-(--color-bg) rounded-lg p-10 text-(--color-text)">
        <div className="flex flex-row justify-between w-full my-3">
            <div className="flex flex-col">
                <span className="font-bold text-lg text-(--color-hover)">Hotkeys</span>
                <span>Click on Box, click keybinding and press Enter to save that keybind</span>
            </div>
            <IoClose size={24} onClick={() => {setOpenHotkeys(false)}} className="cursor-pointer hover:text-(--color-hover)"/>
        </div>
        <div className="border-1 border-(--color-border) w-full my-3"></div>
        <div className="flex flex-col justify-start items-center w-full pr-4 overflow-y-auto scrollbar-gutter-stable scrollbar-thumb-(--color-secondary) scrollbar-track-transparent">
            {hotkeys.map(action => (<div key={action.id} className="flex justify-between items-center w-full py-2">
                <span className="font-semibold text-(--color-hover)">{action.Action}</span>
                <div className="flex justify-center items-center w-[35%] gap-2">
                    <KeybindInput value={ {key: action.key, mod: action.mod, shift: action.shift} } 
                                  onChange={(combo) => setHotkeys(prev => prev.map(h => h.Action === action.Action ? {...h, ...combo} : h ))} 
                                  placeholder={action.Default}
                                  defaultValue={{
                                    key: initHotkeys.find(h => h.id === action.id).key,
        mod: initHotkeys.find(h => h.id === action.id).mod,
            shift: initHotkeys.find(h => h.id === action.id).shift,
    }}/>
                </div>
            </div>))}
        </div>
        <div className="flex justify-center w-[60%] items-center mb-3 gap-2">
            <Button text="Reset" onClick={() => setHotkeys(initHotkeys)} className="bg-(--color-danger) hover:bg-(--color-dangerHover)"/>
        </div>
    </div>);
}

export {initHotkeys, HotkeysPage};
