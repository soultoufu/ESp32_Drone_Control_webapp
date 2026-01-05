import { pythonGenerator } from 'blockly/python';
import * as Blockly from 'blockly/core';

// Ensure the generator processes the custom blocks
export const initPythonGenerator = () => {

    // Header for the generated code - imports
    // We can prepend this to the generated code later, or define it here

    // @ts-ignore
    pythonGenerator.forBlock['drone_takeoff'] = function (block, generator) {
        return 'drone.takeoff()\n';
    };

    // @ts-ignore
    pythonGenerator.forBlock['drone_land'] = function (block, generator) {
        return 'drone.land()\n';
    };

    // @ts-ignore
    pythonGenerator.forBlock['drone_emergency_stop'] = function (block, generator) {
        return 'drone.emergency_stop()\n';
    };

    // @ts-ignore
    pythonGenerator.forBlock['drone_move'] = function (block, generator) {
        // @ts-ignore
        const direction = block.getFieldValue('DIRECTION');
        // @ts-ignore
        const duration = generator.valueToCode(block, 'DURATION', 0) || '0';
        return `drone.move('${direction}', ${duration})\n`;
    };

    // @ts-ignore
    pythonGenerator.forBlock['drone_yaw'] = function (block, generator) {
        // @ts-ignore
        const direction = block.getFieldValue('DIRECTION');
        // @ts-ignore
        const degrees = generator.valueToCode(block, 'DEGREES', 0) || '0';
        const finalDegrees = direction === 'cw' ? degrees : -degrees;
        return `drone.rotate(${finalDegrees})\n`;
    };

    // @ts-ignore
    pythonGenerator.forBlock['drone_delay'] = function (block, generator) {
        // @ts-ignore
        const duration = generator.valueToCode(block, 'DURATION', 0) || '0';
        return `time.sleep(${duration})\n`;
    };
};

export const generateCode = (workspace: Blockly.Workspace) => {
    // Add standard imports and telemetry background loop
    const standardImports = `import drone
import time
import _thread
import json

# Background telemetry reporter
def telemetry_loop():
    while True:
        try:
            data = {
                "type": "telemetry",
                "battery": drone.get_battery(),
                "height": drone.get_altitude(),
                "speed": drone.get_speed(),
                "state": drone.get_state(),
                "gyro": drone.get_gyro()
            }
            print(json.dumps(data))
        except:
            pass
        time.sleep(1)

_thread.start_new_thread(telemetry_loop, ())

`;
    const code = pythonGenerator.workspaceToCode(workspace);
    return standardImports + code;
};
