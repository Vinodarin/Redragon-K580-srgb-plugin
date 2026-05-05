import { Assert } from "@SignalRGB/Errors.js";
import DeviceDiscovery from "@SignalRGB/DeviceDiscovery";

// === Метаданные устройства ===
export function Name() { return "Sinowealth Device"; }
export function VendorId() { return 0x258a; }
export function ProductId() { return [0x010c]; }
export function Publisher() { return "Custom"; }
export function Documentation() { return "troubleshooting/sinowealth"; }
export function Size() { return [15, 6]; }
export function DeviceType() { return "keyboard"; }

// === Корректная валидация ===
export function Validate(endpoint) {
	return endpoint.interface === 1 &&
	       endpoint.usage === 0x0001 &&
	       endpoint.usage_page === 0xFF00 &&
	       endpoint.collection === 0x0006 &&
	       endpoint.vendor_id === 0x258a &&
	       endpoint.product_id === 0x010c;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png";
}

// === Параметры управления ===
export function ControllableParameters() {
	return [
		{ property: "shutdownColor", group: "lighting", label: "Shutdown Color", type: "color", default: "#000000" },
		{ property: "LightingMode", group: "lighting", label: "Lighting Mode", type: "combobox", values: ["Canvas", "Forced"], default: "Canvas" },
		{ property: "forcedColor", group: "lighting", label: "Forced Color", type: "color", default: "#009bde" },
		{ property: "LoggingLevel", group: "settings", label: "Logging Level", type: "combobox", values: ["None", "Basic", "Verbose"], default: "Basic" },
	];
}

// === Инициализация ===
export function Initialize() {
	SINOWEALTH.Initialize();
}

// === Рендер ===
export function Render() {
	SINOWEALTH.sendColors();
}

// === Завершение работы ===
export function Shutdown(SystemSuspending) {
	const color = SystemSuspending
		? "#000000"
		: device.getProperty("shutdownColor");

	SINOWEALTH.sendColors(color);
}

// ============================================================================
// === КЛАСС ПРОТОКОЛА УСТРОЙСТВА =============================================
// ============================================================================

export class SINOWEALTH_Device_Protocol {
	constructor() {
		this.Config = {
			DeviceProductID: 0x0000,
			DeviceName: "SINOWEALTH Device",
			DeviceEndpoint: { interface: 1, usage: 0x0001, usage_page: 0xFF00, collection: 0x0006 },
			layout: null,
		};

		this.prevFrame = null;
		this.lastFrameId = null;
		this.forcedSent = false;
	}

	// === Утилиты ===
	log(level, message) {
		const setting = device.getProperty("LoggingLevel");

		if (setting === "None") return;
		if (setting === "Basic" && level === "verbose") return;

		const tag =
			level === "error" ? "❌ ERROR" :
			level === "warn" ? "⚠️ WARN" :
			level === "verbose" ? "🔍 VERBOSE" :
			"ℹ️ INFO";

		device.log(`${tag}: ${message}`);
	}

	hexToRgb(hex) {
		hex = hex.replace("#", "");
		return [
			parseInt(hex.substring(0, 2), 16),
			parseInt(hex.substring(2, 4), 16),
			parseInt(hex.substring(4, 6), 16)
		];
	}

	// === Инициализация ===
	Initialize() {
		this.log("info", "Initializing device...");

		this.Config.DeviceProductID = device.productId();

		const modelID = this.fetchFirmwareData();
		if (modelID !== 69) {
			this.log("error", `Wrong ModelID (${modelID}), expected 69`);
			return;
		}

		const props = SINOWEALTHdeviceLibrary.LEDLibrary[modelID];
		if (!props) {
			this.log("error", `Unknown ModelID ${modelID}`);
			return;
		}

		this.Config.layout = props.layout;

		const layout = SINOWEALTHdeviceLibrary.LEDLayout[this.Config.layout];
		if (!layout) {
			this.log("error", `LED layout "${this.Config.layout}" not found`);
			return;
		}

		this.ledNames = layout.vLedNames;
		this.ledPositions = layout.vLedPositions;
		this.ledIndices = layout.vLeds;

		device.setName(props.name);
		device.setSize(layout.size);
		device.setControllableLeds(this.ledNames, this.ledPositions);
		device.setImageFromUrl(props.image);

		this.log("info", "Initialization complete.");
	}

	// === Получение ModelID ===
	fetchFirmwareData() {
		this.log("verbose", "Requesting firmware data...");

		const packet = [0x06, 0x82, 0x01, 0x00, 0x01, 0x00, 0x06];
		device.send_report(packet, 520);

		const response = device.get_report(0x06, 520);

		if (!response || response.length < 15) {
			this.log("warn", "Firmware response invalid, using fallback ModelID = 69");
			return 69;
		}

		const id = response[13];
		this.log("verbose", `Firmware ModelID resolved: ${id}`);

		return id || 69;
	}

	// === Генерация пакета ===
	generateRGBPacket(data) {
		return new Uint8Array([
			0x06, 0x08, 0x00, 0x00, 0x01, 0x00, 0x7A, 0x01,
			...data
		]);
	}

	// === Отправка ===
	writeRGBPackage(data) {
		const packet = this.generateRGBPacket(data);

		try {
			device.send_report(packet, 520);
		} catch (e) {
			this.log("error", `send_report failed: ${e}`);
		}
	}

	// === Основной рендер ===
	sendColors(overrideColor) {
		if (!this.ledIndices) return;

		const mode = device.getProperty("LightingMode");

		// === Сброс forcedSent при смене режима ===
		if (mode !== this.lastMode) {
			this.forcedSent = false;
			this.lastMode = mode;
		}

		// Forced Mode — отправляем один раз
		if (mode === "Forced" && !overrideColor) {
			if (this.forcedSent) return;
			this.forcedSent = true;
		}

		const frameId = device.getFrameId();
		if (frameId === this.lastFrameId && !overrideColor && mode !== "Forced") {
			return;
		}
		this.lastFrameId = frameId;

		const canvas = device.canvas();
		if (!canvas) return;

		const count = this.ledIndices.length;
		const RGB = new Uint8Array(count * 3);

		const forcedRGB = mode === "Forced" ? this.hexToRgb(device.getProperty("forcedColor")) : null;
		const overrideRGB = overrideColor ? this.hexToRgb(overrideColor) : null;

		for (let i = 0; i < count; i++) {
			const xy = this.ledPositions[i];

			let color =
				overrideRGB ||
				forcedRGB ||
				canvas.getPixel(xy[0], xy[1]);

			if (!color) color = [0, 0, 0];

			const base = i * 3;
			RGB[base] = color[0];
			RGB[base + 1] = color[1];
			RGB[base + 2] = color[2];
		}

		// === сравнение кадров ===
		if (this.prevFrame && this.prevFrame.length === RGB.length) {
			let same = true;
			for (let i = 0; i < RGB.length; i++) {
				if (RGB[i] !== this.prevFrame[i]) {
					same = false;
					break;
				}
			}
			if (same) return;
		}

		this.prevFrame = RGB.slice();

		this.writeRGBPackage(RGB);
	}
}

export class deviceLibrary {
	constructor(){
		this.PIDLibrary = {
			0x010c: "SINOWEALTH Device",
		};

		this.LEDLibrary = {
			69: {
				name: "ARDOR GAMING Kusarigama",
				layout: "75%",
				image: "https://assets.signalrgb.com/devices/default/keyboards/keyboard75.png"
			},
		};

		this.LEDLayout = {

			"75%": {
				vLedNames: [
					"Esc",    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
					"`",   "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",  "Del",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]",   "\\",         "Page Up",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",   "Enter",      "Page Down",
					"Left Shift",  "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "AltGr", "Fn", "Right Ctrl",   "Left Arrow", "Down Arrow", "Right Arrow",
					"ISO_<", "ISO_#"
				],
				vLeds:  [
					0,    12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78,
					1, 7, 13, 19, 25, 31, 37, 43, 49, 55, 61, 67, 73, 79, 91,
					2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 92,
					3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69,     81, 93,
					4, 10, 16, 22, 28, 34, 40, 46, 52, 58, 64,    82, 88,
					5, 11, 17,			35,			  53, 59, 65, 83, 89, 95,
					70, 75
				],
				vLedPositions: [
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],          [13, 3], [14, 3],
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4],
					[0, 5], [1, 5], [2, 5],                         [6, 5],					[9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
					[1, 4], [12, 3]
				],
				size: [15, 6],
			},
		};
	}
}

const SINOWEALTHdeviceLibrary = new deviceLibrary();
const SINOWEALTH = new SINOWEALTH_Device_Protocol();
