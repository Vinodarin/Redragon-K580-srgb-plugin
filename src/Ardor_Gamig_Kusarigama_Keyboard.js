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

	getLedNames() { return this.Config.LedNames; }
	setLedNames(ledNames) { this.Config.LedNames = ledNames; }

	getLedPositions() { return this.Config.LedPositions; }
	setLedPositions(ledPositions) { this.Config.LedPositions = ledPositions; }

	getLeds() { return this.Config.Leds; }
	setLeds(leds) { this.Config.Leds = leds; }

	getDeviceImage(deviceModel) {
		return SINOWEALTHdeviceLibrary.LEDLibrary[deviceModel].image;
	}

	Initialize() {
		this.setDeviceProductId(device.productId());

		const modelID = this.fetchFirmwareData();
		
		// ЖЁСТКАЯ ПРОВЕРКА MODELID
		if (modelID !== 69) {
			device.log(`❌ Wrong ModelID (${modelID}), expected 69. Skipping device.`);
			return;
		}

		const DeviceProperties = this.getDeviceProperties(modelID);

		this.setModelID(modelID);
		this.setDeviceName(DeviceProperties.name);
		this.setLedLayout(DeviceProperties.layout);

		// Кешируем LED‑данные
		this.ledNames = SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].vLedNames;
		this.ledPositions = SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].vLedPositions;
		this.ledIndices = SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].vLeds;

		device.setName(this.getDeviceName());
		device.setSize(SINOWEALTHdeviceLibrary.LEDLayout[this.getLedLayout()].size);
		device.setControllableLeds(this.ledNames, this.ledPositions);
		device.setImageFromUrl(this.getDeviceImage(modelID));
	}
	getDeviceImage(deviceModel) {
		return SINOWEALTHdeviceLibrary.LEDLibrary[deviceModel].image;
	}

	// === Цвет пикселя ===
	getPixelColor(x, y, overrideColor) {
    	if (overrideColor) return hexToRgb(overrideColor);
    	if (LightingMode === "Forced") return hexToRgb(forcedColor);
    	return device.color(x, y);
	}

	// === Генерация RGB‑пакета ===
	generateRGBPacket(data) {
		return [0x06, 0x08, 0x00, 0x00, 0x01, 0x00, 0x7A, 0x01, ...data];
	}

	// === Отправка RGB‑пакета ===
	writeRGBPackage(data){
		const packet = this.generateRGBPacket(data);
		device.send_report(packet, 520);
		device.pause(1);
	}

	// === Основной рендер ===
	sendColors(overrideColor) {
		if (!this.getModelID()) return;

		const pos = this.ledPositions;
		const idx = this.ledIndices;

		const RGBData = [];

		for (let i = 0; i < idx.length; i++) {
			const [x, y] = pos[i];
			onst color = this.getPixelColor(x, y, overrideColor);
			
			RGBData[(deviceLeds[iIdx]*3)]   = color[0];
			RGBData[(deviceLeds[iIdx]*3)+1] = color[1];
			RGBData[(deviceLeds[iIdx]*3)+2] = color[2];
		}
		
		this.writeRGBPackage(RGBData);
	}

	// === Получение ModelID ===
	fetchFirmwareData() {
		const packet = [0x06, 0x82, 0x01, 0x00, 0x01, 0x00, 0x06];

		device.send_report(packet, 520);

		const firmwareData = device.get_report(packet, 520);

		return firmwareData[13] ?? firmwareData[12] ?? firmwareData[14];
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

			// Custom
			"F75": {
				vLedNames: [
					"Esc",    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
					"`",   "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",  "Del",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]",   "\\",         "Page Up",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",   "Enter",      "Page Down",
					"Left Shift",  "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "End",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Fn", "Right Ctrl",   "Left Arrow", "Down Arrow", "Right Arrow"
				],
				vLeds:  [
					0,    12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78,
					1, 7, 13, 19, 25, 31, 37, 43, 49, 55, 61, 67, 73, 79, 85,
					2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86,
					3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69,     81, 87,
					4, 10, 16, 22, 28, 34, 40, 46, 52, 58, 64,    70, 82, 88,
					5, 11, 17,			35,				53, 59,   77, 83, 89
				],
				vLedPositions: [
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],          [13, 3], [14, 3],
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],
					[0, 5], [1, 5], [2, 5],                         [6, 5],					[9, 5], [10, 5], 		  [12, 5], [13, 5], [14, 5],
				],
				size: [15, 6],
			},

			"Mercury K1 Pro": {
				vLedNames: [
					"Esc",    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
					"`",   "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",  "Del",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]",   "\\",         "Page Up",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",   "Enter",      "Page Down",
					"Left Shift",  "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn",   "Left Arrow", "Down Arrow", "Right Arrow",
				],
				vLeds:  [
					0,    12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78,
					1, 7, 13, 19, 25, 31, 37, 43, 49, 55, 61, 67, 73, 79, 91,
					2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 92,
					3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69,     81, 93,
					4,    16, 22, 28, 34, 40, 46, 52, 58, 64, 70, 82, 88,
					5, 11, 17,			35,			  53, 59, 83, 89, 95,
	
				],
				vLedPositions: [
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],          [13, 3], [14, 3],
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4],
					[0, 5], [1, 5], [2, 5],                         [6, 5],					[9, 5], [10, 5], [12, 5], [13, 5], [14, 5],

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
