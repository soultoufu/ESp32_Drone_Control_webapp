import { javascriptGenerator } from 'blockly/javascript';
import * as Blockly from 'blockly/core';

export const initSimGenerator = () => {
    // @ts-ignore
    javascriptGenerator.forBlock['drone_takeoff'] = function (block) {
        return JSON.stringify({ type: 'takeoff' }) + ',\n';
    };

    // @ts-ignore
    javascriptGenerator.forBlock['drone_land'] = function (block) {
        return JSON.stringify({ type: 'land' }) + ',\n';
    };

    // @ts-ignore
    javascriptGenerator.forBlock['drone_move'] = function (block, generator) {
        const direction = block.getFieldValue('DIRECTION');
        // Map block direction to simulator command type
        const typeMap: Record<string, string> = {
            'forward': 'move_forward',
            'backward': 'move_backward',
            'left': 'move_left',
            'right': 'move_right',
            'up': 'move_up',
            'down': 'move_down'
        };
        const duration = generator.valueToCode(block, 'DURATION', 0) || '100';
        return JSON.stringify({ type: typeMap[direction], value: Number(duration) }) + ',\n';
    };

    // @ts-ignore
    javascriptGenerator.forBlock['drone_delay'] = function (block, generator) {
        const duration = generator.valueToCode(block, 'DURATION', 0) || '1';
        return JSON.stringify({ type: 'delay', value: Number(duration) * 1000 }) + ',\n';
    };
};

export const generateSimCommands = (workspace: Blockly.Workspace) => {
    const code = javascriptGenerator.workspaceToCode(workspace);
    // Wrap in brackets to make it a valid JSON array (after removing trailing comma)
    const jsonStr = `[${code.trim().replace(/,\s*$/, '')}]`;
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse sim commands", e, jsonStr);
        return [];
    }
};
