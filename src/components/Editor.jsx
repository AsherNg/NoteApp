import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { 
    EditorView, keymap, lineNumbers, 
    highlightActiveLine
} from "@codemirror/view";
import {
    defaultHighlightStyle, syntaxHighlighting, indentOnInput,
    bracketMatching, foldGutter, foldKeymap
} from "@codemirror/language";

const Editor = ({path, tabId, activeTab}) => {
    const editorParent = useRef(null);
    let saveTimer = useRef(null);

    const editorTheme = EditorView.baseTheme({
        "&": {
            height: "100%",
        },
        "&.cm-focused": {
            outline: "none"
        },
        ".cm-scroller": {
            overflow: "auto"
        },
        ".cm-gutters": {
            background: "none",
            border: "none",
            marginRight: "10px"
        },
        ".cm-activeLine": {
            backgroundColor: "#242424"
        },
        ".cm-cursor": {
            borderLeft: "2px solid #8f8f8f"
            //Why doesn't this work?
        }
    }, { dark: true });

    console.log('Editor path:', path, 'tabId:', tabId, 'activeTab:', activeTab);
    const viewRef = useRef(null);
    useEffect(() => {
        console.log('useEffect fired, path:', path);
        if (!editorParent.current) return;
        editorParent.current.innerHTML = '';
        viewRef.current?.destroy();
        viewRef.current = null;

        let cancelled = false;

        async function init() {
            let doc = "Type anything to start...";

            if (path) {
                try {
                    doc = await window.fileApi.readFile(path);
                } catch (e) {
                    console.error("Failed to read file: ", e);
                }
            }
            if (cancelled) return;

            const state = EditorState.create({
                doc: doc,
                extensions: [
                    editorTheme,
                    lineNumbers(),
                    highlightActiveLine(),
                    EditorView.lineWrapping,
                    syntaxHighlighting(defaultHighlightStyle),
                    bracketMatching(),
                    indentOnInput(),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && path) {
                            clearTimeout(saveTimer.current);
                            saveTimer.current = setTimeout(async () => {
                                const content = update.state.doc.toString();
                                await window.fileApi.writeFile(path, content);
                            }, 300);
                        }
                    }),
                ]
            })
            viewRef.current = new EditorView({ state, parent: editorParent.current });
        }
        init();
        return () => {
            cancelled = true;
            clearTimeout(saveTimer.current);
            viewRef.current?.destroy();
            viewRef.current = null;
        };
    }, [path]);

    return (
        <div ref={editorParent} className={`grow-1 overflow-hidden my-10 mx-10 text-(--color-text) ${tabId === activeTab ? '' : 'hidden'}`}>
        </div>
    );
}

export default Editor;
