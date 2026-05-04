import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, ViewPlugin, Decoration, ViewUpdate } from '@codemirror/view';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';

interface Options {
  doc: string;
  onChange?: (value: string) => void;
}

const hideHeaderHashes = ViewPlugin.fromClass(
  class {
    decorations: any;
    constructor(view: any) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: any) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: any) {
      const builder = new RangeSetBuilder();
      const cursorLine = view.state.doc.lineAt(
        view.state.selection.main.head
      ).number;

      for (const { from, to } of view.visibleRanges) {
        let pos = from;
        while (pos <= to) {
          const line = view.state.doc.lineAt(pos);

          // Skip the active (cursor) line
          if (line.number !== cursorLine) {
            const match = line.text.match(/^(#{1,6})\s/);
            if (match) {
              // Hide the hashes + the space after them
              builder.add(
                line.from,
                line.from + match[1].length + 1,
                Decoration.replace({})
              );
            }
          }

          pos = line.to + 1;
        }
      }

      return builder.finish();
    }
  },
  { decorations: (v) => v.decorations }
);

export function useCodeMirror({ doc, onChange }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const headerHighlight = HighlightStyle.define([
    { tag: tags.heading1, color:"#6f9626", fontSize: "32px", fontWeight: "bold" },
    { tag: tags.heading2, color:"#0f6e12", fontSize: "24px", fontWeight: "bold" },
    { tag: tags.heading3, color:"#1f9c85", fontSize: "20px", fontWeight: "bold" },
  ]);


  const myTheme = EditorView.baseTheme({
    "&": {
      color: "#dedede"
    },
    "&.cm-editor": {
      height: "100%"
    },
    "&.cm-focused": {
      outline: "none"
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(91, 113, 225, 0.1)"
    },
    ".cm-gutters": {
      background: "none",
      border: "none",
    },
    ".cm-gutterElement": {
      display: "flex",
      alignItems: "center"
    }
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          history(),
          bracketMatching(),
          syntaxHighlighting(headerHighlight, { fallback: true }),
          markdown(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              onChange?.(update.state.doc.toString());
            }
          }),
          myTheme,
          hideHeaderHashes
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();          // ← critical: cleans up DOM listeners on unmount
      viewRef.current = null;
    };
  }, []); // empty deps — create once, never recreate

  // Sync external doc changes without recreating the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === doc) return; // avoid cursor-jump on own edits

    view.dispatch({
      changes: { from: 0, to: current.length, insert: doc },
    });
  }, [doc]);

  return containerRef;
}