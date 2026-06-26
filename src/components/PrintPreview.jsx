import hljs from 'highlight.js';
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import 'katex/dist/katex.min.css';
import { useState, useMemo } from 'react';
import Dropdown from "./Dropdown.jsx";

marked.use(markedHighlight({
    highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
}));

marked.use(markedKatex({ throwOnError: false }));

const getThemeColors = () => {
    const computed = getComputedStyle(document.documentElement);
    return {
        codeblock: computed.getPropertyValue("--codeblock"),
        tagKeyword: computed.getPropertyValue("--tagKeyword"),
        tagComment: computed.getPropertyValue("--tagComment"),
        tagString: computed.getPropertyValue("--tagString"),
        tagNumber: computed.getPropertyValue("--tagNumber"),
        tagVariable: computed.getPropertyValue("--tagVariable"),
        tagFunction: computed.getPropertyValue("--tagFunction"),
        heading1: computed.getPropertyValue("--heading1"),
        heading2: computed.getPropertyValue("--heading2"),
        heading3: computed.getPropertyValue("--heading3"),
        heading4: computed.getPropertyValue("--heading4"),
        heading5: computed.getPropertyValue("--heading5"),
        heading6: computed.getPropertyValue("--heading6"),
    }
}

const marginValues = {
    None:   { top: 0,    bottom: 0,    left: 0,    right: 0 },
    Narrow: { top: 0.5,  bottom: 0.5,  left: 0.5,  right: 0.5 },
    Normal: { top: 1,    bottom: 1,    left: 1,     right: 1 },
    Wide:   { top: 1.5,  bottom: 1.5,  left: 1.5,  right: 1.5 },
};

const PrintPreview = ({ markdown, setOpenPrint, openTabs, activeTab }) => {
    const [landscape, setLandscape] = useState(false);
    const [paperSize, setPaperSize] = useState('A4');
    const [margins, setMargins] = useState('Normal');

    const determineAspect = () => {
        if (landscape && paperSize === 'Letter') return 'aspect-[1.292/1]';
        if (landscape && paperSize !== 'Letter') return 'aspect-[1.414/1]';
        if (!landscape && paperSize === 'Letter') return 'aspect-[1/1.292]';
        return 'aspect-[1/1.414]';
    }

    const aspect = determineAspect();

    const colors = useMemo(() => getThemeColors(), []);
    const styleBlock = `
        <style>
            :root {
                --codeblock: ${colors.codeblock};
                --tagKeyword: ${colors.tagKeyword};
                --tagComment: ${colors.tagComment};
                --tagString: ${colors.tagString};
                --tagNumber: ${colors.tagNumber};
                --tagVariable: ${colors.tagVariable};
                --tagFunction: ${colors.tagFunction};
                --heading1: ${colors.heading1};
                --heading2: ${colors.heading2};
                --heading3: ${colors.heading3};
                --heading4: ${colors.heading4};
                --heading5: ${colors.heading5};
                --heading6: ${colors.heading6};
            }
            h1 { color: var(--heading1); }
            h2 { color: var(--heading2); }
            h3 { color: var(--heading3); }
            h4 { color: var(--heading4); }
            h5 { color: var(--heading5); }
            h6 { color: var(--heading6); }
            .hljs { background: var(--codeblock); padding: 1em; border-radius: 4px; }
            .hljs-keyword { color: var(--tagKeyword); }
            .hljs-comment { color: var(--tagComment); }
            .hljs-string { color: var(--tagString); }
            .hljs-number { color: var(--tagNumber); }
            .hljs-variable { color: var(--tagVariable); }
            .hljs-title.hljs-function { color: var(--tagFunction); }
        </style>
    `

    const getFileNameHelper = (screen, activeScreenId) => {
        if (screen.screenId === activeScreenId) return screen.path;
        if (screen.displayType === 'file') return undefined;
        if (screen.displays) {
            for (let i = 0; i < screen.displays.length; i++) {
                let possibleStr = getFileNameHelper(screen.displays[i], activeScreenId);
                if (possibleStr !== undefined) {
                    return possibleStr;
                }
            }
        }
        return undefined;
    }

    const getFileName = () => {
        const tab = openTabs.find(tab => tab.tabId === activeTab);
        return getFileNameHelper(tab.screens, tab.activeScreen);
    }

    const html = useMemo(() => marked.parse(markdown, { breaks: true }), [markdown]);
    const handleExport = async () => {
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8"/>
                ${styleBlock}
            </head>
            <body>${html}</body>
            </html>
        `

        console.log(`Paper Size: ${paperSize}, Margins: ${JSON.stringify(marginValues[margins])}`);

        await window.fileApi.exportPdf(fullHtml, getFileName(), {
            landscape: landscape,
            pageSize: paperSize,
            margins: marginValues[margins]
        });
    }
    return (
        <div className={`flex ${landscape ? 'flex-col' : 'flex-row'} my-3 gap-1 grow w-full`}>
            <div className={`prose prose-sm bg-white ${aspect} ${landscape ? 'w-full h-auto max-w-none' : 'h-full w-auto'} ${margins === 'None' ? "p-0" : margins === 'Narrow' ? "p-4" : margins === 'Normal' ? "p-8" : "p-12"} text-[8px] text-black overflow-y-auto`} dangerouslySetInnerHTML={{ __html: styleBlock + html }}/>
            <div className="flex flex-col gap-2 px-2 w-full h-full items-center justify-start">
                <div className="flex w-full justify-between items-center text-(--color-text)">
                    <div>Orientation</div>
                    <Dropdown options={[
                        { id: 1, text: "Landscape", onSelect: () => setLandscape(true) },
                        { id: 2, text: "Portrait", onSelect: () => setLandscape(false) },
                    ]} activeText={landscape ? "Landscape" : "Portrait"} widthClass="w-32" />
                </div>
                <div className="flex w-full justify-between items-center text-(--color-text)">
                    <div>Paper Size</div>
                    <Dropdown options={[
                        { id: 1, text: "A3", onSelect: () => setPaperSize('A3') },
                        { id: 2, text: "A4", onSelect: () => setPaperSize('A4') },
                        { id: 3, text: "A5", onSelect: () => setPaperSize('A5') },
                        { id: 4, text: "Letter", onSelect: () => setPaperSize('Letter') },
                    ]} activeText={paperSize} />
                </div>
                <div className="flex w-full justify-between items-center text-(--color-text)">
                    <div>Margins</div>
                    <Dropdown options={[
                        { id: 1, text: "None", onSelect: () => setMargins("None") },
                        { id: 2, text: "Narrow", onSelect: () => setMargins("Narrow") },
                        { id: 3, text: "Normal", onSelect: () => setMargins("Normal") },
                        { id: 4, text: "Wide", onSelect: () => setMargins("Wide") },
                    ]} activeText={margins} widthClass="w-28"/>
                </div>
                <div className="flex w-full gap-1 justify-end items-center text-(--color-active)">
                    <button className={`py-1 px-2 bg-(--color-accentHover)`} onClick={ async () => { await handleExport(); setOpenPrint(false); }}>Export PDF</button>
                    <button className={`py-1 px-2 bg-(--color-dangerHover)`} onClick={() => setOpenPrint(false)}>Cancel</button>
                </div>
            </div>
        </div>
    )
}

export default PrintPreview;
