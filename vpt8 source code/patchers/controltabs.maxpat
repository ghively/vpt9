{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 7,
			"minor" : 3,
			"revision" : 4,
			"architecture" : "x86",
			"modernui" : 1
		}
,
		"rect" : [ 225.0, 79.0, 1000.0, 653.0 ],
		"bgcolor" : [ 0.568627, 0.792157, 0.870588, 1.0 ],
		"bglocked" : 0,
		"openinpresentation" : 1,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 0,
		"enablevscroll" : 0,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"boxes" : [ 			{
				"box" : 				{
					"bgcolor" : [ 0.867, 0.867, 0.867, 1.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.867, 0.867, 0.867, 1.0 ],
					"bgfillcolor_color2" : [ 0.867, 0.867, 0.867, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontface" : 0,
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"gradient" : 0,
					"id" : "obj-15",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 198.0, 581.0, 177.0, 21.0 ],
					"presentation_rect" : [ 200.0, 581.0, 0.0, 0.0 ],
					"style" : "",
					"text" : "window flags grow, window exec",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.867, 0.867, 0.867, 1.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.867, 0.867, 0.867, 1.0 ],
					"bgfillcolor_color2" : [ 0.867, 0.867, 0.867, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontface" : 0,
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"gradient" : 0,
					"id" : "obj-23",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 198.0, 543.0, 190.0, 21.0 ],
					"style" : "",
					"text" : "window flags nogrow, window exec",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 1,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-14",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "artnet-vpt.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 656.0, 324.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 1628.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[9]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 1,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-13",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "vpt-timersketch3.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 519.0, 324.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 2601.0, 3.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[8]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-12",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lforack-vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 372.0, 41.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 1303.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[7]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 1,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-11",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "vpt7_info.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 235.0, 41.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 3575.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[6]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 1,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-8",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "vpt7_keys.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 515.0, 41.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 3250.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[5]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-10",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 84.0, 386.0, 79.0, 22.0 ],
					"style" : "",
					"text" : "r this_control"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 84.0, 435.0, 69.0, 22.0 ],
					"save" : [ "#N", "thispatcher", ";", "#Q", "end", ";" ],
					"style" : "",
					"text" : "thispatcher"
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-7",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "serial_VPT7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 242.0, 313.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 2276.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[4]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-6",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "clipcontrol.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 380.0, 320.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 2926.0, 1.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[3]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-5",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "osceditor-vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 515.0, 185.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 1951.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[2]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-4",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "miditab-vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 372.0, 185.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 976.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7[1]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-3",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "router-vpt7.maxpat",
					"numinlets" : 1,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 229.0, 185.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 651.0, 0.0, 325.0, 420.0 ],
					"varname" : "router-vpt7",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-2",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "cuelist-vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 100.0, 41.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 326.0, 0.0, 325.0, 420.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-1",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "activelayer.maxpat",
					"numinlets" : 1,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 89.0, 185.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 1.0, 0.0, 325.0, 420.0 ],
					"varname" : "activelayer",
					"viewvisibility" : 1
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"source" : [ "obj-10", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"source" : [ "obj-15", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"source" : [ "obj-23", 0 ]
				}

			}
 ],
		"parameters" : 		{
			"obj-1::obj-216" : [ "contrast", "co", 0 ],
			"obj-1::obj-270" : [ "do", "down", 0 ],
			"obj-1::obj-283" : [ "blur", "blur", 0 ],
			"obj-1::obj-62" : [ "rot", "rot", 0 ],
			"obj-1::obj-262" : [ "brightness[2]", "y", 0 ],
			"obj-1::obj-47" : [ "scale", "scale", 0 ],
			"obj-1::obj-276" : [ "ri", "right", 0 ],
			"obj-1::obj-288" : [ "blur[1]", "blur", 0 ],
			"obj-1::obj-266" : [ "brightness[1]", "x", 0 ],
			"obj-1::obj-274" : [ "up", "up", 0 ],
			"obj-1::obj-255" : [ "brightness[3]", "ax", 0 ],
			"obj-1::obj-244" : [ "slider", "slider", 0 ],
			"obj-1::obj-242" : [ "brightness", "br", 0 ],
			"obj-1::obj-206" : [ "saturation", "sa", 0 ],
			"obj-1::obj-279" : [ "mblur", "mblur", 0 ],
			"obj-1::obj-56::obj-113" : [ "circle.diameter[1]", "circle.diameter", 0 ],
			"obj-1::obj-56::obj-111" : [ "mask.blur", "mask.blur", 0 ],
			"obj-1::obj-273" : [ "le", "left", 0 ],
			"obj-1::obj-252" : [ "brightness[4]", "ay", 0 ]
		}
,
		"dependency_cache" : [ 			{
				"name" : "activelayer.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "osc_active.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "pointmask.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "pointmask01.js",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/code",
				"patcherrelativepath" : "../code",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "jit.gl.slab.gauss6x.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "gridcontroller.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "pointgrid01b.js",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/code",
				"patcherrelativepath" : "../code",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "cuelist-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "router-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "ctrlrouter-vpt7_01.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "ctrl_config-vpt7_01.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "miditab-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "softmidi-vpt7_01.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "softslider-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "softbutton-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "osceditor-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "clipcontrol.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "loopback_clip_vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "serial_VPT7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "sensorinput_module_vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "vpt7_keys.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "vpt7_info.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "creativecommons_license.png",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/media",
				"patcherrelativepath" : "../media",
				"type" : "PNG ",
				"implicit" : 1
			}
, 			{
				"name" : "vpt07_32.png",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/media",
				"patcherrelativepath" : "../media",
				"type" : "PNG ",
				"implicit" : 1
			}
, 			{
				"name" : "lforack-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "lfomodule-vpt7_01.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "lfomix-vpt7_01.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "vpt-timersketch3.maxpat",
				"bootpath" : "~/lab",
				"patcherrelativepath" : "../../../../../lab",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "timermodule.maxpat",
				"bootpath" : "~/lab/vpt7-2017",
				"patcherrelativepath" : "../../../../../lab/vpt7-2017",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "artnet-vpt.maxpat",
				"bootpath" : "~/lab",
				"patcherrelativepath" : "../../../../../lab",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "Label.mxo",
				"type" : "iLaX"
			}
, 			{
				"name" : "o.route.mxo",
				"type" : "iLaX"
			}
, 			{
				"name" : "imp.artnet.node.mxo",
				"type" : "iLaX"
			}
 ],
		"autosave" : 0
	}

}
