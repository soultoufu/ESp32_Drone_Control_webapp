import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';

// Set the language
Blockly.setLocale(En);

interface BlocklyComponentProps {
    initialXml?: string;
    onCodeChange?: (code: string) => void;
    onXmlChange?: (xml: string) => void;
}

export const BlocklyComponent: React.FC<BlocklyComponentProps> = ({
    initialXml,
    onCodeChange,
    onXmlChange,
}) => {
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspace = useRef<Blockly.WorkspaceSvg | null>(null);

    useEffect(() => {
        if (!blocklyDiv.current) return;

        // Define the toolbox
        const toolbox = {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: 'Flight Control',
                    colour: '#4a90e2',
                    contents: [
                        { kind: 'block', type: 'drone_takeoff' },
                        { kind: 'block', type: 'drone_land' },
                        { kind: 'block', type: 'drone_emergency_stop' },
                    ],
                },
                {
                    kind: 'category',
                    name: 'Movement',
                    colour: '#5ba55b',
                    contents: [
                        {
                            kind: 'block',
                            type: 'drone_move',
                            inputs: {
                                DURATION: {
                                    shadow: { type: 'math_number', fields: { NUM: 1 } }
                                }
                            }
                        },
                        {
                            kind: 'block',
                            type: 'drone_yaw',
                            inputs: {
                                DEGREES: {
                                    shadow: { type: 'math_number', fields: { NUM: 90 } }
                                }
                            }
                        },
                        {
                            kind: 'block',
                            type: 'drone_delay',
                            inputs: {
                                DURATION: {
                                    shadow: { type: 'math_number', fields: { NUM: 1 } }
                                }
                            }
                        }
                    ],
                },
                {
                    kind: 'category',
                    name: 'Logic',
                    colour: '#5C81A6',
                    contents: [
                        { kind: 'block', type: 'controls_if' },
                        { kind: 'block', type: 'logic_compare' },
                        { kind: 'block', type: 'logic_operation' },
                        { kind: 'block', type: 'logic_negate' },
                        { kind: 'block', type: 'logic_boolean' },
                    ],
                },
                {
                    kind: 'category',
                    name: 'Loops',
                    colour: '#5CA65C',
                    contents: [
                        {
                            kind: 'block',
                            type: 'controls_repeat_ext',
                            inputs: {
                                TIMES: { shadow: { type: 'math_number', fields: { NUM: 5 } } }
                            }
                        },
                        { kind: 'block', type: 'controls_whileUntil' }
                    ],
                },
                {
                    kind: 'category',
                    name: 'Math',
                    colour: '#5b67a5',
                    contents: [
                        { kind: 'block', type: 'math_number' },
                        { kind: 'block', type: 'math_arithmetic' },
                    ],
                },
            ],
        };

        // Initialize workspace
        if (!workspace.current) {
            workspace.current = Blockly.inject(blocklyDiv.current, {
                toolbox: toolbox,
                grid: {
                    spacing: 20,
                    length: 3,
                    colour: '#ccc',
                    snap: true,
                },
                zoom: {
                    controls: true,
                    wheel: true,
                    startScale: 1.0,
                    maxScale: 3,
                    minScale: 0.3,
                    scaleSpeed: 1.2,
                    pinch: true
                },
                trashcan: true,
                move: {
                    scrollbars: true,
                    drag: true,
                    wheel: true
                },
                theme: Blockly.Themes.Dark,
                renderer: 'zelos'
            });

            if (initialXml) {
                Blockly.Xml.domToWorkspace(
                    Blockly.utils.xml.textToDom(initialXml),
                    workspace.current
                );
            }
        }

        // Resize handler
        const resizeObserver = new ResizeObserver(() => {
            if (workspace.current) {
                Blockly.svgResize(workspace.current);
            }
        });

        resizeObserver.observe(blocklyDiv.current);

        // Listeners
        const changeListener = () => {
            if (!workspace.current) return;

            // Trigger code generation in parent
            if (onCodeChange) {
                onCodeChange("");
            }

            if (onXmlChange) {
                const xml = Blockly.Xml.workspaceToDom(workspace.current);
                onXmlChange(Blockly.Xml.domToText(xml));
            }
        };

        workspace.current.addChangeListener(changeListener);

        return () => {
            if (workspace.current) {
                workspace.current.dispose();
                workspace.current = null;
            }
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div
            ref={blocklyDiv}
            style={{ width: '100%', height: '100%' }}
        />
    );
};
