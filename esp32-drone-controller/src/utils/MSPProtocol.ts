/**
 * MSP v1 (MultiWii Serial Protocol) encoder/decoder.
 *
 * Packet format:
 *   Request:  $ M <  [length:1B]  [cmd:1B]  [payload:N bytes]  [checksum:1B = XOR(len,cmd,payload)]
 *   Response: $ M >  [length:1B]  [cmd:1B]  [payload:N bytes]  [checksum:1B]
 *
 * Used by both INAV and Betaflight.
 */

export const MSP_CMD = {
    STATUS:     101,
    ATTITUDE:   108,
    ALTITUDE:   109,
    ANALOG:     110,
    SET_RAW_RC: 200,
} as const;

/** RC channel indices (0-based, AETR layout used by INAV/Betaflight). */
export const RC = {
    ROLL:     0,
    PITCH:    1,
    THROTTLE: 2,
    YAW:      3,
    ARM:      4,   // AUX1
    MODE:     5,   // AUX2 — set ANGLE mode range in FC configurator
    // Values
    CENTER:         1500,
    MIN:            1000,
    MAX:            2000,
    ARM_ON:         1800,
    ARM_OFF:        1000,
    // Flight tuning defaults (edit here to tune your drone)
    HOVER_THROTTLE: 1550,
    MOVE_AMOUNT:    100,  // μs offset for pitch/roll
    YAW_AMOUNT:     150,  // μs offset for yaw
    VERT_AMOUNT:    80,   // μs offset for throttle during up/down moves
} as const;

// Battery estimation — 3S LiPo defaults
const CELL_MIN_V = 3.3;
const CELL_MAX_V = 4.2;
const CELL_COUNT = 3;
const PACK_MIN_V = CELL_MIN_V * CELL_COUNT; // 9.9 V
const PACK_MAX_V = CELL_MAX_V * CELL_COUNT; // 12.6 V

export class MSPProtocol {
    /**
     * Build a complete MSP v1 request packet.
     * @param cmd     MSP command code
     * @param payload Optional payload bytes (omit for read requests)
     */
    static buildPacket(cmd: number, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
        const len = payload.length;
        const packet = new Uint8Array(6 + len);
        packet[0] = 0x24; // '$'
        packet[1] = 0x4D; // 'M'
        packet[2] = 0x3C; // '<'
        packet[3] = len;
        packet[4] = cmd;
        let checksum = len ^ cmd;
        for (let i = 0; i < len; i++) {
            packet[5 + i] = payload[i];
            checksum ^= payload[i];
        }
        packet[5 + len] = checksum;
        return packet;
    }

    /**
     * Build MSP_SET_RAW_RC (cmd 200).
     * Packs up to 16 channels as uint16 LE. Arrays shorter than 16 are padded with 1500.
     */
    static buildSetRawRC(channels: number[]): Uint8Array {
        const count = 16;
        const payload = new Uint8Array(count * 2);
        const view = new DataView(payload.buffer);
        for (let i = 0; i < count; i++) {
            const val = i < channels.length ? Math.max(1000, Math.min(2000, channels[i])) : 1500;
            view.setUint16(i * 2, val, true); // little-endian
        }
        return this.buildPacket(MSP_CMD.SET_RAW_RC, payload);
    }

    /** Build a zero-payload read request (e.g. MSP_STATUS, MSP_ATTITUDE). */
    static buildRequest(cmd: number): Uint8Array {
        return this.buildPacket(cmd);
    }

    /**
     * Parse an MSP v1 response from a Uint8Array buffer.
     * Scans for the `$M>` preamble and validates the checksum.
     * Returns null if the buffer doesn't contain a valid complete response.
     */
    static parseResponse(data: Uint8Array): { cmd: number; payload: Uint8Array } | null {
        for (let i = 0; i <= data.length - 6; i++) {
            if (data[i] !== 0x24 || data[i + 1] !== 0x4D || data[i + 2] !== 0x3E) continue;
            const len = data[i + 3];
            const cmd = data[i + 4];
            if (i + 6 + len > data.length) return null; // incomplete
            const payload = data.slice(i + 5, i + 5 + len);
            let checksum = len ^ cmd;
            for (const b of payload) checksum ^= b;
            if (checksum !== data[i + 5 + len]) continue; // bad checksum
            return { cmd, payload };
        }
        return null;
    }

    /** Parse MSP_ATTITUDE response payload → roll/pitch/yaw in degrees. */
    static parseAttitude(payload: Uint8Array): { roll: number; pitch: number; yaw: number } {
        const view = new DataView(payload.buffer, payload.byteOffset);
        return {
            roll:  view.getInt16(0, true) / 10,
            pitch: view.getInt16(2, true) / 10,
            yaw:   view.getUint16(4, true),
        };
    }

    /** Parse MSP_ALTITUDE response payload → altitude in metres. */
    static parseAltitude(payload: Uint8Array): number {
        const view = new DataView(payload.buffer, payload.byteOffset);
        return view.getInt32(0, true) / 100;
    }

    /** Parse MSP_ANALOG response payload → voltage (V) and battery % (3S estimate). */
    static parseAnalog(payload: Uint8Array): { voltage: number; battery: number } {
        const voltage = payload[0] / 10;
        const battery = Math.round(
            Math.max(0, Math.min(100, (voltage - PACK_MIN_V) / (PACK_MAX_V - PACK_MIN_V) * 100))
        );
        return { voltage, battery };
    }

    /** Parse MSP_STATUS response payload → armed state. */
    static parseStatus(payload: Uint8Array): { armed: boolean } {
        // Byte 6 onwards: flight mode flags uint32 — bit 0 = armed
        if (payload.length < 10) return { armed: false };
        const view = new DataView(payload.buffer, payload.byteOffset);
        const flags = view.getUint32(6, true);
        return { armed: (flags & 1) !== 0 };
    }
}
