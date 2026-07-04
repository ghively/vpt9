outlets=2;

var dlayers=new Array();
var numberofLayers=0;	

function init() {
	numberofLayers=0;
}
	
function addLayer() {
	var i=numberofLayers;
	numberofLayers++;
	dlayers[i]=this.patcher.newdefault(0,0,
"bpatcher",
"@name", "layergui",
"@presentation",1,
"@presentation_rect",0,5+22*i,350,21,
"@patching_rect", 0,20+22*i,360,21,
"@varname", numberofLayers.toString()+"layergui",
"@args", numberofLayers);

	outlet(0,"/numberofLayers",numberofLayers);
	outlet(1,"send "+numberofLayers.toString()+"layer_init");
	}	
	
function startupLayers(n) {
	numberofLayers=n;
	for(var i=0;i<numberofLayers;i++) {
	dlayers[i]=this.patcher.newdefault(0,0,
"bpatcher",
"@name", "layergui",
"@presentation",1,
"@presentation_rect",0,5+22*i,350,21,
"@patching_rect", 10,10+22*i,360,21,
"@varname", (i+1).toString()+"layergui",
"@args", i+1);
outlet(1,"send "+(i+1).toString()+"layer_init");
}
	outlet(0,"/numberofLayers",numberofLayers);
	//outlet(1,"send "+numberofLayers.toString()+"layer_init");
	}
	
	
function deleteLayer() {
	var i=numberofLayers;
	if(i>0) {
		this.patcher.remove(dlayers[i-1]);
		numberofLayers--;
		}
	outlet(0,"/numberofLayers",numberofLayers);
	}
	