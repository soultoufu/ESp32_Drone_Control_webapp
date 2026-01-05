import * as Blockly from 'blockly/core';

// Define blocks
export const defineCustomBlocks = () => {
    // --- FLIGHT CONTROL ---
    Blockly.Blocks['drone_takeoff'] = {
        init: function () {
            this.jsonInit({
                "type": "drone_takeoff",
                "message0": "Takeoff 🛫",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160,
                "tooltip": "Command the drone to take off",
                "helpUrl": ""
            });
        }
    };

    Blockly.Blocks['drone_land'] = {
        init: function () {
            this.jsonInit({
                "type": "drone_land",
                "message0": "Land 🛬",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160,
                "tooltip": "Command the drone to land",
                "helpUrl": ""
            });
        }
    };

    Blockly.Blocks['drone_emergency_stop'] = {
        init: function () {
            this.jsonInit({
                "type": "drone_emergency_stop",
                "message0": "🚨 EMERGENCY STOP",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 0,
                "tooltip": "Immediately stop all motors",
                "helpUrl": ""
            });
        }
    };

    // --- MOVEMENT ---
    Blockly.Blocks['drone_move'] = {
        init: function () {
            this.jsonInit({
                "type": "drone_move",
                "message0": "Move %1 for %2 seconds",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "DIRECTION",
                        "options": [
                            ["Forward ⬆️", "forward"],
                            ["Backward ⬇️", "backward"],
                            ["Left ⬅️", "left"],
                            ["Right ➡️", "right"],
                            ["Up ⤴️", "up"],
                            ["Down ⤵️", "down"]
                        ]
                    },
                    {
                        "type": "input_value",
                        "name": "DURATION",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 260,
                "tooltip": "Move in direction for duration",
                "helpUrl": ""
            });
        }
    };

    Blockly.Blocks['drone_yaw'] = {
        init: function () {
            this.jsonInit({
                "type": "drone_yaw",
                "message0": "Rotate %1 %2 degrees",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "DIRECTION",
                        "options": [
                            ["Right (CW) ↻", "cw"],
                            ["Left (CCW) ↺", "ccw"]
                        ]
                    },
                    {
                        "type": "input_value",
                        "name": "DEGREES",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 260,
                "tooltip": "Rotate the drone",
                "helpUrl": ""
            });
        }
    };

    Blockly.Blocks['drone_delay'] = {
        init: function () {
            this.jsonInit({
                "type": "drone_delay",
                "message0": "Wait %1 seconds ⏱️",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "DURATION",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 210,
                "tooltip": "Pause execution",
                "helpUrl": ""
            });
        }
    };
};
