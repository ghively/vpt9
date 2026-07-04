outlets=2;

var activelayer=new Array();
var numberofLayers=0;

function addLayer() {
	var i=numberofLayers;
	numberofLayers++;
	activelayer[i]=this.patcher.newdefault(0,0,
"bpatcher",
"@name", "layertab",
"@patching_rect", 10+21*i,10,20,20,
"@presentation",1,
"@presentation_rect",30+21*(i%8),35+21*Math.floor(i/8),20,20,
"@varname", numberofLayers.toString()+"layertab",
"@args", numberofLayers);

	outlet(0,numberofLayers);
	outlet(1,"send "+numberofLayers.toString()+"tab_init");
	}	
	
function startupLayers(n) {
	numberofLayers=n;
	for(var i=0;i<numberofLayers;i++) {
	activelayer[i]=this.patcher.newdefault(0,0,
"bpatcher",
"@name", "layertab",
"@patching_rect", 10+21*i,10,20,20,
"@presentation",1,
"@presentation_rect",30+21*(i%8),35+21*Math.floor(i/8),20,20,
"@varname", (i+1).toString()+"layertab",
"@args", i+1);

outlet(1,"send "+(i+1).toString()+"tab_init");
}

	outlet(0,numberofLayers);
	//outlet(1,"send "+numberofLayers.toString()+"layer_init");
	}
	
function deleteLayer() {
	var i=numberofLayers;
	if(i>0) {
		this.patcher.remove(activelayer[i-1]);
		numberofLayers--;
		}
	outlet(0,numberofLayers);
	}