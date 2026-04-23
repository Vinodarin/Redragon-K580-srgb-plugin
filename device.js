export default class RedragonK580 extends Device {
    constructor() {
        super();

        this.name = "Redragon K580";
        this.vendorId = 0x320F;
        this.productId = 0x5000;

        this.endpoint = 0; // Control endpoint
        this.reportId = 0x04;

        this.packetSize = 64;
        this.fps = 30;
        this.pause = 0;
    }

    async initialize() {
        await this.device.open();
        await this.device.claimInterface(1);
    }

    buildPacket(r, g, b) {
        const packet = new Uint8Array(64);

        // Заголовок (точно восстановленный из твоих пакетов)
        packet[0] = 0x04; // Report ID
        packet[1] = 0x0B; // режим статического цвета
        packet[2] = 0x03;
        packet[3] = 0x06;
        packet[4] = 0x03;
        packet[5] = 0x05;
        packet[6] = 0x00;
        packet[7] = 0x00;

        // RGB (байты 8–10)
        packet[8] = r;
        packet[9] = g;
        packet[10] = b;

        return packet;
    }

    async render() {
        const color = this.getAverageColor();
        const packet = this.buildPacket(color.r, color.g, color.b);

        await this.device.controlTransferOut({
            requestType: "class",
            recipient: "interface",
            request: 0x09, // SET_REPORT
            value: 0x0204, // Report Type = Output, Report ID = 4
            index: 1
        }, packet);
    }
}
