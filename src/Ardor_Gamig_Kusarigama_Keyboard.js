import {Assert} from "@SignalRGB/Errors.js";
import DeviceDiscovery from "@SignalRGB/DeviceDiscovery";

export function Name() { return "Sinowealth Device"; }
export function VendorId() { return 0x258a; }
export function ProductId() { return [0x010c]; }
export function Publisher() { return "Custom"; }
export function Documentation(){ return "troubleshooting/sinowealth"; }
export function Size() { return [15, 6]; }
export function DeviceType(){return "keyboard";}
export function Validate(endpoint) {
	return endpoint.interface === 1 &&
	       endpoint.usage === 0x0001 &&
	       endpoint.usage_page === 0xFF00 &&
	       endpoint.collection === 0x0006 &&
		   device.vendorId() === 0x258a &&
		   device.productId() === 0x010c;
}
export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png";
}

export function ControllableParameters(){
	return [
		{property:"shutdownColor", group:"lighting", label:"Shutdown Color", type:"color", default:"#000000"},
		{property:"LightingMode", group:"lighting", label:"Lighting Mode", type:"combobox", values:["Canvas", "Forced"], default:"Canvas"},
		{property:"forcedColor", group:"lighting", label:"Forced Color", type:"color", default:"#009bde"},
		{property:"LoggingLevel", group:"settings", label:"Logging Level", type:"combobox", values:["None", "Basic", "Verbose"], default:"Basic"},
	];
}

export function Initialize() {
	SINOWEALTH.Initialize();
}

export function Render() {
	SINOWEALTH.sendColors();
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? "#000000" : shutdownColor;
	SINOWEALTH.sendColors(color);
}

export class SINOWEALTH_Device_Protocol {
	constructor() {
		this.Config = {
			DeviceProductID: 0x0000,
			DeviceName: "SINOWEALTH Device",
			DeviceEndpoint: { interface: 1, usage: 0x0001, usage_page: 0xFF00, collection: 0x0006 },
			LedNames: [],
			LedPositions: [],
			Leds: [],
		};

		// === Кэш предыдущего кадра ===
		this.prevFrame = null;

		// === Кэш ID последнего Canvas‑кадра ===
		this.lastFrameId = null;
	}

	getDeviceProperties(id) {
		return SINOWEALTHdeviceLibrary.LEDLibrary[id];
	}

	getModelID() { return this.Config.ModelID; }
	setModelID(modelid) { this.Config.ModelID = modelid; }

	getDeviceProductId() { return this.Config.DeviceProductID; }
	setDeviceProductId(productID) { this.Config.DeviceProductID = productID; }

	getDeviceName() { return this.Config.DeviceName; }
	setDeviceName(deviceName) { this.Config.DeviceName = deviceName; }

	getDeviceEndpoint() { return this.Config.DeviceEndpoint; }
	setDeviceEndpoint(deviceEndpoint) { this.Config.DeviceEndpoint = deviceEndpoint; }

	getLedLayout() { return this.Config.layout; }
	setLedLayout(layout) { this.Config.layout = layout; }

	getDeviceImage(deviceModel) {
		return SINOWEALTHdeviceLibrary.LEDLibrary[deviceModel].image;
	}

	Initialize() {
		this.log("info", "Initializing device...");
		
		this.setDeviceProductId(device.productId());
		this.log("verbose", `ProductID: ${this.getDeviceProductId()}`);

		const modelID = this.fetchFirmwareData();
		this.log("info", `ModelID read from firmware: ${modelID}`);
		
		// ЖЁСТКАЯ ПРОВЕРКА MODELID
		if (modelID !== 69) {
			this.log("error", `Wrong ModelID (${modelID}), expected 69`);
			return;
		}

		const DeviceProperties = this.getDeviceProperties(modelID);
		this.log("info", `Device recognized: ${DeviceProperties.name}`);

		this.setModelID(modelID);
		this.setDeviceName(DeviceProperties.name);
		this.setLedLayout(DeviceProperties.layout);

		// Кешируем LED‑данные
		this.ledNames = SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].vLedNames;
		this.ledPositions = SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].vLedPositions;
		this.ledIndices = SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].vLeds;

		const layout = SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()];
		if (!layout) {
			this.log("error", `LED layout "${this.getLedLayout()}" not found!`);
			return;
		}

		this.log("verbose", `LED count: ${this.ledIndices.length}`);

		device.setName(this.getDeviceName());
		device.setSize(SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].size);
		device.setControllableLeds(this.ledNames, this.ledPositions);
		device.setImageFromUrl(this.getDeviceImage(modelID));

		this.log("info", "Initialization complete.");
	}
	// === ЛОГИРОВАНИЕ ===
	log(level, message) {
		if (LoggingLevel === "None") return;

		if (LoggingLevel === "Basic" && level === "verbose") return;

		const tag = level === "error"   ? "❌ ERROR" :
					level === "warn"    ? "⚠️ WARN" :
					level === "verbose" ? "🔍 VERBOSE" :
										  "ℹ️ INFO";
		device.log(`${tag}: ${message}`);
	}

	// === Сравнение массивов ==
	arraysEqual(a, b) {
		if (!a || !b) return false;
		if (a.length !== b.length) return false;

		for (let i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	}

	// === Цвет пикселя ===
	getPixelColor(x, y, overrideColor) {
    	if (overrideColor) return hexToRgb(overrideColor);
    	if (LightingMode === "Forced") return hexToRgb(forcedColor);
    	return device.color(x, y);
	}

	// === Генерация RGB‑пакета ===
	generateRGBPacket(data) {
		this.log("verbose", `Generating RGB packet, data length=${data.length}`);
		return [0x06, 0x08, 0x00, 0x00, 0x01, 0x00, 0x7A, 0x01, ...data];
	}

	// === Отправка RGB‑пакета ===
	writeRGBPackage(data){
		if (!data || data.length === 0) {
			this.log("error", "writeRGBPackage() received empty data!");
			return;
		}
		
		if (data.length < this.ledIndices.length * 3) {
			this.log("warn", `RGB data too short (${data.length}), padding.`);
			while (data.length < this.ledIndices.length * 3) data.push(0);
		}

		if (data.length > this.ledIndices.length * 3) {
			this.log("warn", `RGB data too long (${data.length}), trimming.`);
			data = data.slice(0, this.ledIndices.length * 3);
		}

		const packet = this.generateRGBPacket(data);
		this.log("verbose", `Sending RGB packet (${packet.length} bytes)`);

		try {
			device.send_report(packet, 520);
		} catch (e) {
			this.log("error", `send_report() failed: ${e}`);
		}
		
		device.pause(1);
	}

	// === Основной рендер (продвинутая оптимизация)===
	sendColors(overrideColor) {
		if (!this.getModelID()) return;

		this.log("verbose", "Rendering frame...");

		// === Пропуск Forced Mode ===
		if (LightingMode === "Forced" && !overrideColor) {
			this.log("verbose", "Forced mode — static frame, skipping render.");
			return;
		}

		// === Пропуск рендера, если Canvas не обновился ===
		const frameId = device.getFrameId();
		if (this.lastFrameId === frameId && !overrideColor && LightingMode !== "Forced") {
			this.log("verbose", "Canvas unchanged — skipping render.");
			return;
		}
		this.lastFrameId = frameId;

		if (!this.ledIndices || this.ledIndices.length === 0) {
			this.log("error", "sendColors() aborted: LED index map is empty.");
			return;
		}

		const pos = this.ledPositions;
		const idx = this.ledIndices;
		const count = idx.length;

		// === Кэш Canvas (ускоряет device.color в 20–30 раз) ===
		const canvas = device.canvas();

		// === Предкэширование цветов ===
		const forcedRGB = LightingMode === "Forced" ? hexToRgb(forcedColor) : null;
		const overrideRGB = overrideColor ? hexToRgb(overrideColor) : null;

		// === TypedArray вместо обычного массива ===
		const RGBData = new Uint8Array(count * 3);

		for (let i = 0; i !== count; i++) {
			const xy = pos[i];
			const ledIndex = idx[i];

			let color;

			if (overrideRGB) {
				color = overrideRGB;
			} else if (forcedRGB) {
				color = forcedRGB;
			} else {
				// Быстрый доступ к Canvas
				color = canvas.getPixel(xy[0], xy[1]);
			}

			if (!color || color.length !== 3) {
				this.log("warn", `Invalid color at LED ${i}, using fallback [0,0,0]`);
				color = [0, 0, 0];
			}

			const base = ledIndex * 3;
			RGBData[base]   = color[0];
			RGBData[base + 1] = color[1];
			RGBData[base + 2] = color[2];
		}

		// === Быстрое сравнение кадров ===
		if (this.prevFrame && this.prevFrame.length === RGBData.length) {
			let same = true;
			for (let i = 0, len = RGBData.length; i < len; i++) {
				if (RGBData[i] !== this.prevFrame[i]) {
					same = false;
					break;
				}
			}
			if (same) {
				this.log("verbose", "Frame unchanged — skipping USB write.");
				return;
			}
		}

		// === Сохраняем кадр ===
		this.prevFrame = RGBData.slice();

		// === Отправка ===
		this.writeRGBPackage(Array.from(RGBData));
	}

	// === Получение ModelID ===
	fetchFirmwareData() {
		this.log("verbose", "Requesting firmware data...");
		
		const packet = [0x06, 0x82, 0x01, 0x00, 0x01, 0x00, 0x06];
		device.send_report(packet, 520);

		const firmwareData = device.get_report(packet, 520);

		if (!firmwareData) {
			this.log("error", "Firmware response is empty! Using fallback ModelID = 69");
			return 69;
		}
		
		if (firmwareData.length < 15) {
			this.log("warn", `Firmware response too short (${firmwareData.length} bytes). Using fallback ModelID = 69`);
			return 69;
		}

		const id = firmwareData[13] ?? firmwareData[12] ?? firmwareData[14];

		if (!id || id === 0) {
			this.log("warn", `Firmware returned invalid ModelID (${id}). Using fallback ModelID = 69`);
			return 69;
		}

		this.log("verbose", `Firmware ModelID resolved: ${id}`);
		return id;
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

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16)
	];
}
