outlets=2;

var vlayers=new Array();
var layers=new Array();  //for layerorder
var numberofLayers=0;



//var layers_inlet;

/*function init() {
	layers_inlet=this.patcher.newdefault(10,0,"receive","layers");
}*/

/*function addLayer() {
	var i=numberofLayers;
	//var layername=numberofLayers.toString()+"layer";
	vlayers[i]=this.patcher.newdefault(10,30+25*i,"vlayer",i+1);
	
	//this.patcher.connect(layers_inlet,0,vlayers[i],0);
	numberofLayers++;
	outlet(0,"/numberofLayers",numberofLayers);
	outlet(1,"send "+numberofLayers.toString()+"layer_init");
	}*/
	
function addLayer() {
	var i=numberofLayers;
	numberofLayers++;
	vlayers[i]=this.patcher.newdefault(0,0,
"bpatcher",
"@name", "vlayer",
"@patching_rect", 10,10+22*i,210,21,
"@varname", numberofLayers.toString()+"layer",
"@args", numberofLayers);
	
	layers[i]=i; //layerorder

	outlet(0,"/numberofLayers",numberofLayers);
	//wait(50000);
	outlet(1,"send "+numberofLayers.toString()+"layer_init");
	outlet(0,"/added",1);
	//layerprint();
	}
	
function wait(w) {
	var j=0;
	for(var i=0;i<w*100;i++) {
		j=i+i;
		}
}
	
function startupLayers(n) {
	numberofLayers=n;
	for(var i=0;i<numberofLayers;i++) {
	vlayers[i]=this.patcher.newdefault(0,0,
"bpatcher",
"@name", "vlayer",
"@patching_rect", 10,10+22*i,210,21,
"@varname", (i+1).toString()+"layer",
"@args", i+1);

	layers[i]=i; //layerorder

	//outlet(0,"/i",i);
	outlet(1,"send "+(i+1).toString()+"layer_init");
	}

	outlet(0,"/numberofLayers",numberofLayers);
	outlet(0,"/initdone",1);
	//outlet(1,"send "+numberofLayers.toString()+"layer_init");
	//layerprint();
}
	
function deleteLayer() {
	var i=numberofLayers;
	if(i>0) {
		this.patcher.remove(vlayers[i-1]);
		numberofLayers--;
		}
	outlet(0,"/numberofLayers",numberofLayers);
	}
	
	
function layerprint() {
	var len=numberofLayers;
	//outlet(0,"number of layers ",numberofLayers);
	for(var i=0;i<len;i++) {
		outlet(0,"/layerorder",layers[i]+1,i+1); // first layerid, then layerorder
		//outlet(0,"/layerorder",i+1); // first layerid, then layerorder
	}
	outlet(0,"/order_refresh",1);
}

function movelayer(layerid,newpos) {
	var len=numberofLayers;
	layerid-=1; //array begynner på 0, layer på 1
	newpos-=1;
	var temp=layers.indexOf(layerid); 
	layers.move(temp,newpos);
	layerprint();
}

Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
};