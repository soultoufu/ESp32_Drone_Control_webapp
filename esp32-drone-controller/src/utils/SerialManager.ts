export class SerialManager {
    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

    // Standard baud rate for ESP32 MicroPython
    private readonly BAUD_RATE = 115200;

    private onDataCallback: ((data: string) => void) | null = null;
    private buffer: string = "";

    constructor() { }

    onData(callback: (data: string) => void) {
        this.onDataCallback = callback;
    }

    async connect(): Promise<boolean> {
        if (!('serial' in navigator)) {
            alert('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
            return false;
        }

        try {
            // @ts-ignore - Navigator type extension might not be picked up immediately
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: this.BAUD_RATE });

            this.port = port;
            this.setupReader();
            this.setupWriter();

            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }
        if (this.writer) {
            await this.writer.close();
            this.writer = null;
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
    }

    private setupWriter() {
        if (!this.port || !this.port.writable) return;
        this.writer = this.port.writable.getWriter();
    }

    private async setupReader() {
        if (!this.port || !this.port.readable) return;

        // We might want to keep the stream locked, but for now we'll just read
        try {
            this.reader = this.port.readable.getReader();
        } catch (e) {
            // Already locked?
            console.warn("Reader might already be locked", e);
            return;
        }

        const decoder = new TextDecoder();

        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) break;

                const text = decoder.decode(value);
                this.buffer += text;

                // Process lines
                let newlineIndex;
                while ((newlineIndex = this.buffer.indexOf('\n')) >= 0) {
                    const line = this.buffer.slice(0, newlineIndex).trim();
                    this.buffer = this.buffer.slice(newlineIndex + 1);

                    if (line && this.onDataCallback) {
                        this.onDataCallback(line);
                    } else if (line) {
                        // Fallback log if no listener
                        console.log("[Serial]", line);
                    }
                }
            }
        } catch (error) {
            console.error('Read error:', error);
        } finally {
            this.reader.releaseLock();
        }
    }

    async write(data: string) {
        if (!this.writer) return;
        const encoder = new TextEncoder();
        await this.writer.write(encoder.encode(data));
    }

    /**
     * Uploads the python code to the ESP32 via MicroPython REPL.
     * Uses Raw REPL or Paste Mode.
     * Workflow:
     * 1. Ctrl+C (Interrupt)
     * 2. Ctrl+E (Enter Paste Mode)
     * 3. Send Code
     * 4. Ctrl+D (Finish Paste & Run)
     */
    async uploadCode(code: string) {
        if (!this.writer) throw new Error("Not connected");

        // Helper to delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        console.log("Starting upload...");

        // 1. Interrupt (Ctrl+C)
        await this.write('\x03');
        await delay(100);
        await this.write('\x03'); // Twice to be sure
        await delay(500);

        // 2. Enter Paste Mode (Ctrl+E)
        // Note: Some MicroPython versions use Raw REPL (Ctrl+A). Paste mode is simpler for now.
        await this.write('\x05');
        await delay(200);

        // 3. Send Code
        // We might need to chunk it if it's large, but for MVP send all
        // Fix newlines for serial
        const fixedCode = code.replace(/\n/g, '\r\n');
        await this.write(fixedCode);
        await delay(500); // Wait for transmission

        // 4. Finish Paste (Ctrl+D)
        await this.write('\x04');
        console.log("Upload complete. Running...");

        // 5. Optional: Soft Reset (Ctrl+D from normal REPL) if we want to reset state completely
        // For now, Paste mode runs it immediately.
    }
}

export const serialManager = new SerialManager();
