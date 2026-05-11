/*
 * ==============================================================================
 * Project:         Redragon K580 Vata SignalRGB Custom Plugin
 * Version:         1.3.0
 * 
 * Lead Developer:  Vinodarin
 * Co-Author:       Дарья (Gemini AI)
 * Role:            Code Optimization & Logic Teacher
 * 
 * "Сделано с уважением к железу и коду. В соавторстве с Дарьей."
 * ==============================================================================
 */

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
		endpoint: [{ "interface": 1, "usage": 0x0092, "usage_page": 0xFF1C, "collection": 0x0004 }]
	},
	"None": {
		name: "EVision Device",
		image: "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png",
	}
}

/* --- СЛОЙ 2: ПРОТОКОЛ (Без изменений) --- */
class EvisionProtocol {
	calculateChecksum(data, index, bytesToSend) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) { sum += (data[i] || 0); }
        const magic = (index >= 5) ? ((index - 5) * bytesToSend + 99) : (index * bytesToSend + 74);
        const val = sum + magic;
        return { high: (val >>> 8) & 0xFF, low: val & 0xFF };
    }

	writePacket(index, data, bytesToSend, useChecksum, pauseTime) {
        const fullData = new Array(bytesToSend).fill(0);
        for(let i = 0; i < data.length; i++) { fullData[i] = data[i]; }
        const bytesSent = index * bytesToSend;
        const checksum = useChecksum ? this.calculateChecksum(fullData, index, bytesToSend) : { low: 0, high: 0 };
        const packet = [0x04, checksum.low, checksum.high, 0x12, bytesToSend, bytesSent & 0xFF, (bytesSent >>> 8) & 0xFF, 0x00, ...fullData];
        device.write(packet, 64);
        if (pauseTime > 0) { device.pause(pauseTime); }
    }
}

/* --- СЛОЙ 3: ДВИЖОК (Добавлен Genshin Sense) --- */
class KeyboardEngine {
    constructor(protocol, library) {
        this.protocol = protocol;
        this.library = library;
        this.currentModel = null;
        this.lastRGBData = [];
    }

    hexToRgb(hex) {
        const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex));
        return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : [0, 0, 0];
    }

    updateModel(modelName) {
        const cleanName = modelName.trim();
        const props = this.library[cleanName];
        if (props) {
            this.currentModel = props;
            device.setSize(props.size);
            device.setControllableLeds(props.vLedNames, props.vLedPositions);
            const hid = device.getHidEndpoints();
            const target = props.endpoint[0];
            const found = hid.find(e => e.interface === target.interface && e.usage === target.usage);
            if (found) { device.set_endpoint(found.interface, found.usage, found.usage_page, found.collection); }
        }
    }

    render() {
        if (!this.currentModel) return;
        const model = this.currentModel;
        const systemBrightness = device.getBrightness() / 255;
		const intensityVal = parseFloat(canvasIntensity) || 2;
        const RGBData = [];
        const smoothK = parseFloat(smoothSpeed);
        
        let tR, tG, tB;
		
       if (LightingMode === "Genshin Sense") {
            // Используем X = 22 (это крайняя правая точка для твоей сетки размером 23)
            const sampleX = 22; 
            const sampleY1 = 2; 
            const sampleY2 = 5; 

            const c1 = device.color(sampleX, sampleY1); 
            const c2 = device.color(sampleX, sampleY2); 
            
            tR = (c1[0] + c2[0]) / 2;
            tG = (c1[1] + c2[1]) / 2;
            tB = (c1[2] + c2[2]) / 2;

            if(tR < 15 && tG < 15 && tB < 15) {
                tR = 25; tG = 25; tB = 35; 
            }
        }

        for (let i = 0; i < model.vLeds.length; i++) {
            const [px, py] = model.vLedPositions[i] || [0, 0];
            const screen = device.color(px, py);
            let r, g, b;

            switch (LightingMode) {
                case "Genshin Sense":
				case "Canvas + Tint":
				    const luma = (0.2126 * screen[0] + 0.7152 * screen[1] + 0.0722 * screen[2]) / 255;
                    r = tR * luma * intensityVal * systemBrightness;
                    g = tG * luma * intensityVal * systemBrightness;
                    b = tB * luma * intensityVal * systemBrightness;
                    break;
				case "Canvas Blend":
                    r = (screen[0] * 0.5 + tR * 0.5) * intensityVal * systemBrightness;
                    g = (screen[1] * 0.5 + tG * 0.5) * intensityVal * systemBrightness;
                    b = (screen[2] * 0.5 + tB * 0.5) * intensityVal * systemBrightness;
                    break;
                case "Forced":
				    r = tR * intensityVal * systemBrightness;
					g = tG * intensityVal * systemBrightness;
					b = tB * intensityVal * systemBrightness;
                    break;
                default: // Canvas
					r = screen[0] * intensityVal * systemBrightness;
					g = screen[1] * intensityVal * systemBrightness;
					b = screen[2] * intensityVal * systemBrightness;
                    break;
            }

            const idx = model.vLeds[i] * 3;
            if (smoothK < 1.0 && this.lastRGBData[idx] !== undefined) {
                r = this.lastRGBData[idx] + (r - this.lastRGBData[idx]) * smoothK;
                g = this.lastRGBData[idx+1] + (g - this.lastRGBData[idx+1]) * smoothK;
                b = this.lastRGBData[idx+2] + (b - this.lastRGBData[idx+2]) * smoothK;
            }

            RGBData[idx] = Math.min(255, Math.round(r));
            RGBData[idx+1] = Math.min(255, Math.round(g));
            RGBData[idx+2] = Math.min(255, Math.round(b));
            this.lastRGBData[idx] = r; this.lastRGBData[idx+1] = g; this.lastRGBData[idx+2] = b;
        }

        const bSize = parseInt(packetSize) || 48;
		const pPause = parseInt(packetPause) || 2;
        for (let i = 0; i < Math.ceil(RGBData.length / bSize); i++) {
            this.protocol.writePacket(i, RGBData.slice(i * bSize, i * bSize + bSize), bSize, useChecksum, packetPause);
        }
    }
}

/* --- СЛОЙ 4: API --- */
let Engine;
export function Name() { return "Redragon K580 Vata"; }
export function VendorId() { return 0x320F; }
export function ProductId() { return 0x5000; }
export function Publisher() { return "Vinodarin & Дарья"; }
export function Size() { return [23, 8]; }
export function DeviceType(){ return "keyboard"; }
export function Version() { return "1.3.0"; }
export function Validate(endpoint) { return endpoint.interface === 1 || endpoint.interface === 2; }

export function ControllableParameters() {
    return [
        {property:"forcedModel", group:"lighting", label:"Модель", type:"combobox", values: ["Redragon K580 Vata", "None"], default: "Redragon K580 Vata"},
        {property:"LightingMode", group:"lighting", label:"Режим работы", type:"combobox", values:["Canvas", "Canvas + Tint", "Canvas Blend", "Forced", "Genshin Sense"], default:"Canvas"},
		{property:"forcedColor", group:"lighting", label:"Цвет (Manual)", type:"color", default:"#FF0000", isVisible: "LightingMode === 'Forced' || LightingMode === 'Canvas + Tint' || LightingMode === 'Canvas Blend'"},
		{property:"smoothSpeed", group:"lighting", label:"Плавность", type:"combobox", values:["0.1", "0.2", "0.3", "0.5", "1.0"], default:"0.3"},
		{property:"canvasIntensity", group:"lighting", label:"Яркость Canvas", type:"number", min:1, max:10, default:2},
		{property:"packetSize", group:"settings", label:"Размер пакета", type:"combobox", values:["24", "32", "48"], default:"48"},
        {property:"packetPause", group:"settings", label:"Пауза (мс)", type:"combobox", values:["1", "2", "3", "5", "7", "10"], default:"2"},
        {property:"useChecksum", group:"settings", label:"Чексумма", type:"boolean", default:true},
        {property:"fps", group:"settings", label:"FPS", type:"combobox", values:["15", "30", "42", "60"], default:"30"},
    ];
}

export function Initialize() { 
    Engine = new KeyboardEngine(new EvisionProtocol(), deviceLibrary);
    Engine.updateModel(forcedModel);
    onfpsChanged();
    device.log(`[Система] Инициализация Redragon K580 завершена. Настройки: FPS=${fps}, PacketSize=${packetSize}, Pause=${packetPause}ms`);
}

export function Render() { 
    if (Engine && forcedModel.trim() !== "None") {
        Engine.render(); 
    }
}

// --- Обработчики изменений ---

export function onforcedModelChanged() { 
    if (Engine) {
        Engine.updateModel(forcedModel); 
        device.log(`[Модель] Выбрано: ${forcedModel}`);
    }
}

export function onfpsChanged() {
    const targetFps = parseInt(fps) || 30;
    if (typeof device.setFrameRate === "function") {
        device.setFrameRate(targetFps);
    } else if (typeof device.setFramerate === "function") {
        device.setFramerate(targetFps);
    }
    device.log(`[Настройки] Частота кадров изменена на: ${fps}`);
}

export function onpacketSizeChanged() {
    device.log(`[Настройки] Размер пакета: ${packetSize} байт`);
}

export function onpacketPauseChanged() {
    device.log(`[Настройки] Пауза между пакетами: ${packetPause} мс`);
}

export function onuseChecksumChanged() {
    device.log(`[Настройки] Чексумма: ${useChecksum ? "Включена" : "Отключена"}`);
}
