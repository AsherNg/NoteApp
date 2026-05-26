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

const Editor = ({tabId, activeTab}) => {
    const editorParent = useRef(null);

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
            border: "2px solid #8f8f8f"
            //Why doesn't this work?
        }
    }, { dark: true });

    useEffect(() => {
        if (!editorParent.current) return;

        const state = EditorState.create({
            doc: "Type anything to start...",
            extensions: [
                editorTheme,
                lineNumbers(),
                highlightActiveLine(),
                EditorView.lineWrapping,
                syntaxHighlighting(defaultHighlightStyle),
                bracketMatching(),
                indentOnInput()
            ]
        })

        const view = new EditorView({
            state,
            parent: editorParent.current
        })        

        return () => view.destroy();
    }, []);

    return (
        <div ref={editorParent} className={`grow-1 overflow-hidden my-10 mx-10 text-(--color-text) ${tabId == activeTab ? '' : 'hidden'}`}>
        </div>
    );
}

export default Editor;