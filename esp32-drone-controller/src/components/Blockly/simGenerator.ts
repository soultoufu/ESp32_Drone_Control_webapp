import * as Blockly from 'blockly/core';
import type { SimulatorCommand } from '../../types/simulator';

// This generator creates simulator commands by parsing the workspace blocks directly
// instead of using Blockly's JavaScript generator (which has module resolution issues)

export const initSimGenerator = () => {
    // No initialization needed - we parse blocks directly
    console.log('Simulator command generator initialized');
};

export const generateSimCommands = (workspace: Blockly.Workspace): SimulatorCommand[] => {
    const commands: SimulatorCommand[] = [];

    // Get all top-level blocks in order
    const topBlocks = workspace.getTopBlocks(true);

    for (const block of topBlocks) {
        // Walk through the block chain
        let currentBlock: Blockly.Block | null = block;
        while (currentBlock) {
            const command = parseBlock(currentBlock);
            if (command) {
                commands.push(command);
            }
            currentBlock = currentBlock.getNextBlock();
        }
    }

    return commands;
};

function parseBlock(block: Blockly.Block): SimulatorCommand | null {
    const type = block.type;

    switch (type) {
        case 'drone_takeoff':
            return { type: 'takeoff' };

        case 'drone_land':
            return { type: 'land' };

        case 'drone_move': {
            const direction = block.getFieldValue('DIRECTION') as string;
            const durationBlock = block.getInputTargetBlock('DURATION');
            const duration = durationBlock ? Number(durationBlock.getFieldValue('NUM')) || 100 : 100;

            const typeMap: Record<string, SimulatorCommand['type']> = {
                'forward': 'move_forward',
                'backward': 'move_backward',
                'left': 'move_left',
                'right': 'move_right',
                'up': 'move_up',
                'down': 'move_down'
            };

            return { type: typeMap[direction] || 'move_forward', value: duration };
        }

        case 'drone_yaw': {
            const direction = block.getFieldValue('DIRECTION') as string;
            const degreesBlock = block.getInputTargetBlock('DEGREES');
            const degrees = degreesBlock ? Number(degreesBlock.getFieldValue('NUM')) || 90 : 90;

            if (direction === 'cw') {
                return { type: 'turn_right', value: degrees };
            } else {
                return { type: 'turn_left', value: degrees };
            }
        }

        case 'drone_delay': {
            const durationBlock = block.getInputTargetBlock('DURATION');
            const duration = durationBlock ? Number(durationBlock.getFieldValue('NUM')) || 1 : 1;
            return { type: 'delay', value: duration * 1000 };
        }

        default:
            // Unknown block type, skip it
            return null;
    }
}
