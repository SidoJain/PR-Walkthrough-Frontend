import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface DiffEditorProps {
    code: string;
    activeLine: number | null;
}

export default function DiffEditor({ code, activeLine }: DiffEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const decorationsRef = useRef<string[]>([]);
    const [isEditorReady, setIsEditorReady] = useState(false);

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        setIsEditorReady(true);
    };

    useEffect(() => {
        // Wait until the editor is fully ready before applying decorations
        if (!isEditorReady || !editorRef.current || !window.monaco) return;

        const editor = editorRef.current;
        const lines = code.split('\n');
        const newDecorations: editor.IModelDeltaDecoration[] = [];

        lines.forEach((line, index) => {
            const lineNumber = index + 1;

            if (line.startsWith('File: ')) {
                newDecorations.push({
                    range: new window.monaco.Range(lineNumber, 1, lineNumber, 1),
                    options: { isWholeLine: true, className: 'diff-file-header' },
                });
            } else if (line.startsWith('+')) {
                newDecorations.push({
                    range: new window.monaco.Range(lineNumber, 1, lineNumber, 1),
                    options: { isWholeLine: true, className: 'diff-addition' },
                });
            } else if (line.startsWith('-')) {
                newDecorations.push({
                    range: new window.monaco.Range(lineNumber, 1, lineNumber, 1),
                    options: { isWholeLine: true, className: 'diff-deletion' },
                });
            }
        });

        if (activeLine !== null) {
            newDecorations.push({
                range: new window.monaco.Range(activeLine, 1, activeLine, 1),
                options: {
                    isWholeLine: true,
                    className: 'diff-active-line',
                    zIndex: 10,
                },
            });
            // Ensure the first line is scrolled into view immediately
            editor.revealLineInCenter(activeLine);
        }

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    }, [code, activeLine, isEditorReady]); // Added isEditorReady to dependency array

    return (
        <div className="w-full h-full text-left relative monaco-no-select">
            <style>{`
            .diff-addition { background-color: rgba(46, 160, 67, 0.25) !important; }
            .diff-deletion { background-color: rgba(248, 81, 73, 0.25) !important; }
            .diff-file-header { background-color: rgba(255, 255, 255, 0.05) !important; }
            .diff-active-line {
                background-color: rgba(56, 139, 253, 0.35) !important;
                border-left: 4px solid #58a6ff !important;
            }
            .monaco-no-select .view-lines {
                user-select: none !important;
                pointer-events: none !important;
            }`}</style>

            <Editor
                height="100%"
                language="plaintext"
                theme="vs-dark"
                value={code}
                onMount={handleEditorDidMount}
                options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: 'on',
                    renderLineHighlight: 'none',
                    selectionHighlight: false,
                    contextmenu: false,
                    matchBrackets: 'never',
                }}
            />
        </div>
    );
}