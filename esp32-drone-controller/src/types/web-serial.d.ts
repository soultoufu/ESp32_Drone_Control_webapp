// Basic type definitions for Web Serial API
interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
}

interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
}

interface Navigator {
    serial: {
        requestPort(options?: { filters: Array<{ usbVendorId?: number; usbProductId?: number }> }): Promise<SerialPort>;
        getPorts(): Promise<SerialPort[]>;
    };
}
