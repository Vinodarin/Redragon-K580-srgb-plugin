import {Assert} from "@SignalRGB/Errors.js";
import DeviceDiscovery from "@SignalRGB/DeviceDiscovery";
export function FPS() { return 30; } // Ограничиваем отрисовку до 30 кадров
export function Name() { return "Redragon K580 Vata"; }
export function VendorId() { return 0x320F; }
export function ProductId() { return 0x5000; }
export function Publisher() { return "Custom"; }
export function Size() { return [24, 8]; }
export function DeviceType(){return "keyboard";}
export function Validate(endpoint) { return endpoint.interface === 1 || endpoint.interface === 2; }
export function ImageUrl() { return "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png"; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
monochrome:readonly
forcedModel:readonly
*/
export function ControllableParameters(){
	return [
		{property:"shutdownColor", group:"lighting", label:"Shutdown Color", description: "This color is applied to the device when the System, or SignalRGB is shutting down", min:"0", max:"360", type:"color", default:"#000000"},
		{property:"LightingMode", group:"lighting", label:"Lighting Mode", description: "Determines where the device's RGB comes from. Canvas will pull from the active Effect, while Forced will override it to a specific color", type:"combobox", values:["Canvas", "Forced"], default:"Canvas"},
		{property:"forcedColor", group:"lighting", label:"Forced Color", description: "The color used when 'Forced' Lighting Mode is enabled", min:"0", max:"360", type:"color", default:"#009bde"},
		{property:"monochrome", group:"lighting", label:"Monochrome mode", description: "This option allows control of monochrome models", type:"boolean", default:false},
		{property:"forcedModel", group:"lighting", label:"Forced Model", description: "Forces a specific model when automatic detection fails", type:"combobox", values: Object.keys(EVISIONdeviceLibrary.LEDLibrary), default: "None"}
	];
}

export function Initialize() {
	EVISION.Initialize();
}

export function Render() {
	EVISION.sendColors();
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? "#000000" : shutdownColor;
	EVISION.sendColors(color); // Go Dark on System Sleep/Shutdown
	device.pause(20);
}

export function onforcedModelChanged() {
	EVISION.updateModel(forcedModel);
}

export class EVISION_Device_Protocol {
	constructor() {
		this.Config = {
			DeviceProductID: 0x0000,
			DeviceName: "EVISION Device",
			DeviceEndpoint: [{"interface": 1, "usage": 0x0092, "usage_page": 0xFF1C, "collection": 0x0004 }],
			LedNames: [],
			LedPositions: [],
			Leds: [],
		};
	}
	
	setSoftwareMode() {
		device.write([0x04, 0x8c, 0x00, 0x0b, 0x30, 0x50, 0x01], 64);
		device.pause(50);
	}

	getDeviceProperties(id) {

		const deviceConfig = EVISIONdeviceLibrary.LEDLibrary[id];

		if(!deviceConfig) {
			console.log(`Unknown Device ID: [${id}]. Reach out to support@signalrgb.com, or visit our Discord to get it added.`);
		}

		return deviceConfig;
	};

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

	Initialize() {
		this.setDeviceProductId(device.productId());

		//Initializing vars
		const deviceHID = device.getDeviceInfo();

		// Fetch model
		const modelID	= forcedModel === "None" ? deviceHID.product : forcedModel;

		this.updateModel(modelID);
	}

	sendColors(overrideColor) {

		if(!this.getModelID() || this.getLedLayout() === "None" || this.getLedLayout() === "QMK") {
			return;
		}

		const deviceLedPositions	= this.getLedPositions();
		const deviceLeds			= this.getLeds();
		const RGBData				= [];

		for (let iIdx = 0; iIdx < deviceLeds.length; iIdx++) {
			const iPxX = deviceLedPositions[iIdx][0];
			const iPxY = deviceLedPositions[iIdx][1];
			let color;

			if(overrideColor){
				color = hexToRgb(overrideColor);
			}else if (LightingMode === "Forced") {
				color = hexToRgb(forcedColor);
			}else{
				color = device.color(iPxX, iPxY);
			}

			if (monochrome) {
				// Convert color to monochrome
				const monochromeValue = Math.max(color[0], color[1], color[2]);

				RGBData[deviceLeds[iIdx]]   = monochromeValue;
			} else {
				RGBData[(deviceLeds[iIdx]*3)]   = color[0];
				RGBData[(deviceLeds[iIdx]*3)+1] = color[1];
				RGBData[(deviceLeds[iIdx]*3)+2] = color[2];
			}
		}

		this.writeRGBPackage(RGBData);
	}

	writeRGBPackage(RGBData){
		const bytesToSend = 24;
		const TotalPackets = Math.ceil(RGBData.length / bytesToSend); 

		for (let index = 0; index < TotalPackets; index++) {
			const data = RGBData.splice(0, bytesToSend);
			
			// Дозаполняем пакет нулями, если в конце осталось меньше 24 байт
			while(data.length < bytesToSend) { data.push(0); }
			
			// Calculate bytes sent
			const bytesSent = this.getHighLow(index * bytesToSend);

			// Calculate checksum
			const checksum = this.calculateChecksum(data, index);

			const header = [0x04, checksum.low, checksum.high, 0x12, bytesToSend, bytesSent.low, bytesSent.high, 0x00];
			const packet = header.concat(data);

			device.write(packet, 64);
			device.pause(2);
		}
	}

	calculateChecksum(packet, index, bytesToSend = 24) {

		const packetSum = packet.reduce((sum, num) => sum + num, 0);

		if (index >= 5) {
			return this.getHighLow(packetSum +(( index - 5 ) * bytesToSend) + 99);
		}

		return this.getHighLow(packetSum + (index * bytesToSend) + 74);
	}

	getHighLow(index) {
		const high = (index >>> 8) & 0xFF;
		const low = index & 0xFF;

		return { high, low };
	}

	updateModel(modelID) {
		const DeviceProperties = this.getDeviceProperties(modelID);

		if(DeviceProperties){
			this.setModelID(modelID);
			this.setDeviceName(DeviceProperties.name);

			device.log(`Device model found: ` + this.getDeviceName());
			device.setName(this.getDeviceName());
			device.setImageFromUrl(DeviceProperties.image);

			if(DeviceProperties.layout === "None"){
				this.setLedLayout(DeviceProperties.layout);
				device.notify("Unsupported mode", `This connection mode isn't supported due to firmware limitations.`, 2);
				console.log("This connection mode isn't supported due to firmware limitations.");
			} else if(DeviceProperties.layout === "QMK"){
				this.setLedLayout(DeviceProperties.layout);
				device.notify("Unsupported firmware", `This device needs to be flashed with a QMK firmware to be supportable.`, 2);
				console.log("This device needs to be flashed with a QMK firmware to be supportable.");
			}else{
				this.setLedLayout(undefined);
				this.setLedNames(DeviceProperties.vLedNames);
				this.setLedPositions(DeviceProperties.vLedPositions);
				this.setLeds(DeviceProperties.vLeds);
				this.detectDeviceEndpoint(DeviceProperties);

				device.setSize(DeviceProperties.size);
				device.setControllableLeds(this.getLedNames(), this.getLedPositions());
				this.setSoftwareMode();
			}
		}else{
			device.notify("Unknown device", `Reach out to support@signalrgb.com, or visit our Discord to get it added.`, 1);
			console.log("Model not found in library!");
			console.log("Unknown protocol for "+ modelID);

			DeviceDiscovery.foundVirtualDevice({
				type: "keyboard",
				name: modelID,
				supported: false,
				vendorId: 0x320F
			});
		}
	}

	detectDeviceEndpoint(deviceLibrary) {

		console.log("Searching for endpoints...");

		const deviceEndpoints = device.getHidEndpoints();

		for (let endpoints = 0; endpoints < deviceLibrary.endpoint.length; endpoints++) {
			const endpoint = deviceLibrary.endpoint[endpoints];

			for (let endpointList = 0; endpointList < deviceEndpoints.length; endpointList++) {
				const currentEndpoint = deviceEndpoints[endpointList];

				if (
					endpoint.interface	=== currentEndpoint.interface	&&
					endpoint.usage		=== currentEndpoint.usage		&&
					endpoint.usage_page	=== currentEndpoint.usage_page	&&
					endpoint.collection	=== currentEndpoint.collection	) {

					this.setDeviceEndpoint(currentEndpoint);
					device.set_endpoint(
						currentEndpoint.interface,
						currentEndpoint.usage,
						currentEndpoint.usage_page,
						currentEndpoint.collection,
					);

					console.log("Endpoint " + JSON.stringify(currentEndpoint) + " found!");

					return;
				}
			}
		}

		console.log(`Endpoints not found in the device! - ${JSON.stringify(deviceLibrary.endpoint)}`);
	}
}

export class deviceLibrary {
	constructor(){
		this.PIDLibrary	=	{
			0x5000: "EVISION Device",
		};

		this.LEDLibrary	=	{

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
			},
		};
	}
}

const EVISIONdeviceLibrary = new deviceLibrary();
const EVISION = new EVISION_Device_Protocol();

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}
