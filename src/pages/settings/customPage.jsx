import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { Button } from "./../../components/form.jsx";

const initColors = {
    primary: "#1b1b1b",
    secondary: "#242424",
    tertiary: "#303030",
    border: "#454545",
    bg: "#101010",
    text: "#8f8f8f",
    icon: "#8f8f8f", 
    hover: "#e2e2e2",
    active: "#e2e2e2",
    accent: "#aee7cb",
    accentHover: "#90c9ad",
    danger: "#e7aeae",
    dangerHover: "#c99090",
    codeblock: "#1a1a1a",
    tagKeyword: "#c586C0",
    tagComment: "#6a9955",
    tagString: "#ce9178",
    tagNumber: "#b5cea8",
    tagVariable: "#9cdcfe",
    tagFunction: "#dcdcaa",
    heading1: "#F8F9FA",
    heading2: "#E9ECEF",
    heading3: "#DEE2E6",
    heading4: "#6C757D",
    heading5: "#6C757D",
    heading6: "#6C757D",
}

const CustomPage = ({ themeName, setTheme, setThemeOptionsVersion, setOpenCustomiseStyle, setOpenSettings, stylesDir }) => {
    const isValidColor = (color) => {
        const el = document.createElement('div');
        el.style.color = color;
        return el.style.color !== '';
    };
    const [customFocusedField, setCustomFocusedField] = useState('');
    const [colors, setColors] = useState(initColors);
    const [nameField, setNameField] = useState(() => {
        if (themeName === "Dark" || themeName === "Light") return '';
        return themeName;
    });
    const [nameError, setNameError] = useState(() => themeName === "Dark" || themeName === "Light");
    const [errorState, setErrorState] = useState(true);

    useEffect(() => {
        if (!themeName || themeName === "Dark" || themeName === "Light") return;
        window.fileApi.readTheme(themeName).then(parsed => setColors(parsed));
    }, [themeName])

    useEffect(() => {
        let colorError = !Object.entries(colors).every(([key, value]) => isValidColor(value));
        let nameError = !/^[a-zA-Z0-9_-]+$/.test(nameField) || nameField === "Dark" || nameField === "Light";
        setErrorState(colorError || nameError);
    }, [nameField, colors]);

    const onSave = async () => {
        const filePath = `${stylesDir}/${nameField}.css`;
        const content = ":root {\n" + Object.entries(colors).map(([key, value]) => `--${key}: ${value};\n`).join("") + "}";
        console.log(content);
        await window.fileApi.writeFile(filePath, content);
        setThemeOptionsVersion(prev => prev + 1);
        setTheme(nameField);
        setOpenCustomiseStyle(false);
        setOpenSettings(true);
    }

    return (<div className="w-2xl h-[80%] flex flex-col justify-start items-center bg-(--color-bg) rounded-lg p-10 text-(--color-text)">
        <div className="flex flex-row justify-between w-full my-3">
            <div className="flex flex-col">
                <span className="font-bold text-lg text-(--color-hover)">Settings</span>
                <span>Restore to default brings back to Dark Theme</span>
            </div>
            <IoClose size={24} onClick={() => {setOpenCustomiseStyle(false); setOpenSettings(true);}} className="cursor-pointer hover:text-(--color-hover)"/>
        </div>
        <div className="border-1 border-(--color-border) w-full my-3"></div>
        <div className="flex flex-col justify-start items-center w-full pr-4 overflow-y-auto scrollbar-gutter-stable scrollbar-thumb-(--color-secondary) scrollbar-track-transparent">
            {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center w-full my-3">
                    <span className="font-semibold text-(--color-hover)">{key[0].toUpperCase() + key.slice(1)}</span>
                    <div className="flex justify-center items-center w-[25%] gap-2">
                    <input className={`w-full text-(--color-hover) text-base p-2 text-clip rounded-lg border-1 box-border ${customFocusedField === key ? "outline-1 border-(--color-accentHover) outline-(--color-accentHover)" : "outline-none border-(--color-accent)"}`} type="text" value={value} onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))} onFocus={() => setCustomFocusedField(key)} onBlur={() => setCustomFocusedField('')} placeholder={value}/>
                    <div className="w-[18px] h-[18px] rounded-lg" style={{ outline: `2px solid ${isValidColor(value) ? "var(--color-text)" : "var(--color-danger)"}`, background: isValidColor(value) ? value : "transparent" }}/>
                    </div>
                </div>
            ))}
            <div className="flex justify-center w-[60%] items-center mb-3 gap-2">
                <Button text="Restore" onClick={() => setColors(initColors)} className="bg-(--color-danger) hover:bg-(--color-dangerHover)"/>
                <Button text="Save" onClick={onSave} enabled={!errorState} />
                <input className={`w-full text-(--color-hover) text-base p-2 w-24 text-clip rounded-lg border-1 box-border ${nameError ? "outline-1 border-(--color-dangerHover) outline-(--color-dangerHover)" : customFocusedField === "name" ? "outline-1 border-(--color-accentHover) outline-(--color-accentHover)" : "outline-none border-(--color-accent)"}`} type="text" value={nameField} onChange={(e) => setNameField(e.target.value)} onFocus={() => {setCustomFocusedField("name"); setNameError(false)}} onBlur={() => setCustomFocusedField('')} placeholder="Untitled"/>
            </div>
        </div>
    </div>);
}

export default CustomPage;
