/**
 * Redragon K580 Vata (Ultimate Edition)
 * Optimized for VS11K33A (VID: 320F, PID: 5000)
 * Based on official SignalRGB Plugin API 2026
 * Co-authored by Vinodarin & Dasha
 */

export function Name() { return "Redragon K580 Vata (Ultimate)"; }
export function DeviceId() { return "K580_320F_5000_V2"; }
export function Publisher() { return "Vinodarin & Dasha"; }

// Привязка к железу
export function ArrayOfPids() { return [0x5000]; }
export function ArrayOfVids() { return [0x320F]; }

export function Register() {
    // Согласно документации: UsagePage 0xff00, Usage 0x01 для EVision
    Registers.RegisterUsage(0xff00, 0x01);
}

export function ControllableParameters() {
	return [
		{"property":"lightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Direct", "Disabled"], "default":"Direct"},
	];
}

// Константы протокола
const CMD_INIT = [0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
const CMD_TERM = [0x04, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

export function Initialize() {
    // Документация рекомендует проверять, открыто ли устройство
    device.write([0x00].concat(CMD_INIT), 65);
    device.pause(20);
    device.write([0x00, 0x05, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], 65);
}

export function Render() {
    const rgbData = [];
    for (let i = 0; i < device.count(); i++) {
        const color = device.getRGB(i);
        rgbData.push(color.r, color.g, color.b);
    }
    sendPackets(rgbData);
}

function sendPackets(data) {
    let offset = 0;
    let packetIdx = 0;

    while (offset < data.length) {
        const packet = new Array(65).fill(0);
        packet[0] = 0x00; // Report ID
        packet[1] = 0x05; // Header
        packet[2] = packetIdx;

        for (let i = 0; i < 60 && (offset + i) < data.length; i++) {
            packet[i + 3] = data[offset + i];
        }

        device.write(packet, 65);
        offset += 60;
        packetIdx++;
    }
}

export function Uninitialize() {
    device.write([0x00].concat(CMD_TERM), 65);
}

// Карта светодиодов (Клавиши + Боковые полосы)
const vKeys = [
    ["Esc", [0, 0]], ["F1", [2, 0]], ["F2", [3, 0]], ["F3", [4, 0]], ["F4", [5, 0]], ["F5", [6, 0]], ["F6", [7, 0]], ["F7", [8, 0]], ["F8", [9, 0]], ["F9", [10, 0]], ["F10", [11, 0]], ["F11", [12, 0]], ["F12", [13, 0]], ["Prt", [14, 0]], ["Scr", [15, 0]], ["Pause", [16, 0]],
    ["~", [0, 1]], ["1", [1, 1]], ["2", [2, 1]], ["3", [3, 1]], ["4", [4, 1]], ["5", [5, 1]], ["6", [6, 1]], ["7", [7, 1]], ["8", [8, 1]], ["9", [9, 1]], ["0", [10, 1]], ["-", [11, 1]], ["=", [12, 1]], ["Back", [14, 1]], ["Ins", [14, 1]], ["Home", [15, 1]], ["PgUp", [16, 1]], ["NumLock", [17, 1]], ["/", [18, 1]], ["*", [19, 1]], ["-", [20, 1]],
    ["Tab", [0, 2]], ["Q", [1, 2]], ["W", [2, 2]], ["E", [3, 2]], ["R", [4, 2]], ["T", [5, 2]], ["Y", [6, 2]], ["U", [7, 2]], ["I", [8, 2]], ["O", [9, 2]], ["P", [10, 2]], ["[", [11, 2]], ["]", [12, 2]], ["\\", [13, 2]], ["Del", [14, 2]], ["End", [15, 2]], ["PgDn", [16, 2]], ["7", [17, 2]], ["8", [18, 2]], ["9", [19, 2]], ["+", [20, 2]],
    ["Caps", [0, 3]], ["A", [1, 3]], ["S", [2, 3]], ["D", [3, 3]], ["F", [4, 3]], ["G", [5, 3]], ["H", [6, 3]], ["J", [7, 3]], ["K", [8, 3]], ["L", [9, 3]], [";", [10, 3]], ["'", [11, 3]], ["Enter", [13, 3]], ["4", [17, 3]], ["5", [18, 3]], ["6", [19, 3]],
    ["LShift", [0, 4]], ["Z", [2, 4]], ["X", [3, 4]], ["C", [4, 4]], ["V", [5, 4]], ["B", [6, 4]], ["N", [7, 4]], ["M", [8, 4]], [",", [9, 4]], [".", [10, 4]], ["/", [11, 4]], ["RShift", [13, 4]], ["Up", [15, 4]], ["1", [17, 4]], ["2", [18, 4]], ["3", [19, 4]], ["Enter", [20, 4]],
    ["LCtrl", [0, 5]], ["LWin", [1, 5]], ["LAlt", [2, 5]], ["Space", [6, 5]], ["RAlt", [10, 5]], ["RWin", [11, 5]], ["Menu", [12, 5]], ["RCtrl", [13, 5]], ["Left", [14, 5]], ["Down", [15, 5]], ["Right", [16, 5]], ["0", [18, 5]], [".", [19, 5]],

    // Боковая подсветка
    ["L-Bar 1", [-1, 1]], ["L-Bar 2", [-1, 2]], ["L-Bar 3", [-1, 3]], ["L-Bar 4", [-1, 4]],
    ["R-Bar 1", [21, 1]], ["R-Bar 2", [21, 2]], ["R-Bar 3", [21, 3]], ["R-Bar 4", [21, 4]]
];

export function LedNames() { return vKeys.map(k => k[0]); }
export function LedPositions() { return vKeys.map(k => k[1]); }
