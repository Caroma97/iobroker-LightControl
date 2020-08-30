let Version = "0.0.1" //Skript um Lichter in Helligkeit und Farbtemp global zu steuern - Git: https://github.com/Pittini/iobroker-LightControl - Forum:
log("starting LightControl V." + Version);

let praefix = "javascript.0.Lichtsteuerung" // Skriptordner
let LuxSensor = "wiffi-wz.0.root.192_168_2_131.w_lux"; // Datenpunkt des globalen Luxsensors
const logging = true; // Logging an/aus

//Ab hier nix mehr ändern
let DpCount = 0; //Zähler
const States = []; //Array mit anzulegenden Dps
let IsLuxEvening = false;
let IsTimeSlotActive = false; //Timeslot für Lux Autoauslösung
let ActualLux = getState(LuxSensor).val; //Aktueller Luxwert
//Jede Lightgroup hat x Devices. Jedes Device hat max. 4 Sätze von Dps für an/aus, Helligkeit, Farbtemperatur, Farbe
//Gruppe - Lampen - Funktion (onoff/ct/bri) -  Eigenschaften (id, min Wert, max. Wert, default Wert bei an)
const LightGroups = []; // Array mit den Daten der Device Datenpunkte
const OldPowerState = []; //Speichert bei autom, Aktionen den alten Power Zustand um diesen wiederherstellen zu können
const RampInterval = [];
const BlinkInterval = [];

const Groups = [["Flur Eg"], ["Wohnzimmer"], ["Toilette"], ["Flur Og"], ["Bad"], ["Dach"], ["Schlafzimmer Carlo"], ["Kueche Unterbau"]]; //Initialisiert das Gruppenarray mit den Gruppennamen. In folge werden hier alle Gruppenstates eingelesen

const AutoOffTimeOutObject = [];
//                                           id - min Wert - max. Wert - default Wert bei an - 
LightGroups[0] = [];//Gruppe Flur Eg
LightGroups[0][0] = []; // Strahler1
LightGroups[0][0][0] = ["deconz.0.Lights.680ae2fffe0ca671.on", true, false];
LightGroups[0][0][1] = ["deconz.0.Lights.680ae2fffe0ca671.level", 0, 100, 30];
LightGroups[0][0][2] = ["deconz.0.Lights.680ae2fffe0ca671.ct", 250, 454];

LightGroups[0][1] = [];  // Strahler2
LightGroups[0][1][0] = ["deconz.0.Lights.ec1bbdfffe32de48.on", true, false];
LightGroups[0][1][1] = ["deconz.0.Lights.ec1bbdfffe32de48.level", 0, 100, 5];
LightGroups[0][1][2] = ["deconz.0.Lights.ec1bbdfffe32de48.ct", 250, 454];

LightGroups[0][2] = [];  // Deckenlicht bei Küche/Heizung
LightGroups[0][2][0] = ["yeelight-2.0.color-0x0000000007e3cadb.control.power", true, false];
LightGroups[0][2][1] = ["yeelight-2.0.color-0x0000000007e3cadb.control.active_bright", 0, 100, 5];
LightGroups[0][2][2] = ["yeelight-2.0.color-0x0000000007e3cadb.control.ct", 6500, 2700];
LightGroups[0][2][3] = ["yeelight-2.0.color-0x0000000007e3cadb.control.rgb", "hex", "#FFFFFF"];
LightGroups[0][2][4] = ["yeelight-2.0.color-0x0000000007e3cadb.control.color_mode", true, false];


LightGroups[0][3] = []; //Strahler Tolilettenvorraum
LightGroups[0][3][0] = ["yeelight-2.0.White1.control.power", true, false];
LightGroups[0][3][1] = ["yeelight-2.0.White1.control.active_bright", 0, 100, 5];
LightGroups[0][3][2] = ["yeelight-2.0.White1.control.ct", 6500, 2700];


LightGroups[1] = []; //Gruppe Wohnzimmer
LightGroups[1][0] = []; //Lampe PC
LightGroups[1][0][0] = ["sonoff.0.Sonoff18.POWER", true, false];

LightGroups[1][1] = []; //Drachenlampe
LightGroups[1][1][0] = ["sonoff.0.Sonoff19.POWER", true, false];

LightGroups[1][2] = []; //Stehlampe Couch
LightGroups[1][2][0] = ["sonoff.0.Sonoff20.POWER", true, false];

LightGroups[1][3] = []; //Salzlampe
LightGroups[1][3][0] = ["sonoff.0.Sonoff21.POWER", true, false];

LightGroups[1][4] = [];  //Led Strip am TV
LightGroups[1][4][0] = ["yeelight-2.0.Strip1.control.power", true, false];
LightGroups[1][4][1] = ["yeelight-2.0.Strip1.control.active_bright", 0, 100, 80];
LightGroups[1][4][3] = ["yeelight-2.0.Strip1.control.rgb", "hex", "FF0000"];


LightGroups[1][5] = []; //Kugellampe
LightGroups[1][5][0] = ["deconz.0.Lights.ccccccfffed68f5d.on", true, false];
LightGroups[1][5][1] = ["deconz.0.Lights.ccccccfffed68f5d.level", 0, 100, 25];
LightGroups[1][5][3] = ["deconz.0.Lights.ccccccfffed68f5d.xy", "xy", "0.7329,0.2641", "0.4925,0.4148", "white"]; //rot

LightGroups[1][6] = []; //Strahler
LightGroups[1][6][0] = ["deconz.0.Lights.680ae2fffeae5254.on", true, false];
LightGroups[1][6][1] = ["deconz.0.Lights.680ae2fffeae5254.level", 0, 100, 100];
LightGroups[1][6][3] = ["deconz.0.Lights.680ae2fffeae5254.xy", "xy", "0.7329,0.2641", "0.4925,0.4148", "white"]; //


LightGroups[2] = []; //Gruppe Klo
LightGroups[2][0] = []; //Deckenlampe
LightGroups[2][0][0] = ["deconz.0.Lights.680ae2fffef92c4e.on", true, false];
LightGroups[2][0][1] = ["deconz.0.Lights.680ae2fffef92c4e.level", 0, 100, 10];
LightGroups[2][0][2] = ["deconz.0.Lights.680ae2fffef92c4e.ct", 250, 454];


LightGroups[3] = [];//Gruppe Flur Og
LightGroups[3][0] = []; //Strahlergruppe Colorteil
LightGroups[3][0][0] = ["deconz.0.Lights.ccccccfffed4ee4c.on", true, false]; // Datenpunkt - an Wert - aus Wert
LightGroups[3][0][1] = ["deconz.0.Lights.ccccccfffed4ee4c.level", 0, 100, 30]; // Datenpunkt - min. Wert - max. Wert - Defaultwert
//LightGroups[3][0][2] = ["deconz.0.Lights.ccccccfffed4ee4c.ct", 250, 454]; // Datenpunkt - min. Wert - max. Wert - Defaultwert
LightGroups[3][0][3] = ["deconz.0.Lights.ccccccfffed4ee4c.xy", "xy", "0.4925,0.4148", "0.4925,0.4148", "white"]; // Datenpunkt - Farbsystem - Standardfarbe( Warmweiss) - Farbe für warmweiss - Farbe für Tageslichtweiss 


LightGroups[3][1] = []; //Strahlergruppe Teil2
LightGroups[3][1][0] = ["deconz.0.Lights.588e81fffe0ffd7a.on", true, false];
LightGroups[3][1][1] = ["deconz.0.Lights.588e81fffe0ffd7a.level", 0, 100, 30];
LightGroups[3][1][2] = ["deconz.0.Lights.588e81fffe0ffd7a.ct", 250, 454];

LightGroups[3][2] = []; //Strahlergruppe Teil3
LightGroups[3][2][0] = ["deconz.0.Lights.ec1bbdfffe6fc795.on", true, false];
LightGroups[3][2][1] = ["deconz.0.Lights.ec1bbdfffe6fc795.level", 0, 100, 30];
LightGroups[3][2][2] = ["deconz.0.Lights.ec1bbdfffe6fc795.ct", 250, 454];

LightGroups[4] = [];//Gruppe Bad
LightGroups[4][0] = []; //Deckenleuchte
LightGroups[4][0][0] = ["deconz.0.Lights.588e81fffeae2ae0.on", true, false];
LightGroups[4][0][1] = ["deconz.0.Lights.588e81fffeae2ae0.level", 0, 100, 25];
LightGroups[4][0][2] = ["deconz.0.Lights.588e81fffeae2ae0.ct", 250, 454];

LightGroups[5] = [];//Gruppe Dach
LightGroups[5][0] = []; //Klemmstrahler Dachflur
LightGroups[5][0][0] = ["deconz.0.Lights.680ae2fffeaddb07.on", true, false];
LightGroups[5][0][1] = ["deconz.0.Lights.680ae2fffeaddb07.level", 0, 100, 25];
LightGroups[5][0][2] = ["deconz.0.Lights.680ae2fffeaddb07.ct", 250, 454];

LightGroups[5][1] = []; //Klemmstrahler Dachtreppe
LightGroups[5][1][0] = ["deconz.0.Lights.588e81fffe409146.on", true, false];
LightGroups[5][1][1] = ["deconz.0.Lights.588e81fffe409146.level", 0, 100, 40];
LightGroups[5][1][2] = ["deconz.0.Lights.588e81fffe409146.ct", 250, 454];

LightGroups[6] = [];//Gruppe Schlafzimmer Carlo
LightGroups[6][0] = []; //Nachttischlampe Carlo
LightGroups[6][0][0] = ["deconz.0.Lights.680ae2fffec81608.on", true, false];
LightGroups[6][0][1] = ["deconz.0.Lights.680ae2fffec81608.level", 0, 100, 40];
LightGroups[6][0][2] = ["deconz.0.Lights.680ae2fffec81608.ct", 250, 454];

LightGroups[6][1] = []; //Nachtischlampe 2 (gold)
LightGroups[6][1][0] = ["deconz.0.Lights.ccccccfffea91336.on", true, false];
LightGroups[6][1][1] = ["deconz.0.Lights.ccccccfffea91336.level", 0, 100, 50];

LightGroups[7] = [];//Gruppe Küche
LightGroups[7][0] = []; //Unterbau Leds
LightGroups[7][0][0] = ["deconz.0.Lights.d0cf5efffebe553c.on", true, false];
LightGroups[7][0][1] = ["deconz.0.Lights.d0cf5efffebe553c.level", 0, 100, 100];
LightGroups[7][0][2] = ["deconz.0.Lights.d0cf5efffebe553c.ct", 250, 454];


let CheckCount = 0;
let Dps = [".Power", ".Bri", ".Ct", ".Color", ".AutoOffTime", ".AutoOff", ".NoAutoOffWhenMotion", ".MotionDp", ".AutoOn", ".AutoOnLux", ".LuxDp", ".AdaptiveBri", ".AdaptiveCt", ".RampOn", ".RampOff", ".RampOnTime", ".RampOffTime", ".BlinkEnabled", ".Blink", ".OnOverride", ".UseBriDefaults"]

// 0=".Power", 1=".Bri",2= ".Ct",3= ".Color", 4=".AutoOffTime", 5=".AutoOff", 6=".NoAutoOffWhenMotion", 7=".MotionDp", 8=".AutoOn", 9=".AutoOnLux", 10=".LuxDp", 11=".AdaptiveBri", 12=".AdaptiveCt",
// 13=".RampOn", 14=".RampOff", 15=".RampOnTime", 16=".RampOffTime", 17=".BlinkEnabled", 18=".Blink", 19=".OnOverride", 20= ".UseBriDefaults"


for (let x = 0; x < Groups.length; x++) {
    //Datenpunkte global
    States[DpCount] = { id: praefix + "." + x + ".Power", initial: false, forceCreation: false, common: { read: true, write: true, name: "Gruppe aktiv", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".Bri", initial: 50, forceCreation: false, common: { read: true, write: true, name: "Helligkeit", type: "number", unit: "%", def: 50 } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".Ct", initial: 100, forceCreation: false, common: { read: true, write: true, name: "Farbtemperatur", type: "number", unit: "%", def: 100 } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".Color", initial: "#FFFFFF", forceCreation: false, common: { read: true, write: true, name: "Farbe", type: "string", def: "#FFFFFF" } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".AutoOffTime", initial: 0, forceCreation: false, common: { read: true, write: true, name: "Zeit nach der die Gruppe abgeschaltet wird", type: "number", unit: "s", def: 0 } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".AutoOff", initial: false, forceCreation: false, common: { read: true, write: true, name: "Gruppe automatisch abschalten?", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".NoAutoOffWhenMotion", initial: false, forceCreation: false, common: { read: true, write: true, name: "Kein AutoOff bei erkannter Bewegung?", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".MotionDp", initial: "", forceCreation: false, common: { read: true, write: true, name: "Datenpunkt des Bewegungsmelders?", type: "string", def: "" } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".AutoOn", initial: false, forceCreation: false, common: { read: true, write: true, name: "Gruppe bei Bewegung automatisch anschalten?", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".AutoOnLux", initial: 80, forceCreation: false, common: { read: true, write: true, name: "Helligkeit für AutoOn", type: "number", unit: "Lux", def: 80 } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".LuxDp", initial: "", forceCreation: false, common: { read: true, write: true, name: "Datenpunkt des Helligkeitssensors?", type: "string", def: "" } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".AdaptiveBri", initial: false, forceCreation: false, common: { read: true, write: true, name: "Helligkeit mit Aussenhelligkeit steuern?", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".AdaptiveCt", initial: false, forceCreation: false, common: { read: true, write: true, name: "Farbtemperatur durch Tageszeit steuern?", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".RampOn", initial: false, forceCreation: false, common: { read: true, write: true, name: "Bei anschalten Helligkeit langsam hochfahren?", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".RampOff", initial: false, forceCreation: false, common: { read: true, write: true, name: "Bei ausschalten Helligkeit langsam runterfahren?", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".RampOnTime", initial: 5, forceCreation: false, common: { read: true, write: true, name: "Zeit für RampOn", type: "number", unit: "s", def: 5 } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".RampOffTime", initial: 10, forceCreation: false, common: { read: true, write: true, name: "Zeit für RampOff", type: "number", unit: "s", def: 10 } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".BlinkEnabled", initial: true, forceCreation: false, common: { read: true, write: true, name: "Aktiviert kurzes blinken", type: "boolean", def: true } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".Blink", initial: false, forceCreation: false, common: { read: true, write: true, name: "Löst kurzes blinken aus", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".OnOverride", initial: false, forceCreation: false, common: { read: true, write: true, name: "Putzlicht - Anschalten mit 100%, weiß, keinerlei Effekte", type: "boolean", def: false } };
    DpCount++;
    States[DpCount] = { id: praefix + "." + x + ".UseBriDefaults", initial: false, forceCreation: false, common: { read: true, write: true, name: "Sollen die Helligkeits Defaultwerte der Devices verwendet werden?", type: "boolean", def: false } };
    DpCount++;


};
States[DpCount] = { id: praefix + "." + "all" + ".Power", initial: false, forceCreation: false, common: { read: true, write: true, name: "Gruppe aktiv", type: "boolean", def: false } };
DpCount++;
States[DpCount] = { id: praefix + "." + "all" + ".Bri", initial: 50, forceCreation: false, common: { read: true, write: true, name: "Helligkeit", type: "number", unit: "%", def: 50 } };
DpCount++;
States[DpCount] = { id: praefix + "." + "all" + ".Ct", initial: 100, forceCreation: false, common: { read: true, write: true, name: "Farbtemperatur", type: "number", unit: "%", def: 100 } };
DpCount++;
States[DpCount] = { id: praefix + "." + "all" + ".AutoOffTime", initial: 0, forceCreation: false, common: { read: true, write: true, name: "Zeit nach der die Gruppe abgeschaltet wird", type: "number", unit: "s", def: 0 } };
DpCount++;
States[DpCount] = { id: praefix + "." + "all" + ".AutoOff", initial: false, forceCreation: false, common: { read: true, write: true, name: "Gruppe automatisch abschalten?", type: "boolean", def: false } };
DpCount++;
States[DpCount] = { id: praefix + "." + "all" + ".NoAutoOffWhenMotion", initial: false, forceCreation: false, common: { read: true, write: true, name: "Kein AutoOff bei erkannter Bewegung?", type: "boolean", def: false } };
DpCount++;
States[DpCount] = { id: praefix + "." + "all" + ".MotionDp", initial: "", forceCreation: false, common: { read: true, write: true, name: "Datenpunkt des Bewegungsmelders?", type: "string", def: "" } };

//Alle States anlegen, Main aufrufen wenn fertig
let numStates = States.length;
States.forEach(function (state) {
    createState(state.id, state.initial, state.forceCreation, state.common, function () {
        numStates--;
        if (numStates === 0) {
            if (logging) log("CreateStates fertig!");
            for (let x = 0; x < Groups.length; x++) {
                setObject(praefix + "." + x, { type: 'device', common: { name: Groups[x][0] }, native: {} });
            };
            main();
        };
    });
});

function main() {
    log("Reaching main");
    Init();
    CreateTrigger();
}

function Init() {
    log("Reaching Init");

    for (let x = 0; x < Groups.length; x++) { //Alle Gruppen durchgehen und Werte aller Dps in Group Array einlesen
        OldPowerState[x] = [];
        Groups[x][50] = Groups[x][0]; //Den zum initialisieren genutzten Namen von Index 0 auf 50 kopieren um 0 wieder frei zu haben für die Loop
        for (let y = 0; y < Dps.length; y++) {
            Groups[x][y] = getState(praefix + "." + x + Dps[y]).val;
            //log("Groups[x][50]=" + Groups[x][50] + " Groups[x][y]=" + Groups[x][y] + " x=" + x + " y=" + y);
            OldPowerState[x][y] = null; //Hilfsvariable für alten Powerstate mit null initialisieren
        };
    };
}

function ClrTimeOut(gruppe) {
    log("Reaching ClrTimeOut(gruppe) Gruppe=" + gruppe);

    if (typeof AutoOffTimeOutObject[gruppe] == "object") {
        clearTimeout(AutoOffTimeOutObject[gruppe]);
    };
}



function SetAutoOff(gruppe) { //Schaltet Gruppe nach pro Gruppe vorgegbenenr Zeit aus. Berücksichtigt Bewegung.
    log("Reaching SetAutoOff(gruppe) Gruppe=" + gruppe);
    ClrTimeOut(gruppe); //Alten Timeout löschen
    let MoveMent = false;
    if (typeof Groups[gruppe][7] == "undefined" || Groups[gruppe][7] == "") { //Wenn kein Bewegungsmelder definiert
        MoveMent = false; // //Movement auf false da sonst nie abschaltung erfolgt
    } else {
        MoveMent = getState(Groups[gruppe][7]).val //Movement entspricht Wert des Bewegungsmelders
    };

    if (Groups[gruppe][5]) { //Nur wenn AutoOff aktiv ist.
        AutoOffTimeOutObject[gruppe] = setTimeout(function () { //
            if (typeof Groups[gruppe][7] == "undefined" || Groups[gruppe][7] == "") { //Wenn kein Bewegungsmelder definiert
                MoveMent = false; // //Movement auf false da sonst nie abschaltung erfolgt
            } else {
                MoveMent = getState(Groups[gruppe][7]).val //Movement entspricht Wert des Bewegungsmelders
            };

            if (Groups[gruppe][6] && !MoveMent) { //AutoOff ausführen wenn keine Bewegung
                setState(praefix + "." + gruppe + ".Power", false);
                log("Gruppe autom. deaktiviert");
            }
            else if (Groups[gruppe][6] && MoveMent) { //AutoOff blocken da Bewegung und Timeout neustarten
                SetAutoOff(gruppe);
                log("Gruppe " + gruppe + " Motion detected, canceling autooff and restarting timeout");
            };
        }, parseInt(Groups[gruppe][4]) * 1000); //AutoOffzeit
    };
}

function SetAutoOn(gruppe) { //Schaltet Gruppe für nach pro Gruppe vorgegebener Zeit bei Bewegung an.
    log("Reaching SetAutoOn(gruppe) Gruppe=" + gruppe);
    let UseLux = ActualLux;
    if (Groups[gruppe][10] != "" && typeof Groups[gruppe][10] != "undefined") UseLux = getState(Groups[gruppe][10]).val
    if (Groups[gruppe][8] && Groups[gruppe][9] <= UseLux) {
        DoAction(gruppe, true);
    };
}

function DoPower(gruppe, onoff) {
    log("Reaching DoPower(gruppe, onoff) Gruppe=" + gruppe + " onoff=" + onoff);

    for (let x = 0; x < LightGroups[gruppe].length; x++) {
        if (onoff) {
            setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten
            log("Datapoint " + LightGroups[gruppe][x][0][0] + " set to " + LightGroups[gruppe][x][0][1] + "what means, switched on")
        } else {
            setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][2]);  //Ausschalten
            log("Datapoint " + LightGroups[gruppe][x][0][0] + " set to " + LightGroups[gruppe][x][0][2] + "what means, switched off")
        };
    };
}

// 0=".Power", 1=".Bri",2= ".Ct",3= ".Color", 4=".AutoOffTime", 5=".AutoOff", 6=".NoAutoOffWhenMotion", 7=".MotionDp", 8=".AutoOn", 9=".AutoOnLux", 10=".LuxDp", 11=".AdaptiveBri", 12=".AdaptiveCt",
// 13=".RampOn", 14=".RampOff", 15=".RampOnTime", 16=".RampOffTime", 17=".BlinkEnabled", 18=".Blink", 19=".OnOverride", 20= ".UseBriDefaults"

function DoAction(gruppe, onoff, color = "white") { //Gruppe an/aus schalten
    log("Reaching DoAction(gruppe, onoff,color) Gruppe=" + gruppe + "=" + Groups[gruppe][50] + " onoff=" + onoff + " color=" + color);

    if (onoff && Groups[gruppe][5]) SetAutoOff(gruppe);


    RampInterval[gruppe] = [];
    let RampSteps = 20;
    let AdaptiveBri = GetAdaptiveBri();

    for (let x = 0; x < LightGroups[gruppe].length; x++) { //Gruppenmitglieder durchlaufen
        let TempBri = 2;
        if (onoff) { // Anschalten
            log(typeof LightGroups[gruppe][x][1])
            if (typeof LightGroups[gruppe][x][1] != "undefined") { //Ein Eintrag für Helligkeitssteuerung ist vorhanden
                //log("RampOn=" + Groups[gruppe][13])
                if (Groups[gruppe][13]) { //RampOn ist aktiviert
                    if (typeof LightGroups[gruppe][x][1][3] != "undefined" && Groups[gruppe][11]) { // Device hat Bri Funktion und AdaptiveBri ist aktiviert
                        setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten
                        setState(LightGroups[gruppe][x][1][0], 2); //Helligkeit setzen 

                        RampInterval[gruppe][x] = setInterval(function () { //
                            setState(LightGroups[gruppe][x][1][0], TempBri); //Helligkeit setzen 
                            TempBri += LightGroups[gruppe][x][1][3] / RampSteps;
                            if (TempBri + LightGroups[gruppe][x][1][3] / RampSteps > AdaptiveBri) {
                                clearInterval(RampInterval[gruppe][x]);
                            };
                        }, parseInt(Groups[gruppe][15]) * 1000 / RampSteps); //

                        log("Group " + Groups[gruppe][50] + " switched ramped on. Device=" + LightGroups[gruppe][x][1][0] + ", and set brightness adaptive to: " + AdaptiveBri);
                    }
                    else if (typeof LightGroups[gruppe][x][1][3] != "undefined" && Groups[gruppe][20]) { // Device hat Bri Funktion und UseBriDefaults ist aktiviert
                        setState(LightGroups[gruppe][x][1][0], 2); //Helligkeit setzen 
                        setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten

                        RampInterval[gruppe][x] = setInterval(function () { //
                            setState(LightGroups[gruppe][x][1][0], TempBri); //Helligkeit setzen 
                            TempBri += LightGroups[gruppe][x][1][3] / RampSteps;
                            //log("TempBri" + TempBri);

                            if (TempBri + LightGroups[gruppe][x][1][3] / RampSteps > LightGroups[gruppe][x][1][3]) {
                                clearInterval(RampInterval[gruppe][x]);
                            };
                        }, parseInt(Groups[gruppe][15]) * 1000 / RampSteps); //

                        log("Group " + Groups[gruppe][50] + " switched ramped on. Device=" + LightGroups[gruppe][x][1][0] + ", and set brightness to default: " + LightGroups[gruppe][x][1][3]);
                    }
                }
                else {
                    if (typeof LightGroups[gruppe][x][1][3] != "undefined" && Groups[gruppe][11]) { // Device hat Bri Funktion und AdaptiveBri ist aktiviert
                        let TempBri = AdaptiveBri;
                        //if (TempBri > LightGroups[gruppe][x][1][3]) TempBri = LightGroups[gruppe][x][1][3];
                        setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten
                        setState(LightGroups[gruppe][x][1][0], TempBri); //Helligkeit setzen 
                        log("Group " + Groups[gruppe][50] + " switched on. Device=" + LightGroups[gruppe][x][1][0] + ", and set brightness adaptive to: " + AdaptiveBri);
                    }
                    else if (typeof LightGroups[gruppe][x][1][3] != "undefined" && Groups[gruppe][20]) { // Device hat Bri Funktion und UseBriDefaults ist aktiviert
                        setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten
                        setState(LightGroups[gruppe][x][1][0], LightGroups[gruppe][x][1][3]); //Helligkeit setzen 
                        log("Group " + Groups[gruppe][50] + " switched on. Device=" + LightGroups[gruppe][x][1][0] + ", and set brightness to default: " + LightGroups[gruppe][x][1][3]);
                    };

                };

            } else { //Kein Eintrag für Helligkeitssteuerung vorhanden, vermutlich Schaltsteckdose
                if (Groups[gruppe][13]) { //Wenn Rampe aktiv, Erst nach Ablauf der Rampenzeit schalten
                    setTimeout(function () { //
                        setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten
                        log("Group " + Groups[gruppe][50] + " just switched ramped on. Device=" + LightGroups[gruppe][x][0][0]);
                    }, parseInt(Groups[gruppe][16]) * 1000); //
                } else {
                    setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten
                    log("Group " + Groups[gruppe][50] + " just switched on. Device=" + LightGroups[gruppe][x][0][0]);
                };
            };
        } else { //Ausschalten
            if (Groups[gruppe][14]) { // RampOff ist aktiviert
                if (typeof LightGroups[gruppe][x][1] != "undefined") { // Device hat Bri Funktion 
                    TempBri = getState(LightGroups[gruppe][x][1][0]).val; //Aktuellen Wert lesen
                    let Faktor = (TempBri / RampSteps);
                    log("A Faktor=" + Faktor + " TempBri=" + TempBri);
                    RampInterval[gruppe][x] = setInterval(function () { //
                        TempBri = TempBri - Faktor;
                        log("Faktor=" + Faktor + " TempBri=" + TempBri);
                        setState(LightGroups[gruppe][x][1][0], TempBri); //Helligkeit setzen 

                        if (TempBri - Faktor <= 2) {
                            clearInterval(RampInterval[gruppe][x]);
                            setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][2]);  //Ausschalten
                        };
                    }, parseInt(Groups[gruppe][16]) * 1000 / RampSteps); //
                } else { // Device hat keine Bri Funktion - simple Lampe oder Schaltsteckdose
                    setTimeout(function () { //TimeOut setzen um diese Devices erst nach Ablauf der Rampe der anderen Devices zu aktivieren
                        setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][2]); //Ausschalten der Geräte ohne Helligkeitssteuerung erst nach Ablauf der rampofftime
                        log("Schaltsteckdosen ausgeschaltet");
                    }, parseInt(Groups[gruppe][16]) * 1000); //
                };
            } else { // Kein RampOff
                setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][2]);  //Simples Ausschalten

            };
            ClrTimeOut(gruppe);
            if (typeof LightGroups[gruppe][x][1] != "undefined") {  // Device hat Bri Funktion 
                log("Group " + Groups[gruppe][50] + " switched off. Device=" + LightGroups[gruppe][x][1][0]);
            };

        };
    };

    if (onoff) { //bei anschalten
        DoColor(gruppe, Groups[gruppe][3]); //Farbe setzen 

        if (Groups[gruppe][2]) {//Wenn Adaptive Ct ist aktiviert
            DoCt(gruppe, GetAdaptiveCt()); //Adaptive ct Wert setzen
        } else {
            DoCt(gruppe, Groups[gruppe][2]); //ct Wert aus Gruppe setzen
        };

    };

    //log("Groups[gruppe][3]=" + Groups[gruppe][3])
}

function DoCt(gruppe, ct) { //Farbtemperatur
    log("Reaching DoCt(gruppe, ct) Gruppe=" + gruppe + " ct=" + ct)
    for (let x = 0; x < LightGroups[gruppe].length; x++) {
        log("typeof LightGroups[gruppe][x][2]=" + typeof LightGroups[gruppe][x][2]);
        if (typeof LightGroups[gruppe][x][2] !== "undefined") { // Device hat ct Funktion
            let ProzCt = (LightGroups[gruppe][x][2][2] - LightGroups[gruppe][x][2][1]) / 100 // =1% als Wert
            let TempVal = Math.abs(parseInt(LightGroups[gruppe][x][2][1] + (ProzCt * ct)));
            log("(ProzCt * ct)=" + (ProzCt * ct) + " LightGroups[gruppe][x][2][1]=" + LightGroups[gruppe][x][2][1] + " ProzCt=" + ProzCt + " TempVal=" + TempVal + " typeof LightGroups[gruppe][x][2][0]=" + typeof LightGroups[gruppe][x][2][0])
            setState(LightGroups[gruppe][x][2][0], TempVal);
        } else if (typeof LightGroups[gruppe][x][2] == "undefined" && typeof LightGroups[gruppe][x][3] !== "undefined") { //Device hat keine ct Funktion, aber color Funktion
            if (ct >= 50) {
                if (typeof LightGroups[gruppe][x][3][3] !== "undefined") {
                    setState(LightGroups[gruppe][x][3][0], LightGroups[gruppe][x][3][3]); //Device auf Farbe, entsprechend warmweiss setzen  
                    log("No ct function, but color function found, setting color to: " + LightGroups[gruppe][x][3][3] + ", what should be warmwhite" + " DeviceDp=" + LightGroups[gruppe][x][3][0])
                };
            } else {
                if (typeof LightGroups[gruppe][x][3][4] !== "undefined") {
                    setState(LightGroups[gruppe][x][3][0], LightGroups[gruppe][x][3][4]); //Device auf Farbe, entsprechend tagesweiss setzen  
                    log("No ct function, but color function found, setting color to: " + LightGroups[gruppe][x][3][4] + ", what should be daywhite" + " DeviceDp=" + LightGroups[gruppe][x][3][0])
                };
            };
        };
        if (x == LightGroups[gruppe].length - 1) { //Letzter Durchlauf des Zyklus
            return true;
        };
    };
}

function DoBri(gruppe, bri) { //Helligkeit
    log("Reaching DoBri(gruppe, bri gruppe=)" + gruppe + " bri=" + bri)
    let newbri;
    for (let x = 0; x < LightGroups[gruppe].length; x++) { //Alle Devices der Gruppe durchgehen
        if (typeof LightGroups[gruppe][x][1] != "undefined") {
            if (Groups[gruppe][20] && !Groups[gruppe][19] ) { //UseBriDefaults des Devices nutzen und mit geforderter Helligkeit verrechnen, jedoch nur wenn kein OnOverride
                log("Calculated Bri=" + (bri * (LightGroups[gruppe][x][1][3] / 100)) + " Incoming Bri=" + bri + " DeviceDefaultBri=" + LightGroups[gruppe][x][1][3])
                newbri = bri * (LightGroups[gruppe][x][1][3] / 100);
                setState(LightGroups[gruppe][x][1][0], newbri);
                log("newbri=" + newbri + "% relative Brightness DeviceDp=" + LightGroups[gruppe][x][1][0]);
            } else {
                setState(LightGroups[gruppe][x][1][0], bri); //Bri direkt setzen
                log("bri=" + bri + "% absolute Brightness Lightgroup=" + LightGroups[gruppe][x][1][0]);

            };
        };
        if (x == LightGroups[gruppe].length - 1) { //Letzter Durchlauf des Zyklus
            return true;
        };
    };
}

function DoColor(gruppe, color) { //Farbe
    log("Reaching DoColor(gruppe, color) - gruppe=" + gruppe + " color=" + color)
    let TempColor;
    log("incoming color is " + color + " color.substring(0, 1)=" + color.substring(0, 1) + " color.length=" + color.length);

    // Farbsystem von color bestimmen und nach rgb konvertieren
    if (color.substring(0, 1) == "#" && color.length == 7) { //Wenn Hexfarbe wie "#FFFFFF"
        log("incoming color is hex " + color.substring(0, 1) + " " + color.length);
        TempColor = ConvertHexToRgb(color);
        //log(TempColor)
    }
    else if (color.substring(4, 1) == "," && color.substring(8, 1) == ",") {
        log("incoming color is rgb");
        TempColor = color;
    }
    else if (Object.keys(cssKeywords).indexOf(color.toLowerCase()) != -1) {
        log("incoming color is namedcolor ");
        log("rgb=" + ConvertKeywordToRgb(color.toLowerCase()));
        TempColor = ConvertKeywordToRgb(color.toLowerCase());
    }
    color = TempColor; //color ist nun dediziert rgb
    log("incoming color simplyfied to rgb=" + color + " now converting this rgb to the targets colorsystem")

    // Konvertiertes RGB umwandeln zu Zielfarbsystem pro Device
    for (let x = 0; x < LightGroups[gruppe].length; x++) { //Alle Devices der Gruppe durchgehen
        if (typeof LightGroups[gruppe][x][3] != "undefined") { //Nachfolgendes nur ausführen wenn ein Arrayeintrag für Farbe vorhanden

            log("color=" + color + " Lightgroup=" + LightGroups[gruppe][x][3][0]);

            switch (LightGroups[gruppe][x][3][1]) {
                case "rgb":
                    log("Targets colorsystem is: rgb");
                    TempColor = color;
                    break;
                case "xy":
                    log("Targets colorsystem is: xy");
                    TempColor = ConvertRgbToXy(color);
                    break;
                case "hex":
                    log("Targets colorsystem is: hex");
                    TempColor = "#" + ConvertRgbToHex(color);
                    break;
                case "hsl":
                    log("Targets colorsystem is: hsl");
                    TempColor = ConvertRgbToHsl(color);
                    break;
                default:
            };
            log("TempColor=" + TempColor);
            if (typeof LightGroups[gruppe][x][4] != "undefined") { //Device hat Farbe/weiss umschaltung
                log("Found Device with colormode switch. DeviceDp=" + LightGroups[gruppe][x][4][0]);
                if (color.toString() == "255,255,255") { //Farbe weiss gefordert
                    setStateDelayed(LightGroups[gruppe][x][4][0], LightGroups[gruppe][x][4][2], 0); //Weissmodus aktivieren
                    log("switched to whitemode, color=" + color + " colormode=" + LightGroups[gruppe][x][4][2]);
                } else {
                    setStateDelayed(LightGroups[gruppe][x][4][0], LightGroups[gruppe][x][4][1], 0); //Farbmodus aktivieren
                    log("switched to colormode, color=" + color + " colormode=" + LightGroups[gruppe][x][4][1]);
                };
            };
            setStateDelayed(LightGroups[gruppe][x][3][0], TempColor.toString(), 0);
        };
                if (x == LightGroups[gruppe].length - 1) { //Letzter Durchlauf des Zyklus
            return true;
        };
    };
}

function GetAdaptiveBri() {
    log("Reaching GetAdaptiveBri()")
    let bri = ActualLux / 10;
    if (bri < 2) {
        bri = 2;
    } else if (bri > 100) {
        bri = 100;
    };
    log("Adaptive bri set to " + bri)

    return bri;
}

function GetAdaptiveCt() { //
    log("Reaching GetAdaptiveCt()")
    let ct = 0;
    let now = new Date();
    let EpochNow = now.getTime();
    let EpochGoldenHour = getAstroDate("goldenHour").getTime();
    let EpochGoldenHourEnd = getAstroDate("goldenHourEnd").getTime();

    if (EpochNow > EpochGoldenHourEnd && EpochNow < EpochGoldenHour) { //Wenn aktuelle Zeit zwischen blauer und goldener Stunde ist (Tag)
        ct = 100;
    } else {
        ct = 100;
    };

    log("Adaptive ct set to " + ct)
    //Ikea 2200-4000
    //2800-warm/abend 4000-tag 5500-kalt/morgen
    return ct;
}


function Blink(gruppe, farbe) {
    log("Reaching Blink(gruppe)=" + gruppe)
    let onoff;
    let MaxBlinks = 2; // Maximale Anzahl der Blinkvorgänge, ein blinken ist an und aus.
    let counter = 1;

    //log("x=" + x + "LightGroups[gruppe][x][0][0]=" + LightGroups[gruppe][x][0][0] + " LightGroups[gruppe][x][0][1]" + LightGroups[gruppe][x][0][1] + " LightGroups[gruppe][x][0][2]" + LightGroups[gruppe][x][0][2])
    for (let x = 0; x < LightGroups[gruppe].length; x++) {
        OldPowerState[gruppe][x] = getState(LightGroups[gruppe][x][0][0]).val;
        onoff = OldPowerState[gruppe][x];
        if (onoff) {
            //log("1 " + LightGroups[gruppe][x][0][0] + " " + OldPowerState[gruppe][x]);
            setStateDelayed(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1], 0); //Anschalten
            onoff = false;
        } else {
            // log("2 " + LightGroups[gruppe][x][0][0] + " " + OldPowerState[gruppe][x]);
            setStateDelayed(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][2], 0); //Ausschalten
            onoff = true;
        };
    };

    BlinkInterval[gruppe] = setInterval(function () {
        for (let x = 0; x < LightGroups[gruppe].length; x++) {
            // log("3 " + LightGroups[gruppe][x][0][0] + " " + OldPowerState[gruppe][x]);

            if (onoff) {
                setStateDelayed(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1], 0); //Anschalten
                onoff = false;
            } else {
                setStateDelayed(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][2], 0); //Ausschalten
                onoff = true;
            };
        };

        counter++;
        if (counter >= MaxBlinks * 2 - 1) {
            for (let x = 0; x < LightGroups[gruppe].length; x++) {
                // log("4 " + LightGroups[gruppe][x][0][0] + "= " + OldPowerState[gruppe][x]);

                setStateDelayed(LightGroups[gruppe][x][0][0], OldPowerState[gruppe][x], 0)
            };
            clearInterval(BlinkInterval[gruppe]);
        };
    }, 2000);



}

function RampOn(gruppe) {
    log("Reaching RampOn(gruppe)=" + gruppe)


}

function RampOff(gruppe) {
    log("Reaching RampOff(gruppe)=" + gruppe)


}
function OnOverride(gruppe, onoff) {
    log("Reaching OnOverride(gruppe, onoff) gruppe=" + gruppe + " onoff=" + onoff)

    for (let x = 0; x < LightGroups[gruppe].length; x++) {
        if (onoff) {
            setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][1]); //Anschalten
        } else {
            setState(LightGroups[gruppe][x][0][0], LightGroups[gruppe][x][0][2]); //Ausschalten
        };
        if (x == LightGroups[gruppe].length - 1 && onoff) { //Erst wenn Durchlauf fertig ist (async Problem vermeiden) und anschaltung
            log("Setting bri after full On cycle")
            DoBri(gruppe, 100);//Helligkeit 100%
            DoColor(gruppe, "white"); //Farbe auf weiss

        };
    };
}

// 0=".Power", 1=".Bri",2= ".Ct",3= ".Color", 4=".AutoOffTime", 5=".AutoOff", 6=".NoAutoOffWhenMotion", 7=".MotionDp", 8=".AutoOn", 9=".AutoOnLux", 10=".LuxDp", 11=".AdaptiveBri", 12=".AdaptiveCt",
// 13=".RampOn", 14=".RampOff", 15=".RampOnTime", 16=".RampOffTime", 17=".BlinkEnabled", 18=".Blink", 19=".OnOverride", 20= ".UseBriDefaults"

function SetBwmTrigger(Dp, OldDp, gruppe) {
    log("Reaching SetBwmTrigger(Dp, OldDp)=" + Dp + " " + OldDp + " gruppe=" + gruppe);
    //if (OldDp != "") unsubscribe(OldDp);
    if (unsubscribe(OldDp)) {
        log("Subscription for " + OldDp + " deleted");
    };
    on(Dp, function (dp) { //Bei Statusänderung Bewegung
        if (Groups[gruppe][6] && Groups[gruppe][0] && Groups[gruppe][5]) {

            if (dp.state.val) { //Bei Bewegung
                SetAutoOn(gruppe);
                //ClrTimeOut(gruppe)
            } else { //Keine Bewegung

                //SetAutoOff(gruppe)
            }
        }

    });
}

function CreateTrigger() {
    on(LuxSensor, function (dp) { //Bei Statusänderung
        ActualLux = dp.state.val;
    });

    //Gruppen
    // 0=".Power", 1=".Bri",2= ".Ct",3= ".Color", 4=".AutoOffTime", 5=".AutoOff", 6=".NoAutoOffWhenMotion", 7=".MotionDp", 8=".AutoOn", 9=".AutoOnLux", 10=".LuxDp", 11=".AdaptiveBri", 12=".AdaptiveCt",
    // 13=".RampOn", 14=".RampOff", 15=".RampOnTime", 16=".RampOffTime", 17=".BlinkEnabled", 18=".Blink", 19=".OnOverride", 20= ".UseBriDefaults"
    for (let x = 0; x < Groups.length; x++) {
        on({ id: praefix + "." + x + ".Power", change: "ne" }, function (dp) { //Bei Statusänderung Power
            //DoAction(x, dp.state.val);
            Groups[x][0] = dp.state.val;
            DoAction(x, dp.state.val, Groups[x][3]);
        });
        on(praefix + "." + x + ".Bri", function (dp) { //Bei Statusänderung Helligkeit
            Groups[x][1] = dp.state.val;
            DoBri(x, dp.state.val);
        });
        on(praefix + "." + x + ".Ct", function (dp) { //Bei Statusänderung Farbtemperatur
            Groups[x][2] = dp.state.val;
            DoCt(x, dp.state.val);
        });
        on(praefix + "." + x + ".ColorRgb", function (dp) { //Bei Statusänderung Farbe
            Groups[x][3] = dp.state.val;
            DoColor(x, dp.state.val);
        });
        on(praefix + "." + x + ".AutoOffTime", function (dp) { //Bei Statusänderung 
            Groups[x][4] = dp.state.val;
        });
        on(praefix + "." + x + ".AutoOff", function (dp) { //Bei Statusänderung
            Groups[x][5] = dp.state.val;
        });
        // 0=".Power", 1=".Bri",2= ".Ct",3= ".Color", 4=".AutoOffTime", 5=".AutoOff", 6=".NoAutoOffWhenMotion", 7=".MotionDp", 8=".AutoOn", 9=".AutoOnLux", 10=".LuxDp", 11=".AdaptiveBri", 12=".AdaptiveCt",
        // 13=".RampOn", 14=".RampOff", 15=".RampOnTime", 16=".RampOffTime", 17=".BlinkEnabled", 18=".Blink", 19=".OnOverride", 20= ".UseBriDefaults"

        on(praefix + "." + x + ".NoAutoOffWhenMotion", function (dp) { //Bei Statusänderung
            Groups[x][6] = dp.state.val;
        });
        on(praefix + "." + x + ".MotionDp", function (dp) { //Bei Statusänderung
            Groups[x][7] = dp.state.val;
        });
        on(praefix + "." + x + ".AutoOn", function (dp) { //Bei Statusänderung
            Groups[x][8] = dp.state.val;
        });
        on(praefix + "." + x + ".AutoOnLux", function (dp) { //Bei Statusänderung
            Groups[x][9] = dp.state.val;
        });
        on(praefix + "." + x + ".LuxDp", function (dp) { //Bei Statusänderung
            Groups[x][10] = dp.state.val;
        });
        on(praefix + "." + x + ".AdaptiveBri", function (dp) { //Bei Statusänderung
            Groups[x][11] = dp.state.val;
        });
        on(praefix + "." + x + ".AdaptiveCt", function (dp) { //Bei Statusänderung
            Groups[x][12] = dp.state.val;
        });
        on(praefix + "." + x + ".RampOn", function (dp) { //Bei Statusänderung
            Groups[x][13] = dp.state.val;
        });
        on(praefix + "." + x + ".RampOff", function (dp) { //Bei Statusänderung
            Groups[x][14] = dp.state.val;
        });
        on(praefix + "." + x + ".RampOnTime", function (dp) { //Bei Statusänderung
            Groups[x][15] = dp.state.val;
        });
        on(praefix + "." + x + ".RampOffTime", function (dp) { //Bei Statusänderung
            Groups[x][16] = dp.state.val;
        });
        on(praefix + "." + x + ".BlinkEnabled", function (dp) { //Bei Statusänderung
            Groups[x][17] = dp.state.val;
        });

        on(praefix + "." + x + ".Blink", function (dp) { //Bei Statusänderung Blink
            Groups[x][18] = dp.state.val;
            if (dp.state.val && Groups[x][17]) {
                Blink(x, dp.state.val);
                setTimeout(function () { // Tasterfunktion, Rückstellung auf false
                    setState(praefix + "." + x + ".Blink", false);
                }, 100); //
            };
        });
        on(praefix + "." + x + ".OnOverride", function (dp) { //Bei Putzlicht aktivierung
            Groups[x][19] = dp.state.val;
            OnOverride(x, dp.state.val);

        });
        on(praefix + "." + x + ".UseBriDefaults", function (dp) { //Bei Statusänderung
            Groups[x][20] = dp.state.val;
        });

        if (typeof Groups[x][7] != "undefined" && Groups[x][7] != "") {
            //log(getState(getState(praefix + "." + x + ".MotionDp").val).val)
            SetBwmTrigger(Groups[x][7], "", x);
            on(praefix + "." + x + ".MotionDp", function (dp) { //Bei Statusänderung BewegungsmelderId neuen Trigger auf Bewegungsmelder und alten löschen
                if (dp.state.val != "") SetBwmTrigger(dp.state.val, dp.oldState.val, x);
            });
        };
    };

    //alle Gruppen on(praefix + SzenenName + ".activate", function (obj) {
    on({ id: praefix + ".all" + ".Power", change: "ne" }, function (dp) { //Bei Statusänderung
        log("Alle Lampen deaktiviert");

        for (let x = 0; x < Groups.length; x++) {
            DoAction(x, false);
        };
    });
    on(praefix + ".all" + ".Ct", function (dp) { //Bei Statusänderung
        for (let x = 0; x < Groups.length; x++) {
            DoCt(x, dp.state.val);
        };
    });
    on(praefix + ".all" + ".Bri", function (dp) { //Bei Statusänderung
        for (let x = 0; x < Groups.length; x++) {
            DoBri(x, dp.state.val);
        };
    });
}


// Conversion functions, taken from: https://github.com/Qix-/color-convert



function ConvertRgbToHsl(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    let h;
    let s;

    if (max === min) {
        h = 0;
    } else if (r === max) {
        h = (g - b) / delta;
    } else if (g === max) {
        h = 2 + (b - r) / delta;
    } else if (b === max) {
        h = 4 + (r - g) / delta;
    }

    h = Math.min(h * 60, 360);

    if (h < 0) {
        h += 360;
    }

    const l = (min + max) / 2;

    if (max === min) {
        s = 0;
    } else if (l <= 0.5) {
        s = delta / (max + min);
    } else {
        s = delta / (2 - max - min);
    }

    return [h, s * 100, l * 100];
};

function ConvertRgbToHsv(rgb) {
    let rdif;
    let gdif;
    let bdif;
    let h;
    let s;

    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    const diffc = function (c) {
        return (v - c) / 6 / diff + 1 / 2;
    };

    if (diff === 0) {
        h = 0;
        s = 0;
    } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);

        if (r === v) {
            h = bdif - gdif;
        } else if (g === v) {
            h = (1 / 3) + rdif - bdif;
        } else if (b === v) {
            h = (2 / 3) + gdif - rdif;
        }

        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }

    return [
        h * 360,
        s * 100,
        v * 100
    ];
};

function ConvertRgbToCmyk(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const k = Math.min(1 - r, 1 - g, 1 - b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;

    return [c * 100, m * 100, y * 100, k * 100];
};

function comparativeDistance(x, y) {
	/*
		See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
	*/
    return (
        ((x[0] - y[0]) ** 2) +
        ((x[1] - y[1]) ** 2) +
        ((x[2] - y[2]) ** 2)
    );
}

function ConvertRgbToKeyword(rgb) {
    const reversed = reverseKeywords[rgb];
    if (reversed) {
        return reversed;
    }

    let currentClosestDistance = Infinity;
    let currentClosestKeyword;

    for (const keyword of Object.keys(cssKeywords)) {
        const value = cssKeywords[keyword];

        // Compute comparative distance
        const distance = comparativeDistance(rgb, value);

        // Check if its less, if so set as closest
        if (distance < currentClosestDistance) {
            currentClosestDistance = distance;
            currentClosestKeyword = keyword;
        }
    }

    return currentClosestKeyword;
};

function ConvertKeywordToRgb(keyword) {
    return cssKeywords[keyword];
};

function ConvertRgbToXyz(rgb) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;

    // Assume sRGB
    r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
    g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
    b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

    const x = (r * 0.4124564) + (g * 0.3575761) + (b * 0.1804375);
    const y = (r * 0.2126729) + (g * 0.7151522) + (b * 0.072175);
    const z = (r * 0.0193339) + (g * 0.119192) + (b * 0.9503041);

    return [x * 100, y * 100, z * 100];
};


function ConvertRgbToXy(rgb) {
    log("Reaching ConvertRgbToXy(rgb) rgb=" + rgb)
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;

    // Assume sRGB
    r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
    g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
    b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

    const x = (r * 0.4124564) + (g * 0.3575761) + (b * 0.1804375);
    const y = (r * 0.2126729) + (g * 0.7151522) + (b * 0.072175);
    const z = (r * 0.0193339) + (g * 0.119192) + (b * 0.9503041);

    let X = x / (x + y + z);
    let Y = y / (x + y + z);
    return [X, Y];
    //return X + "," + Y;

}

function ConvertRgbToLab(rgb) {
    const xyz = ConvertRgbToXyz(rgb);
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];

    x /= 95.047;
    y /= 100;
    z /= 108.883;

    x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
    y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
    z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);

    return [l, a, b];
};

function ConvertRgbToHex(args) {
    const integer = ((Math.round(args[0]) & 0xFF) << 16)
        + ((Math.round(args[1]) & 0xFF) << 8)
        + (Math.round(args[2]) & 0xFF);

    const string = integer.toString(16).toUpperCase();
    return '000000'.substring(string.length) + string;
};

function ConvertHexToRgb(args) {
    const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
    if (!match) {
        return [0, 0, 0];
    }

    let colorString = match[0];

    if (match[0].length === 3) {
        colorString = colorString.split('').map(char => {
            return char + char;
        }).join('');
    }

    const integer = parseInt(colorString, 16);
    const r = (integer >> 16) & 0xFF;
    const g = (integer >> 8) & 0xFF;
    const b = integer & 0xFF;

    return [r, g, b];
};

const cssKeywords = {
    "aliceblue": [240, 248, 255],
    "antiquewhite": [250, 235, 215],
    "aqua": [0, 255, 255],
    "aquamarine": [127, 255, 212],
    "azure": [240, 255, 255],
    "beige": [245, 245, 220],
    "bisque": [255, 228, 196],
    "black": [0, 0, 0],
    "blanchedalmond": [255, 235, 205],
    "blue": [0, 0, 255],
    "blueviolet": [138, 43, 226],
    "brown": [165, 42, 42],
    "burlywood": [222, 184, 135],
    "cadetblue": [95, 158, 160],
    "chartreuse": [127, 255, 0],
    "chocolate": [210, 105, 30],
    "coral": [255, 127, 80],
    "cornflowerblue": [100, 149, 237],
    "cornsilk": [255, 248, 220],
    "crimson": [220, 20, 60],
    "cyan": [0, 255, 255],
    "darkblue": [0, 0, 139],
    "darkcyan": [0, 139, 139],
    "darkgoldenrod": [184, 134, 11],
    "darkgray": [169, 169, 169],
    "darkgreen": [0, 100, 0],
    "darkgrey": [169, 169, 169],
    "darkkhaki": [189, 183, 107],
    "darkmagenta": [139, 0, 139],
    "darkolivegreen": [85, 107, 47],
    "darkorange": [255, 140, 0],
    "darkorchid": [153, 50, 204],
    "darkred": [139, 0, 0],
    "darksalmon": [233, 150, 122],
    "darkseagreen": [143, 188, 143],
    "darkslateblue": [72, 61, 139],
    "darkslategray": [47, 79, 79],
    "darkslategrey": [47, 79, 79],
    "darkturquoise": [0, 206, 209],
    "darkviolet": [148, 0, 211],
    "deeppink": [255, 20, 147],
    "deepskyblue": [0, 191, 255],
    "dimgray": [105, 105, 105],
    "dimgrey": [105, 105, 105],
    "dodgerblue": [30, 144, 255],
    "firebrick": [178, 34, 34],
    "floralwhite": [255, 250, 240],
    "forestgreen": [34, 139, 34],
    "fuchsia": [255, 0, 255],
    "gainsboro": [220, 220, 220],
    "ghostwhite": [248, 248, 255],
    "gold": [255, 215, 0],
    "goldenrod": [218, 165, 32],
    "gray": [128, 128, 128],
    "green": [0, 128, 0],
    "greenyellow": [173, 255, 47],
    "grey": [128, 128, 128],
    "honeydew": [240, 255, 240],
    "hotpink": [255, 105, 180],
    "indianred": [205, 92, 92],
    "indigo": [75, 0, 130],
    "ivory": [255, 255, 240],
    "khaki": [240, 230, 140],
    "lavender": [230, 230, 250],
    "lavenderblush": [255, 240, 245],
    "lawngreen": [124, 252, 0],
    "lemonchiffon": [255, 250, 205],
    "lightblue": [173, 216, 230],
    "lightcoral": [240, 128, 128],
    "lightcyan": [224, 255, 255],
    "lightgoldenrodyellow": [250, 250, 210],
    "lightgray": [211, 211, 211],
    "lightgreen": [144, 238, 144],
    "lightgrey": [211, 211, 211],
    "lightpink": [255, 182, 193],
    "lightsalmon": [255, 160, 122],
    "lightseagreen": [32, 178, 170],
    "lightskyblue": [135, 206, 250],
    "lightslategray": [119, 136, 153],
    "lightslategrey": [119, 136, 153],
    "lightsteelblue": [176, 196, 222],
    "lightyellow": [255, 255, 224],
    "lime": [0, 255, 0],
    "limegreen": [50, 205, 50],
    "linen": [250, 240, 230],
    "magenta": [255, 0, 255],
    "maroon": [128, 0, 0],
    "mediumaquamarine": [102, 205, 170],
    "mediumblue": [0, 0, 205],
    "mediumorchid": [186, 85, 211],
    "mediumpurple": [147, 112, 219],
    "mediumseagreen": [60, 179, 113],
    "mediumslateblue": [123, 104, 238],
    "mediumspringgreen": [0, 250, 154],
    "mediumturquoise": [72, 209, 204],
    "mediumvioletred": [199, 21, 133],
    "midnightblue": [25, 25, 112],
    "mintcream": [245, 255, 250],
    "mistyrose": [255, 228, 225],
    "moccasin": [255, 228, 181],
    "navajowhite": [255, 222, 173],
    "navy": [0, 0, 128],
    "oldlace": [253, 245, 230],
    "olive": [128, 128, 0],
    "olivedrab": [107, 142, 35],
    "orange": [255, 165, 0],
    "orangered": [255, 69, 0],
    "orchid": [218, 112, 214],
    "palegoldenrod": [238, 232, 170],
    "palegreen": [152, 251, 152],
    "paleturquoise": [175, 238, 238],
    "palevioletred": [219, 112, 147],
    "papayawhip": [255, 239, 213],
    "peachpuff": [255, 218, 185],
    "peru": [205, 133, 63],
    "pink": [255, 192, 203],
    "plum": [221, 160, 221],
    "powderblue": [176, 224, 230],
    "purple": [128, 0, 128],
    "rebeccapurple": [102, 51, 153],
    "red": [255, 0, 0],
    "rosybrown": [188, 143, 143],
    "royalblue": [65, 105, 225],
    "saddlebrown": [139, 69, 19],
    "salmon": [250, 128, 114],
    "sandybrown": [244, 164, 96],
    "seagreen": [46, 139, 87],
    "seashell": [255, 245, 238],
    "sienna": [160, 82, 45],
    "silver": [192, 192, 192],
    "skyblue": [135, 206, 235],
    "slateblue": [106, 90, 205],
    "slategray": [112, 128, 144],
    "slategrey": [112, 128, 144],
    "snow": [255, 250, 250],
    "springgreen": [0, 255, 127],
    "steelblue": [70, 130, 180],
    "tan": [210, 180, 140],
    "teal": [0, 128, 128],
    "thistle": [216, 191, 216],
    "tomato": [255, 99, 71],
    "turquoise": [64, 224, 208],
    "violet": [238, 130, 238],
    "wheat": [245, 222, 179],
    "white": [255, 255, 255],
    "whitesmoke": [245, 245, 245],
    "yellow": [255, 255, 0],
    "yellowgreen": [154, 205, 50]
};

// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

const reverseKeywords = {};
for (const key of Object.keys(cssKeywords)) {
    reverseKeywords[cssKeywords[key]] = key;
}
