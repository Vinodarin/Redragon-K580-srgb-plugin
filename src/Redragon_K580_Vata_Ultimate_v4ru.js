/* --- СЛОЙ 1: БИБЛИОТЕКА И ДАННЫЕ --- */
const deviceLibrary = {
	"Redragon K580 Vata": {
		name: "Redragon K580 Vata",
		image: "https://assets.signalrgb.com/devices/brands/redragon/keyboards/k580.png",
		vLedNames: [
			"Left strip 1",																																															"Right strip 1",
			"Left strip 2",	"Esc",     "F1", "F2", "F3", "F4",   "F5", "F6", "F7", "F8",    "F9", "F10", "F11", "F12",		"Print Screen",	"Scroll Lock",	"Pause Break", 											"Right strip 2",
			"Left strip 3",	"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",				"Insert",		"Home",			"Page Up",		"NumLock", "Num /", "Num *", "Num -", 	"Right strip 3",
			"Left strip 4",	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",						"Del",			"End",			"Page Down",	"Num 7", "Num 8", "Num 9", "Num +", 	"Right strip 4",
			"Left strip 5",	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", 			 "Enter",															"Num 4", "Num 5", "Num 6", 				"Right strip 5",
			"Left strip 6",	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", 	  "Right Shift",							"Up Arrow",						"Num 1", "Num 2", "Num 3", "Num Enter", "Right strip 6",
			"Left strip 7",	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",			"Left Arrow",	"Down Arrow",	"Right Arrow",	"Num 0",		  "Num .", 				"Right strip 7",
			"Left strip 8",																																															"Right strip 8",
		],
		vLeds:  [
			7, 																										127,
			15,   0,      8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96,    104, 112, 120,							119,
			23,   1,  9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,   113, 121, 129,    128, 136, 137, 138,	111,
			31,   2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,   114, 122, 130,    115, 123, 131, 139,	103,
			39,   3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91,     107,					  124, 132, 140,		95,
			47,   4,     20, 28, 36, 44, 52, 60, 68, 76, 84, 92,	108,         116,		  109, 117, 125, 133,	87,
			55,   5, 13, 21,                 29,           37, 45, 53, 61,    69, 77, 85,      93,      101,		79,
			63,																										71,
		],
		vLedPositions: [
			[0, 0],																																															[22, 0], //2
			[0, 1], [1, 1],			[3, 1], [4, 1], [5, 1], [6, 1],	[7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],	[15, 1], [16, 1], [17, 1],										[22, 1], //23
			[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],	[15, 2], [16, 2], [17, 2],	[18, 2], [19, 2], [20, 2], [21, 2], [22, 2], //24
			[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], 	[15, 3], [16, 3], [17, 3],	[18, 3], [19, 3], [20, 3], [21, 3], [22, 3], //24
			[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], 			[14, 4],								[18, 4], [19, 4], [20, 4],			[22, 4], //19
			[0, 5], 		[2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], 			[14, 5],			 [16, 5],			[18, 5], [19, 5], [20, 5], [21, 5], [22, 5], //19
			[0, 6], [1, 6], [2, 6], [3, 6],					[6, 6],									 [11, 6], [12, 6], [13, 6], [14, 6],	[15, 6], [16, 6], [17, 6], 	[18, 6],		  [20, 6],			[22, 7],
			[0, 7],																																															[22, 7],
		],
		size: [24, 8],
		endpoint: [{ "interface": 1, "usage": 0x0092, "usage_page": 0xFF1C, "collection": 0x0004 }]
	},
	"None": {
		name: "EVision Device",
		image: "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png",
		layout:	"None",
	}
}

/* --- СЛОЙ 2: ПРОТОКОЛ EVISION --- */
class EvisionProtocol {
    constructor() {
        this.prevParams = {};
        this.totalPacketsSent = 0;
    }

    calculateChecksum(data, index, bytesToSend) {
        const sum = data.reduce((a, b) => a + b, 0);
        const magic = (index >= 5) ? ((index - 5) * bytesToSend + 99) : (index * bytesToSend + 74);
        const val = sum + magic;
        return { high: (val >>> 8) & 0xFF, low: val & 0xFF };
    }

    getHighLow(val) {
        return { high: (val >>> 8) & 0xFF, low: val & 0xFF };
    }

    writePacket(index, data, bytesToSend, useChecksum, pauseTime) {
        while (data.length < bytesToSend) { data.push(0); }
        
        const bytesSent = this.getHighLow(index * bytesToSend);
        const checksum = useChecksum ? this.calculateChecksum(data, index, bytesToSend) : { low: 0, high: 0 };
        
        const header = [0x04, checksum.low, checksum.high, 0x12, bytesToSend, bytesSent.low, bytesSent.high, 0x00];
        const packet = header.concat(data);

        device.write(packet, 64);
        device.pause(pauseTime);
    }
}

/* --- СЛОЙ 3: ДВИЖОК ПЛАГИНА (Engine) --- */
class KeyboardEngine {
    constructor(protocol, library) {
        this.protocol = protocol;
        this.library = library;
        this.currentModel = null;
        this.renderNotified = false;
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    updateModel(modelName) {
        if (modelName === "None") {
            this.currentModel = null;
            return;
        }
        const props = this.library[modelName];
        if (props) {
            this.currentModel = props;
            device.setName(props.name);
            device.setImageFromUrl(props.image);
            device.setSize(props.size);
            device.setControllableLeds(props.vLedNames, props.vLedPositions);
            
            // Поиск эндпоинта
            const hid = device.getHidEndpoints();
            const target = props.endpoint[0];
            const found = hid.find(e => e.interface === target.interface && e.usage === target.usage);
            
            if (found) {
                device.set_endpoint(found.interface, found.usage, found.usage_page, found.collection);
            }
        }
    }

    render() {
        if (!this.currentModel) return;

        const RGBData = [];
        const { vLeds, vLedPositions } = this.currentModel;

        for (let i = 0; i < vLeds.length; i++) {
            const [px, py] = vLedPositions[i];
            let color = (LightingMode === "Forced") ? this.hexToRgb(forcedColor) : device.color(px, py);

            if (monochrome) {
                let v;
                if (monochromeMode === "Average") v = (color[0] + color[1] + color[2]) / 3;
                else if (monochromeMode === "Luma") v = 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
                else v = Math.max(...color);
                color = [v, v, v];
            }

            const idx = vLeds[i] * 3;
            RGBData[idx] = color[0];
            RGBData[idx + 1] = color[1];
            RGBData[idx + 2] = color[2];
        }

        const bSize = packetSize || 48;
        const pPause = packetPause || 3;
        const count = Math.ceil(RGBData.length / bSize);

        for (let i = 0; i < count; i++) {
            this.protocol.writePacket(i, RGBData.slice(i * bSize, i * bSize + bSize), bSize, useChecksum, pPause);
        }
    }
}

/* --- ИНИЦИАЛИЗАЦИЯ (SignalRGB API) --- */
const EVISION = new EvisionProtocol();
const Engine = new KeyboardEngine(EVISION, DeviceLibrary);

export function Name() { return "Redragon K580 Vata"; }
export function VendorId() { return 0x320F; }
export function ProductId() { return 0x5000; }

export function ControllableParameters() {
    return [
        {property:"forcedModel", group:"lighting", label:"Модель", type:"combobox", values: ["Redragon K580 Vata", "None"], default: "None"},
        {property:"LightingMode", group:"lighting", label:"Режим", type:"combobox", values:["Canvas", "Forced"], default:"Canvas"},
        {property:"forcedColor", group:"lighting", label:"Принудительный цвет", type:"color", default:"#FF0000"},
        {property:"monochrome", group:"lighting", label:"Монохром", type:"boolean", default:false},
        {property:"monochromeMode", group:"lighting", label:"Яркость монохрома", type:"combobox", values:["Max", "Average", "Luma"], default:"Max"},
        {property:"packetSize", group:"settings", label:"Размер пакета", type:"combobox", values:[24, 32, 48], default:48},
        {property:"packetPause", group:"settings", label:"Пауза (мс)", type:"combobox", values:[1, 2, 3, 5, 10], default:3},
        {property:"useChecksum", group:"settings", label:"Чексумма", type:"boolean", default:true},
    ];
}

export function Initialize() { Engine.updateModel(forcedModel); }
export function Render() { Engine.render(); }
export function onforcedModelChanged() { Engine.updateModel(forcedModel); }
