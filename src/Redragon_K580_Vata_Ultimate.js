export function Name() { return "Redragon K580 Vata (Clean)"; }
export function Publisher() { return "Vinodarin"; }
export function Documentation() { return "https://github.com/Vinodarin/Redragon-K580-srgb-plugin"; }
export function DeviceId() { return "Redragon_K580_Vata_5000"; }

// Оставляем только наше устройство
export function Discovery() {
    factory.RegisterUsbDriver(0x320F, 0x5000, 0x0001); 
}

export function Initialize() {
    window.libs.Log("K580 Vata: Initializing...");
    // Прямая отправка инициализации для VS11K33A
    device.write([0x00, 0x04, 0x03, 0x00, 0x00, 0x02], 64);
    device.pause(10);
}

// Рендер оставляем как в рабочем оригинале
export function Render() {
    sendColors();
}

function sendColors() {
    // Логика пакетов из твоего рабочего плагина
    for (let packetIdx = 0; packetIdx < 7; packetIdx++) {
        let packet = new Array(64).fill(0);
        packet[0] = 0x00;
        packet[1] = 0x05;
        packet[2] = 0x01;
        packet[3] = packetIdx;
        packet[4] = 0x00;
        packet[5] = 0x15; // Длина данных в пакете (обычно 21 для этого контроллера)

        for (let i = 0; i < 20; i++) {
            let ledIdx = packetIdx * 20 + i;
            if (ledIdx < vLedNames.length) {
                let color = device.getRGB(vLedPositions[ledIdx][0], vLedPositions[ledIdx][1]);
                packet[6 + i * 3] = color[0];
                packet[7 + i * 3] = color[1];
                packet[8 + i * 3] = color[2];
            }
        }
        device.write(packet, 64);
    }
}

export function OnShutdown() {
    device.write([0x00, 0x04, 0x02, 0x00, 0x00, 0x02], 64);
}

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
