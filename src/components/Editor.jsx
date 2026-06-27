import { useEffect, useRef } from "react";
import { tags } from "@lezer/highlight";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars, ViewPlugin, Decoration, WidgetType } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, syntaxTree } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab, insertNewlineAndIndent } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import katex from "katex";
import "katex/dist/katex.min.css";
import { search, searchKeymap } from "@codemirror/search";

const editorHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, class: "text-(--color-tagKeyword)" },
    { tag: tags.comment, class: "text-(--color-tagComment)" },
    { tag: tags.string, class: "text-(--color-tagString)" },
    { tag: tags.number, class: "text-(--color-tagNumber)" },
    { tag: tags.variableName, class: "text-(--color-tagVariable)" },
    { tag: tags.function(tags.variableName), class: "text-(--color-tagFunction)" },
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

                builder.add(
                    node.from,
                    node.to,
                    Decoration.mark({
                        class: `cm-heading cm-heading-${level}`,
                        attributes: { style: `font-size: ${sizes[level]}; font-weight: bold` }
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

class KatexWidget extends WidgetType {
  constructor(latex, display) {
    super()
    this.latex = latex
    this.display = display
  }

  eq(other) {
    return other.latex === this.latex && other.display === this.display
  }

  toDOM() {
    const wrap = document.createElement("span")
    wrap.className = this.display ? "cm-katex-display" : "cm-katex-inline"
    try {
      katex.render(this.latex, wrap, {
        throwOnError: false,
        displayMode: this.display,
      })
    } catch {
      wrap.className = "cm-katex-error"
      wrap.textContent = this.latex
    }
    return wrap
  }

  ignoreEvent() { return false }
}


const latexPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.selectionSet) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
        const builder = new RangeSetBuilder()
        const text = view.state.doc.toString()
        const { head } = view.state.selection.main
        const activeLine = view.state.doc.lineAt(head).number

        const ranges = []

        // Display math: $$...$$ (must run before inline)
        const displayRe = /\$\$([^$]+?)\$\$/gs
        const displayRanges = []
        let m
        while ((m = displayRe.exec(text)) !== null) {
            displayRanges.push({ from: m.index, to: m.index + m[0].length })
            ranges.push({ from: m.index, to: m.index + m[0].length, latex: m[1], display: true })
        }

        const inlineRe = /\$([^$\n]+?)\$/g
        while ((m = inlineRe.exec(text)) !== null) {
            const from = m.index
            const to = m.index + m[0].length
            const overlaps = displayRanges.some(d => from < d.to && to > d.from)
            if (overlaps) continue;
            //if (text[index - 1] === "$" || text[index + m[0].length] === "$") continue
            ranges.push({ from, to, latex: m[1], display: false })
        }

        ranges.sort((a, b) => a.from - b.from)

        for (const r of ranges) {
            const spanStartLine = view.state.doc.lineAt(r.from).number
            const spanEndLine = view.state.doc.lineAt(r.to).number
            if (activeLine >= spanStartLine && activeLine <= spanEndLine) continue
            builder.add(r.from, r.to, Decoration.replace({ widget: new KatexWidget(r.latex, r.display) }))
        }

        return builder.finish()
    }
}, {decorations: v => v.decorations})

const getEditorContents = () => {
    return EditorView.state.doc.toString();
}

const Editor = ({ viewRefs, path, tabId, screenId }) => {
    const editorParent = useRef(null);
    let saveTimer = useRef(null);

    const editorTheme = EditorView.theme({
        "&.cm-editor": {
            width: "80%",
        },
        "&.cm-focused": {
            outline: "none"
        },
        ".cm-scroller": {
            overflow: "visible"
        },
        ".cm-gutters": {
            background: "none",
            border: "none",
            marginRight: "10px"
        }
    });

    //console.log('Editor path:', path, 'tabId:', tabId, 'activeTab:', activeTab);
    const viewRef = useRef(null);
    useEffect(() => {
        //console.log('useEffect fired, path:', path);
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
                    EditorView.editorAttributes.of({ class: "editorTheme" }),
                    keymap.of([defaultKeymap, searchKeymap, indentWithTab, historyKeymap, closeBracketsKeymap]),
                    //lineNumbers(),
                    highlightActiveLine(),
                    highlightSpecialChars(),
                    EditorView.lineWrapping,
                    syntaxHighlighting(editorHighlightStyle),
                    bracketMatching(),
                    indentOnInput(),
                    history(),
                    closeBrackets(),
                    search({ top: true }),
                    markdown({
                        codeLanguages: languages
                    }),
                    headingPlugin,
                    codeBlockPlugin,
                    latexPlugin,
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
        viewRefs.current.set(tabId, viewRef);
        viewRefs.current.set(screenId, viewRef);

        return () => {
            cancelled = true;
            clearTimeout(saveTimer.current);
            viewRef.current?.destroy();
            viewRefs.current.delete(tabId);
            viewRefs.current.delete(screenId);
        };
    }, [path]);

    return (
        <div ref={editorParent} className={`w-full flex scrollbar-gutter-stable scrollbar-thumb-(--color-secondary) scrollbar-track-transparent justify-center overflow-auto my-10 px-10 text-(--color-text)`}>
        </div>
    );
}

export default Editor;
