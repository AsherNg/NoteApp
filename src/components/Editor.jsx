import { useEffect, useRef } from "react";
import { tags } from "@lezer/highlight";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars, ViewPlugin, Decoration, WidgetType } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, syntaxTree } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab, insertNewlineAndIndent } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";

const editorHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color:"#C586C0" },
    { tag: tags.comment, color:"#6A9955" },
    { tag: tags.string, color:"#CE9178" },
    { tag: tags.number, color:"#B5CEA8" },
    { tag: tags.variableName, color:"#9CDCFE" },
    { tag: tags.function(tags.variableName), color:"#DCDCAA" },
])

const headingPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.selectionSet) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
        const builder = new RangeSetBuilder();
        const { state } = view;
        const selection = state.selection.main;

        syntaxTree(state).iterate({
            enter(node) {
                const match = node.name.match(/^ATXHeading(\d)$/);
                if (!match) return;

                const level = parseInt(match[1]);
                const lineStart = node.from;
                const hashEnd = lineStart + level + 1;

                const cursorOnLine = selection.from >= node.from && selection.from <= node.to;

                if (!cursorOnLine) {
                    builder.add(lineStart, hashEnd, Decoration.replace({}));
                }

                const sizes = { 1: "3em", 2: "2.6em", 3: "2.2em", 4: "1.8em", 5: "1.4em", 6: "1.1em"};
                const colors = { 1: "#F8F9FA", 2: "#E9ECEF", 3: "#DEE2E6", 4: "#6C757D", 5:"#6C757D", 6: "#6C757D"}

                builder.add(
                    node.from,
                    node.to,
                    Decoration.mark({
                        class: `cm-heading cm-heading-${level}`,
                        attributes: { style: `font-size: ${sizes[level]}; color: ${colors[level]}; font-weight: bold` }
                    })
                )
            }
        });

        return builder.finish();
    }
}, { decorations: v => v.decorations });

const codeBlockPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
        const builder = new RangeSetBuilder();
        const { state } = view;
        const selection = state.selection.main;

        syntaxTree(state).iterate({
            enter(node) {
                if (node.name !== 'FencedCode') return;

                const cursorInBlock = selection.from >= node.from && selection.from <= node.to;
                const text = state.doc.sliceString(node.from, node.to);
                const openFenceStart = node.from;
                const openFenceEnd = node.from + text.indexOf('\n');
                const closeFenceStart = node.from + text.lastIndexOf('\n') + 1;
                const closeFenceEnd = node.to;

                if (!cursorInBlock) {
                    builder.add(openFenceStart, openFenceStart+3, Decoration.replace({}));
                }

                for (let pos = openFenceEnd+1; pos <= closeFenceStart-1;) {
                    const line = state.doc.lineAt(pos);
                    builder.add(line.from, line.from, Decoration.line({
                        class: 'cm-codeblock-line'
                    }));
                    pos = line.to + 1;
                }
                
                if (!cursorInBlock) {
                    builder.add(closeFenceStart, closeFenceEnd, Decoration.replace({}));
                }
            }
        });

        return builder.finish();
    }
}, { decorations: v => v.decorations });

const Editor = ({path, tabId, activeTab}) => {
    const editorParent = useRef(null);
    let saveTimer = useRef(null);

    const editorTheme = EditorView.theme({
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
        ".cm-codeblock-line": {
            backgroundColor: "#1a1a1a",
            borderLeft: "2px solid #aee7cb"
        },
        ".cm-activeLine": {
            backgroundColor: "#242424"
        },
        ".cm-cursor": {
            borderLeftColor: "#8f8f8f"
        },
    }, { dark: true });

    //console.log('Editor path:', path, 'tabId:', tabId, 'activeTab:', activeTab);
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
                    keymap.of([defaultKeymap, indentWithTab, historyKeymap, closeBracketsKeymap]),
                    //lineNumbers(),
                    highlightActiveLine(),
                    highlightSpecialChars(),
                    EditorView.lineWrapping,
                    syntaxHighlighting(editorHighlightStyle),
                    bracketMatching(),
                    indentOnInput(),
                    history(),
                    closeBrackets(),
                    markdown({
                        codeLanguages: languages
                    }),
                    headingPlugin,
                    codeBlockPlugin,
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
        <div ref={editorParent} className={`grow-1 max-w-2xl overflow-hidden my-10 mx-10 text-(--color-text) ${tabId === activeTab ? '' : 'hidden'}`}>
        </div>
    );
}

export default Editor;
