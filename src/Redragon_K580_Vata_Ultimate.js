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

/* --- КОНСТАНТЫ ПРОТОКОЛА --- */
const CMD_WRITE     = 0x04;
const CMD_CHECKSUM  = 0x12;
const MAGIC_OFFSET  = 74;
const HEADER_FILLER = 0x00;
const PACKET_TOTAL  = 64; // общий размер USB-пакета

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
			47,   4,     20, 28, 36, 44, 52, 60, 68, 76, 84, 92,	 108,        116,		  109, 117, 125, 133,	87,
			55,   5, 13, 21,              29,             37, 45, 53, 61,    69, 77, 85,       93,      101,		79,
			63,																										71,
		],
		vLedPositions: [
			[0, 0],																																						   									  [22, 0], //2
			[0, 1],   [1, 1],		  [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],   [15, 1], [16, 1], [17, 1],										  [22, 1], //23
			[0, 2],   [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],   [18, 2], [19, 2], [20, 2], [21, 2], [22, 2], //24
			[0, 3],   [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3],   [18, 3], [19, 3], [20, 3], [21, 3], [22, 3], //24
			[0, 4],   [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], 		  [14, 4],							      [18, 4], [19, 4], [20, 4],		  [22, 4], //19
			[0, 5],     	  [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], 		  [14, 5],            [16, 5],			  [18, 5], [19, 5], [20, 5], [21, 5], [22, 5], //19
			[0, 6],   [1, 6], [2, 6], [3, 6],				  [6, 6],								   [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6],   [18, 6],		    [20, 6],	      [22, 6],
			[0, 7],																																															  [22, 7],
		],
		endpoint: [{ "interface": 1, "usage": 0x0092, "usage_page": 0xFF1C, "collection": 0x0004 }]
	},
	"None": {
		name: "EVision Device",
		image: "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png",
	}
};

/* --- СЛОЙ 2: ПРОТОКОЛ EVISION --- */
class EvisionProtocol {
    constructor() {}

    calculateChecksum(data, index, bytesToSend) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += (data[i] || 0);
        }

        const magic = index * bytesToSend + MAGIC_OFFSET;
        const val = sum + magic;

        return {
            high: (val >>> 8) & 0xFF,
            low:  val & 0xFF
        };
    }

    writePacket(index, data, bytesToSend, useChecksum, pauseTime) {
        const fullData = new Array(bytesToSend).fill(0);
        for (let i = 0; i < data.length; i++) {
            fullData[i] = data[i] || 0;
        }

        const bytesSent = index * bytesToSend;
        const checksum = useChecksum
            ? this.calculateChecksum(fullData, index, bytesToSend)
            : { low: 0, high: 0 };

        const packet = [
            CMD_WRITE,
            checksum.low,
            checksum.high,
            CMD_CHECKSUM,
            bytesToSend,
            bytesSent & 0xFF,
            (bytesSent >>> 8) & 0xFF,
            HEADER_FILLER,
            ...fullData
        ];

        device.write(packet, PACKET_TOTAL);
        if (pauseTime > 0) {
            device.pause(pauseTime);
        }
    }
}


/* --- СЛОЙ 3: ДВИЖОК ПЛАГИНА (Engine) --- */
class KeyboardEngine {
    constructor(protocol, library) {
        this.protocol     = protocol;
        this.library      = library;
        this.currentModel = null;
        this.lastRGBData  = [];

        // --- Кэш цвета (hexToRgb) ---
        this._lastColor  = null;
        this._cachedRGB  = null;
    }

    /**
     * Парсит HEX-цвет в [R, G, B] с кэшированием результата.
     * Если цвет не изменился с прошлого вызова — возвращает кэш.
     */
    getTintRGB() {
        const colorStr = String(forcedColor || "#000000");

        if (this._lastColor === colorStr && this._cachedRGB) {
            return this._cachedRGB;
        }

        const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorStr);
        let rgb;
        if (match) {
            rgb = [
                parseInt(match[1], 16),
                parseInt(match[2], 16),
                parseInt(match[3], 16)
            ];
        } else {
            rgb = [0, 0, 0];
        }

        this._lastColor = colorStr;
        this._cachedRGB = rgb;
        return rgb;
    }

    updateModel(modelName) {
        const cleanName = String(modelName || "").trim();
        if (cleanName === "None") {
            this.currentModel = null;
            return;
        }

        const props = this.library[cleanName];
        if (!props) {
            device.log(`[Ошибка] Модель "${cleanName}" не найдена в библиотеке.`);
            this.currentModel = null;
            return;
        }

        this.currentModel = props;
        device.setName(props.name);
        device.setImageFromUrl(props.image);
        device.setSize(Size());
        device.setControllableLeds(props.vLedNames, props.vLedPositions);

        const hid = device.getHidEndpoints();
        const target = props.endpoint[0];
        const found = hid.find(e => e.interface === target.interface && e.usage === target.usage);
        if (found) {
            device.set_endpoint(found.interface, found.usage, found.usage_page, found.collection);
        } else {
            device.log(`[Предупреждение] HID-эндпоинт не найден для "${cleanName}".`);
        }

        this.lastRGBData = new Array(props.vLeds.length * 3).fill(0);
    }

    render() {
        if (!this.currentModel) return;
        const model = this.currentModel;

        // --- Инварианты: вычисляются один раз за кадр ---
        const systemBrightness = device.getBrightness() / 255;

        const intensityRaw = parseFloat(canvasIntensity);
        const intensityVal = (Number.isNaN(intensityRaw) || intensityRaw === 0)
            ? 2
            : Math.max(1, Math.min(5, intensityRaw));

        const smoothRaw = parseFloat(smoothSpeed);
        const smoothK = (Number.isNaN(smoothRaw) || smoothRaw === 0)
            ? 0.3
            : Math.max(0.05, Math.min(1.0, smoothRaw));

        const useSmoothing = smoothK < 1.0;
        const [tR, tG, tB] = this.getTintRGB();

        const maxLedIdx = Math.max(...model.vLeds);
        const RGBData = new Array((maxLedIdx + 1) * 3).fill(0);

        // --- Цикл по светодиодам ---
        for (let i = 0; i < model.vLeds.length; i++) {
            const pos = model.vLedPositions[i];
            if (!pos) {
                device.log(`[Предупреждение] Позиция LED #${i} не задана, пропуск.`);
                continue;
            }

            const [px, py] = pos;
            const screen = device.color(px, py);
            let r, g, b;

            switch (LightingMode) {
                case "Canvas + Tint": {
                    const luma = (0.2126 * screen[0] + 0.7152 * screen[1] + 0.0722 * screen[2]) / 255;
                    r = tR * luma * intensityVal * systemBrightness;
                    g = tG * luma * intensityVal * systemBrightness;
                    b = tB * luma * intensityVal * systemBrightness;
                    break;
                }
                case "Canvas Blend": {
                    r = (screen[0] * 0.5 + tR * 0.5) * intensityVal * systemBrightness;
                    g = (screen[1] * 0.5 + tG * 0.5) * intensityVal * systemBrightness;
                    b = (screen[2] * 0.5 + tB * 0.5) * intensityVal * systemBrightness;
                    break;
                }
                case "Forced": {
                    r = tR * intensityVal * systemBrightness;
                    g = tG * intensityVal * systemBrightness;
                    b = tB * intensityVal * systemBrightness;
                    break;
                }
                default: { // Canvas
                    r = screen[0] * intensityVal * systemBrightness;
                    g = screen[1] * intensityVal * systemBrightness;
                    b = screen[2] * intensityVal * systemBrightness;
                    break;
                }
            }

            // Отключение боковых лент
            if (!useSideStrips) {
                const ledName = model.vLedNames[i] || "";
                if (ledName.includes("strip")) {
                    r = 0; g = 0; b = 0;
                }
            }

            const idx = model.vLeds[i] * 3;

            // Сглаживание
            if (useSmoothing && this.lastRGBData[idx] !== undefined) {
                r = this.lastRGBData[idx]     + (r - this.lastRGBData[idx])     * smoothK;
                g = this.lastRGBData[idx + 1] + (g - this.lastRGBData[idx + 1]) * smoothK;
                b = this.lastRGBData[idx + 2] + (b - this.lastRGBData[idx + 2]) * smoothK;
            }

            RGBData[idx]     = Math.min(255, Math.max(0, Math.round(r)));
            RGBData[idx + 1] = Math.min(255, Math.max(0, Math.round(g)));
            RGBData[idx + 2] = Math.min(255, Math.max(0, Math.round(b)));

            // Сохраняем "сырые" значения для следующего кадра сглаживания
            this.lastRGBData[idx]     = r;
            this.lastRGBData[idx + 1] = g;
            this.lastRGBData[idx + 2] = b;
        }

        // --- Отправка пакетов ---
        const bSize = parseInt(packetSize) || 48;
        const pPause = parseInt(packetPause) || 2;
        const packetsCount = Math.ceil(RGBData.length / bSize);

        for (let i = 0; i < packetsCount; i++) {
            const start = i * bSize;
            const end = Math.min(start + bSize, RGBData.length);
            this.protocol.writePacket(i, RGBData.slice(start, end), bSize, useChecksum, pPause);
        }
    }

    /**
     * Гасит все светодиоды: корректно вычисляет количество пакетов
     * на основе реального размера данных устройства.
     */
    shutdown() {
        if (!this.currentModel) return;

        const bSize = parseInt(packetSize) || 48;
        const maxLedIdx = Math.max(...this.currentModel.vLeds);
        const totalBytes = (maxLedIdx + 1) * 3;
        const blackData = new Array(totalBytes).fill(0);
        const packetsCount = Math.ceil(totalBytes / bSize);

        for (let i = 0; i < packetsCount; i++) {
            const start = i * bSize;
            const end = Math.min(start + bSize, totalBytes);
            this.protocol.writePacket(i, blackData.slice(start, end), bSize, useChecksum, 1);
        }
    }
}


/* --- СЛОЙ 4: ИНИЦИАЛИЗАЦИЯ (SignalRGB API) --- */
let EVISION;
let Engine;

export function Name()             { return "Redragon K580 Vata"; }
export function VendorId()         { return 0x320F; }
export function ProductId()        { return 0x5000; }
export function Publisher()        { return "Vinodarin & Дарья (Gemini AI)"; }
export function Size()             { return [23, 8]; }
export function DeviceType()       { return "keyboard"; }
export function Version()          { return "1.4.0"; }
export function Description()  	   { return "Индивидуальный драйвер. Авторы: Vinodarin и Дарья. Поддержка Universal Tinting и синхронизация яркости."; }
export function Validate(endpoint) { return endpoint.interface === 1 || endpoint.interface === 2; }

export function ControllableParameters() {
    return [
        { property: "forcedModel",    group: "lighting", label: "Модель",                type: "combobox", values: [" Redragon K580 Vata ", " None "], default: " Redragon K580 Vata " },
        { property: "useSideStrips",   group: "lighting", label: "Включить боковые ленты", type: "boolean",  default: true },
        { property: "LightingMode",    group: "lighting", label: "Режим работы",          type: "combobox", values: ["Canvas", "Canvas + Tint", "Canvas Blend", "Forced"], default: "Canvas" },
        { property: "forcedColor",     group: "lighting", label: "Цвет (Force/Tint)",     type: "color",    default: "#FF0000", isVisible: "LightingMode === 'Forced' || LightingMode === 'Canvas + Tint'" },
        { property: "smoothSpeed",     group: "lighting", label: "Плавность",             type: "combobox", values: ["0.1", "0.2", "0.3", "0.5", "1.0"], default: "0.3" },
        { property: "canvasIntensity", group: "lighting", label: "Яркость",               type: "number",   min: 1, max: 5, default: 5 },
        { property: "packetSize",      group: "settings", label: "Размер пакета (байт)",  type: "combobox", values: ["24", "32", "48"], default: "48" },
        { property: "packetPause",      group: "settings", label: "Пауза (мс)",            type: "combobox", values: ["1", "2", "3", "5"], default: "3" },
        { property: "useChecksum",     group: "settings", label: "Чексумма",              type: "boolean",  default: true },
    ];
}

export function Initialize() {
    EVISION = new EvisionProtocol();
    Engine = new KeyboardEngine(EVISION, deviceLibrary);
    Engine.updateModel(forcedModel);

    const bSize = parseInt(packetSize) || 48;
    const testData = new Array(bSize).fill(0);
    const testCS = EVISION.calculateChecksum(testData, 0, bSize);
    const csHex = `0x${testCS.high.toString(16).toUpperCase()}${testCS.low.toString(16).padStart(2, '0').toUpperCase()}`;

    device.log(`[Система] Инициализация Redragon K580 (v1.4.0) завершена.`);
    device.log(`[Настройки] Режим: Авто-FPS, PacketSize=${packetSize}, Pause=${packetPause}ms`);
    device.log(`[Настройки] Чексумма: ${useChecksum ? "Включена" : "Отключена"} (CS пакета #0: ${csHex})`);
}

export function Render() {
    if (!Engine) return;
    const model = String(forcedModel || "").trim();
    if (model === "None") return;
    Engine.render();
}

export function Shutdown(SystemSuspending) {
    if (!Engine) return;
    device.log("[Система] Выключение: очистка подсветки.");
    Engine.shutdown();
}

export function onforcedModelChanged() {
    if (!Engine) return;
    Engine.updateModel(forcedModel);
    device.log(`[Модель] Переключено на: ${forcedModel}`);
}

export function onpacketSizeChanged() {
    device.log(`[Настройки] Размер пакета изменен на: ${packetSize} байт`);
}

export function onpacketPauseChanged() {
    device.log(`[Настройки] Пауза между пакетами: ${packetPause} мс`);
}

export function onuseChecksumChanged() {
    if (!EVISION) return;
    const bSize = parseInt(packetSize) || 48;
    const testData = new Array(bSize).fill(0);
    const testCS = EVISION.calculateChecksum(testData, 0, bSize);
    const csHex = `0x${testCS.high.toString(16).toUpperCase()}${testCS.low.toString(16).padStart(2, '0').toUpperCase()}`;

    const status = useChecksum ? "Включена" : "Отключена";
    device.log(`[Настройки] Проверка контрольной суммы: ${status}. Тестовый байт (CS пакет #0): ${csHex}`);
}

export function onuseSideStripsChanged() {
    device.log(`[Настройки] Боковые ленты: ${useSideStrips ? "Включены" : "Выключены"}`);
}