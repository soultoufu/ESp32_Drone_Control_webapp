import * as Blockly from 'blockly/core';
import type { SimulatorCommand } from '../../types/simulator';

export const initSimGenerator = () => {
    console.log('Simulator command generator initialized');
};

// Bug 4 fix: refactored into a reusable chain walker so loop body blocks
// can be parsed with the same logic as top-level sequences.
function parseBlockChain(block: Blockly.Block | null): SimulatorCommand[] {
    const commands: SimulatorCommand[] = [];
    let current: Blockly.Block | null = block;
    while (current) {
        const parsed = parseBlock(current);
        if (Array.isArray(parsed)) {
            commands.push(...parsed);
        } else if (parsed) {
            commands.push(parsed);
        }
        current = current.getNextBlock();
    }
    return commands;
}

export const generateSimCommands = (workspace: Blockly.Workspace): SimulatorCommand[] => {
    const commands: SimulatorCommand[] = [];
    const topBlocks = workspace.getTopBlocks(true);
    for (const block of topBlocks) {
        commands.push(...parseBlockChain(block));
    }
    return commands;
};

// Returns a single command, an array of commands (for loops), or null.
function parseBlock(block: Blockly.Block): SimulatorCommand | SimulatorCommand[] | null {
    const type = block.type;

    switch (type) {
        case 'drone_takeoff':
            return { type: 'takeoff' };

        case 'drone_land':
            return { type: 'land' };

        // Bug 5 fix: emergency_stop was missing and silently ignored
        case 'drone_emergency_stop':
            return { type: 'emergency_stop' };

        case 'drone_move': {
            const direction = block.getFieldValue('DIRECTION') as string;
            const durationBlock = block.getInputTargetBlock('DURATION');
            // value = seconds (matches block label "Move for N seconds").
            // Default 2 → 2 s × 1 m/s = 2 m — clearly visible in the simulator.
            const duration = durationBlock ? Number(durationBlock.getFieldValue('NUM')) || 2 : 2;

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

            return { type: direction === 'cw' ? 'turn_right' : 'turn_left', value: degrees };
        }

        case 'drone_delay': {
            const durationBlock = block.getInputTargetBlock('DURATION');
            const duration = durationBlock ? Number(durationBlock.getFieldValue('NUM')) || 1 : 1;
            return { type: 'delay', value: duration * 1000 };
        }

        // Bug 4 fix: handle repeat loop — unroll exactly N times
        case 'controls_repeat_ext': {
            const timesBlock = block.getInputTargetBlock('TIMES');
            const times = timesBlock ? Math.max(0, Math.round(Number(timesBlock.getFieldValue('NUM')) || 0)) : 0;
            const bodyBlock = block.getInputTargetBlock('DO');
            const bodyCommands = parseBlockChain(bodyBlock);
            const result: SimulatorCommand[] = [];
            for (let i = 0; i < times; i++) {
                result.push(...bodyCommands);
            }
            return result;
        }

        // Bug 4 fix: while/until — unroll up to 10 iterations as a preview
        case 'controls_whileUntil': {
            console.warn('[SimGenerator] controls_whileUntil cannot be fully simulated. Showing up to 10 iterations.');
            const bodyBlock = block.getInputTargetBlock('DO');
            const bodyCommands = parseBlockChain(bodyBlock);
            const result: SimulatorCommand[] = [];
            for (let i = 0; i < 10; i++) {
                result.push(...bodyCommands);
            }
            return result;
        }

        default:
            return null;
    }
}
