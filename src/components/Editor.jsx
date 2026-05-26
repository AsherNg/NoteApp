import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { 
    EditorView, keymap, lineNumbers, highlightActiveLine,
    highlightActiveLineGutter
} from "@codemirror/view";
import {
  defaultHighlightStyle, syntaxHighlighting, indentOnInput,
  bracketMatching, foldGutter, foldKeymap
} from "@codemirror/language";

const Editor = () => {
    const editorParent = useRef(null);

    useEffect(() => {
        if (!editorParent.current) return;

        const state = EditorState.create({
            doc: "Type anything to start...",
            extensions: [
                lineNumbers(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
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
        <div ref={editorParent} className="my-10 mx-20">
        </div>
    );
}

export default Editor;