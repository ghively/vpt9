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
		"rect" : [ 34.0, 79.0, 1111.0, 582.0 ],
		"bgcolor" : [ 1.0, 1.0, 1.0, 0.0 ],
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
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 0,
					"patcher" : 					{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 7,
							"minor" : 3,
							"revision" : 4,
							"architecture" : "x86",
							"modernui" : 1
						}
,
						"rect" : [ 59.0, 104.0, 640.0, 480.0 ],
						"bglocked" : 0,
						"openinpresentation" : 0,
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
						"enablehscroll" : 1,
						"enablevscroll" : 1,
						"devicewidth" : 0.0,
						"description" : "",
						"digest" : "",
						"tags" : "",
						"style" : "",
						"subpatcher_template" : "",
						"boxes" : [ 							{
								"box" : 								{
									"id" : "obj-9",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 457.0, 432.0, 154.0, 33.0 ],
									"style" : "",
									"text" : "cellblock starts at 0, not 1, so preset 1 is pos 0"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-5",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"patching_rect" : [ 416.5, 432.0, 29.5, 22.0 ],
									"style" : "",
									"text" : "- 1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-27",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 365.0, 241.0, 150.0, 33.0 ],
									"style" : "",
									"text" : "improved triggering of next or previous preset"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-162",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 336.0, 511.0, 126.0, 22.0 ],
									"style" : "",
									"text" : "s to-presets_cellblock"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-90",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 416.5, 482.0, 69.0, 22.0 ],
									"style" : "",
									"text" : "select 0 $1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-25",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 50.0, 100.0, 55.0, 22.0 ],
									"style" : "",
									"text" : "r current"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-76",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 377.0, 123.0, 74.0, 22.0 ],
									"style" : "",
									"text" : "r presetnext"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-78",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 264.0, 116.0, 75.0, 22.0 ],
									"style" : "",
									"text" : "r presetprev"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-21",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 199.75, 427.0, 132.0, 22.0 ],
									"style" : "",
									"text" : "if $f1<1 then 1 else $f1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-17",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 152.0, 138.0, 74.0, 22.0 ],
									"style" : "",
									"text" : "prepend set"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-16",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "bang", "int" ],
									"patching_rect" : [ 258.0, 252.0, 34.0, 22.0 ],
									"style" : "",
									"text" : "t b 2"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-15",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "bang", "int" ],
									"patching_rect" : [ 66.0, 267.0, 34.0, 22.0 ],
									"style" : "",
									"text" : "t b 1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-14",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 195.75, 495.0, 74.0, 22.0 ],
									"style" : "",
									"text" : "prepend set"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-13",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 180.0, 296.0, 54.0, 22.0 ],
									"style" : "",
									"text" : "gate 2 0"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-12",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"patching_rect" : [ 227.0, 349.0, 29.5, 22.0 ],
									"style" : "",
									"text" : "+ 1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-10",
									"maxclass" : "number",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "bang" ],
									"parameter_enable" : 0,
									"patching_rect" : [ 195.75, 403.0, 50.0, 22.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-8",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"patching_rect" : [ 161.0, 349.0, 29.5, 22.0 ],
									"style" : "",
									"text" : "- 1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-7",
									"maxclass" : "number",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "bang" ],
									"parameter_enable" : 0,
									"patching_rect" : [ 152.0, 189.0, 50.0, 22.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-3",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 288.0, 189.0, 24.0, 24.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-2",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 53.0, 211.0, 24.0, 24.0 ],
									"style" : ""
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-21", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-10", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-10", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-12", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-12", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-13", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-8", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-13", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-7", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-14", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-15", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-7", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-15", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-16", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-7", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-16", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-7", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-17", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-15", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-2", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-14", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"order" : 1,
									"source" : [ "obj-21", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-5", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"order" : 0,
									"source" : [ "obj-21", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-17", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-25", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-16", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-3", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"color" : [ 0.65, 0.65, 0.65, 0.9 ],
									"destination" : [ "obj-90", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-5", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"color" : [ 0.65, 0.65, 0.65, 0.9 ],
									"destination" : [ "obj-13", 1 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-7", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-3", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-76", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-2", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-78", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-10", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-8", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-162", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-90", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 1210.0, 169.0, 111.0, 22.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p next-prev_preset"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-164",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 812.0, 257.0, 98.0, 22.0 ],
					"style" : "",
					"text" : "s to-presets_coll"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-163",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1141.0, 362.0, 121.0, 22.0 ],
					"style" : "",
					"text" : "r fr-presets_cellblock"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-162",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1007.0, 321.0, 126.0, 22.0 ],
					"style" : "",
					"text" : "s to-presets_cellblock"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-160",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patcher" : 					{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 7,
							"minor" : 3,
							"revision" : 4,
							"architecture" : "x86",
							"modernui" : 1
						}
,
						"rect" : [ 478.0, 188.0, 216.0, 100.0 ],
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
						"enablehscroll" : 1,
						"enablevscroll" : 1,
						"devicewidth" : 0.0,
						"description" : "",
						"digest" : "",
						"tags" : "",
						"style" : "",
						"subpatcher_template" : "",
						"boxes" : [ 							{
								"box" : 								{
									"comment" : "",
									"id" : "obj-2",
									"index" : 1,
									"maxclass" : "outlet",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 23.0, 154.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-1",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "bang", "bang" ],
									"patching_rect" : [ 23.0, 60.0, 34.0, 20.0 ],
									"style" : "",
									"text" : "t b b"
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"id" : "obj-4",
									"index" : 1,
									"maxclass" : "inlet",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ -2.0, 0.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-3",
									"linecount" : 2,
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 38.0, 104.0, 66.0, 32.0 ],
									"style" : "",
									"text" : ";\rtoPS clear"
								}

							}
, 							{
								"box" : 								{
									"bgcolor" : [ 1.0, 0.164859, 0.099687, 1.0 ],
									"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
									"fontsize" : 20.0,
									"hint" : "deletes selected preset",
									"id" : "obj-67",
									"legacytextcolor" : 1,
									"maxclass" : "textbutton",
									"numinlets" : 1,
									"numoutlets" : 3,
									"outlettype" : [ "", "", "int" ],
									"parameter_enable" : 0,
									"patching_rect" : [ 23.0, 25.0, 145.0, 29.0 ],
									"presentation" : 1,
									"presentation_rect" : [ 20.0, 17.0, 168.0, 62.0 ],
									"style" : "",
									"text" : "clear all presets",
									"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
									"texton" : "delete",
									"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
									"textovercolor" : [ 0.994898, 0.994898, 0.994898, 1.0 ],
									"usebgoncolor" : 1,
									"usetextovercolor" : 1
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-2", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-1", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-3", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-1", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-67", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 94.0, 150.0, 59.0, 22.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p clearall",
					"varname" : "clearall"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-154",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 94.0, 99.0, 33.0, 20.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-156",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 94.0, 120.0, 46.0, 20.0 ],
					"style" : "",
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"id" : "obj-153",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 101.0, 51.5, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 133.0, 50.0, 21.0, 17.0 ],
					"style" : "",
					"text" : "+",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"tosymbol" : 0,
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-152",
					"linecount" : 2,
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1263.0, 758.0, 99.0, 35.0 ],
					"style" : "",
					"text" : ";\rps_sources grab"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-145",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 708.0, 76.0, 65.0, 22.0 ],
					"style" : "",
					"text" : "closebang"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-146",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 609.0, 313.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-138",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 1198.0, 709.0, 48.0, 22.0 ],
					"style" : "",
					"text" : "+ 1000"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-134",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 692.0, 590.0, 63.0, 22.0 ],
					"style" : "",
					"text" : "delay 100"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-87",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "bang", "bang", "bang" ],
					"patching_rect" : [ 692.0, 562.0, 46.0, 22.0 ],
					"style" : "",
					"text" : "t b b b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-136",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1263.0, 693.0, 112.0, 22.0 ],
					"style" : "",
					"text" : "print sourceincgate"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-135",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1141.0, 656.0, 93.0, 22.0 ],
					"style" : "",
					"text" : "r sourceincgate"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-133",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1141.0, 696.0, 54.0, 22.0 ],
					"style" : "",
					"text" : "gate 1 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-121",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1141.0, 741.0, 76.0, 22.0 ],
					"style" : "",
					"text" : "pack store 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-114",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1141.0, 772.0, 81.0, 22.0 ],
					"style" : "",
					"text" : "s ps_sources"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-105",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 497.0, 369.0, 91.0, 22.0 ],
					"style" : "",
					"text" : "storagewindow"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-103",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400.0, 369.0, 79.0, 22.0 ],
					"style" : "",
					"text" : "clientwindow"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-85",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 454.0, 403.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "s ps"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.568627, 0.619608, 0.662745, 0.5 ],
					"bgoncolor" : [ 0.921569, 0.94902, 0.05098, 1.0 ],
					"fontsize" : 8.0,
					"id" : "obj-72",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 413.5, 329.0, 52.0, 22.5 ],
					"presentation" : 1,
					"presentation_rect" : [ 9.0, 73.0, 34.009766, 15.0 ],
					"prototypename" : "M4L.toggle-yellow",
					"style" : "",
					"text" : "current",
					"textcolor" : [ 0.101961, 0.121569, 0.172549, 1.0 ],
					"texton" : "monitor",
					"textoncolor" : [ 0.101961, 0.121569, 0.172549, 1.0 ],
					"textovercolor" : [ 0.101961, 0.121569, 0.172549, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1,
					"varname" : "current"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.568627, 0.619608, 0.662745, 0.5 ],
					"bgoncolor" : [ 0.921569, 0.94902, 0.05098, 1.0 ],
					"fontsize" : 8.0,
					"id" : "obj-84",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 521.5, 329.0, 52.0, 22.5 ],
					"presentation" : 1,
					"presentation_rect" : [ 44.009766, 73.0, 34.009766, 15.0 ],
					"prototypename" : "M4L.toggle-yellow",
					"style" : "",
					"text" : "stored",
					"textcolor" : [ 0.101961, 0.121569, 0.172549, 1.0 ],
					"texton" : "monitor",
					"textoncolor" : [ 0.101961, 0.121569, 0.172549, 1.0 ],
					"textovercolor" : [ 0.101961, 0.121569, 0.172549, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1,
					"varname" : "stored"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-44",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 236.0, 314.0, 56.0, 22.0 ],
					"style" : "",
					"text" : "s engine"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-23",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 236.0, 284.0, 87.0, 22.0 ],
					"style" : "",
					"text" : "prepend /toPS"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 236.0, 241.0, 31.0, 22.0 ],
					"style" : "",
					"text" : "r ps"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"blinkcolor" : [ 0.52549, 0.0, 0.0, 1.0 ],
					"hint" : "",
					"id" : "obj-69",
					"ignoreclick" : 1,
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"outlinecolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"patching_rect" : [ 163.0, 165.0, 20.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 0.0, 318.657196, 11.0, 11.0 ],
					"prototypename" : "vpt_indicator",
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-91",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1020.0, 487.0, 63.0, 22.0 ],
					"style" : "",
					"text" : "v prespos"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-36",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 331.5, 528.0, 74.0, 22.0 ],
					"style" : "",
					"text" : "prepend set"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-17",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 413.5, 459.0, 74.0, 22.0 ],
					"style" : "",
					"text" : "r ostoretype"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-26",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 330.5, 462.0, 81.0, 22.0 ],
					"style" : "",
					"text" : "r ostorename"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-33",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 345.5, 498.0, 62.0, 22.0 ],
					"style" : "",
					"text" : "r ostorenr"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-34",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 663.0, 436.0, 51.0, 22.0 ],
					"style" : "",
					"text" : "r ostore"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1055.0, 147.0, 94.0, 21.0 ],
					"style" : "",
					"text" : "r dim_command"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-14",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 826.5, 358.0, 95.0, 22.0 ],
					"style" : "",
					"text" : "r clearpresetcoll"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-2",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1020.0, 696.0, 50.0, 22.0 ],
					"style" : "",
					"text" : "text $1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "bang" ],
					"patching_rect" : [ 1331.0, 412.0, 34.0, 22.0 ],
					"style" : "",
					"text" : "t b b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-149",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 951.0, 699.0, 35.0, 22.0 ],
					"style" : "",
					"text" : "grab"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-143",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 110.0, 257.0, 78.0, 22.0 ],
					"style" : "",
					"text" : "metro 20000"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"hint" : "autosave presets",
					"id" : "obj-142",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"mode" : 1,
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 38.0, 219.0, 81.0, 22.0 ],
					"style" : "",
					"text" : "autosave off",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "autosave on",
					"textoncolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-137",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 343.0, 55.0, 33.0, 20.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-139",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patcher" : 					{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 7,
							"minor" : 3,
							"revision" : 4,
							"architecture" : "x86",
							"modernui" : 1
						}
,
						"rect" : [ 315.0, 78.0, 890.0, 581.0 ],
						"bglocked" : 1,
						"openinpresentation" : 0,
						"default_fontsize" : 12.0,
						"default_fontface" : 0,
						"default_fontname" : "Arial",
						"gridonopen" : 1,
						"gridsize" : [ 12.0, 12.0 ],
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
						"enablehscroll" : 1,
						"enablevscroll" : 1,
						"devicewidth" : 0.0,
						"description" : "",
						"digest" : "",
						"tags" : "",
						"style" : "",
						"subpatcher_template" : "",
						"boxes" : [ 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-37",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 361.0, 305.0, 22.0, 20.0 ],
									"style" : "",
									"text" : "3"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-22",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 361.0, 327.0, 22.0, 20.0 ],
									"style" : "",
									"text" : "2"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-5",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 540.0, 302.0, 22.0, 20.0 ],
									"style" : "",
									"text" : "1"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-17",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 436.0, 390.0, 172.0, 33.0 ],
									"style" : "",
									"text" : "overview over the values stored in presets"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial Bold",
									"fontsize" : 14.0,
									"id" : "obj-58",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 382.0, 1.0, 112.0, 22.0 ],
									"style" : "",
									"text" : "Presets"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-41",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 64.0, 244.0, 278.0, 47.0 ],
									"style" : "",
									"text" : "1. select storage mode\n2. choose a preset number and optionally a name\n3. hit the store button"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-40",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 547.0, 312.0, 274.0, 33.0 ],
									"style" : "",
									"text" : "the presetname is optional but very useful for remembering what the preset contains."
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-36",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 547.0, 348.0, 204.0, 20.0 ],
									"style" : "",
									"text" : "deletes the currently selected preset"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-35",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 555.0, 353.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-31",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 212.0, 390.0, 198.0, 20.0 ],
									"style" : "",
									"text" : "an overview over the active values"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-28",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 559.0, 312.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-26",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 549.0, 99.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-27",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 501.0, 86.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-23",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 88.0, 343.5, 288.0, 33.0 ],
									"style" : "",
									"text" : "to copy one preset to another, first select the preset to copy from, then the preset you want to paste to "
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-21",
									"linecount" : 4,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 547.0, 98.0, 274.0, 60.0 ],
									"style" : "",
									"text" : "the list of presets. Click on a preset to make it active. This is also reflected in the storage section, making it easy to modify a preset and save it again"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-18",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 572.0, 243.0, 274.0, 33.0 ],
									"style" : "",
									"text" : "insert creates a preset at the current position, renumbering the following presets"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-14",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 571.0, 219.0, 274.0, 20.0 ],
									"style" : "",
									"text" : "storenext finds the next available presetnumber"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-11",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 571.0, 183.0, 274.0, 34.0 ],
									"style" : "",
									"text" : "store at selected preset number\n!! overwrites existing preset with same number"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-19",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 559.0, 240.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
									"blinkcolor" : [ 1.0, 0.89, 0.09, 1.0 ],
									"id" : "obj-8",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"outlinecolor" : [ 0.0, 0.0, 0.0, 0.0 ],
									"patching_rect" : [ 512.0, 294.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-2",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 793.0, 2.0, 27.0, 20.0 ],
									"style" : "",
									"text" : "r lb"
								}

							}
, 							{
								"box" : 								{
									"handoff" : "",
									"id" : "obj-16",
									"maxclass" : "ubutton",
									"numinlets" : 1,
									"numoutlets" : 4,
									"outlettype" : [ "bang", "bang", "", "int" ],
									"patching_rect" : [ 839.0, 13.0, 25.0, 29.0 ],
									"presentation" : 1,
									"presentation_rect" : [ 839.0, 13.0, 25.0, 29.0 ]
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-15",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 797.0, 21.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-13",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"patching_rect" : [ 802.0, 43.0, 24.0, 20.0 ],
									"style" : "",
									"text" : "t 1"
								}

							}
, 							{
								"box" : 								{
									"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
									"checkedcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
									"id" : "obj-12",
									"ignoreclick" : 1,
									"maxclass" : "toggle",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"parameter_enable" : 0,
									"patching_rect" : [ 838.0, 12.0, 26.0, 26.0 ],
									"presentation" : 1,
									"presentation_rect" : [ 838.0, 12.0, 26.0, 26.0 ],
									"style" : "",
									"uncheckedcolor" : [ 0.0, 0.0, 0.0, 0.0 ]
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-10",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 485.0, 11.0, 47.0, 18.0 ],
									"style" : "",
									"text" : "wclose"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-7",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 540.0, 36.0, 148.0, 18.0 ],
									"style" : "",
									"text" : "window title, window exec"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-6",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 530.0, 13.0, 243.0, 18.0 ],
									"style" : "",
									"text" : "window notitle, window exec, savewindow 1"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-1",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 514.0, 59.0, 69.0, 20.0 ],
									"save" : [ "#N", "thispatcher", ";", "#Q", "savewindow", 1, ";", "#Q", "end", ";" ],
									"style" : "",
									"text" : "thispatcher"
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"hidden" : 1,
									"id" : "obj-3",
									"index" : 1,
									"maxclass" : "inlet",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 25.0, 20.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-30",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 446.0, 369.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-32",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 390.0, 369.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-25",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 382.0, 348.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"data" : [ 9596, "", "IBkSG0fBZn....PCIgDQRA...LJ..DvlHX.....px.B8....DLmPIQEBHf.B7g.YHB..f.PRDEDU3wY6ceGeaWem3G+kjrsFV1xC48L1NamEj3j.YRHPSX1jRgxFZgNgqz1qzqbGWu1ebWudLJP4nKNJkwczBTfVZHPHjAYOsyNwIwi3ssrkjsj092e3Dm3Qb7P19SBue93AOdfkz2ue+HmW9qVe+9QZdtse7PHDJ.si1C.g3LjXTnLhn6WfqM99DSxoMZLVDWDRWasv3G+3GRqiibjif2Kao8LFiI4zHo7mvPZkeFtZtQBEBhNAqgk0mP8jjmlYQKZQCo0gFMZnDjGlVnPjXTLrxQadvQqd5W219cLd3h2C6dSabPOnFIX2lMBFL3n8vPbZACA0zrcp0tCBD7B+NH1uhwRO394o9weep3DGaHO.GtDLXP9tekaB+97MZOTDmlMGswAppN1+opkVb55Bd6ufw3G8N+Id5G6ejTxHqvx.DfCWxdYGa3So9ZptyKqhieLb0pSN59Kg8tsMiOudwqm1YuacST5A2eWtcs5vAGt38PIaeKcFem7HGh1b5jCW7toEaMwwNv95x1rhiWJsXqov18AQeqcO9ozZaj.ACRffA4n01.t8z26nnGuZ5tKNqIwu3UdSdye6uZHO.CEJD+xG+QwVC0SdieR7JO2Sxc9seDlyhuZd8W7YoUGNHkzy.aMz.+kW4k.fryKe19F9TVw8903ZWwsxq+hOK1pudJXRERv.A3U+UOC+a+2uD6YKeF.rgO7C31dvb3m9vOHO2a99Du0jHXf.7DOx2je1u9OLjuOH5er4zEUZqkN+4SYyN4jXBXTejm2k4BFiEsfEGdFc.aacqg5p5T7u+6dUzpSGK8K9k3w+F2Gyb9KD.lvTlN20C88nUGN39+BKf+8e+qQASpPxehEx1V2Z3ZWwsB.ScVyg65g9d.vy8S9mX0uyehUbOeM9S+9WjG7Q+WHJ85YlW4BYSqY0b821cRwaeKjZlYSxomQX69h37ydadn3JqtGWdwUVMlMFEwFsgdc4tfwX3zIOxgwYKsvS8i+AcdYtZqUZ3zObctiqi2eSSlMC.Ylad.fASl5xyEbJEMmN++mzLlIkr8s1is0httah23W+bb821cxFV0eiEt7aH7eGRzCACA01rcZs8d9JnascOTayNwrI8nUildb8inwnFMZXrENEt467967xtku52fDSNU.PqVsceA58UTny9Jy740KQFUO20+Tl0rww+gMNwgOHkrisxC9n+KC86.hKny7hVNe1eU0RhwDMIZwTOttQz2mwIL8Kiis+8QxomN4NtwCZf+q+oGY.ud1xZ+X.Hfe+rs08ILkYNGznUKZznA+97BzQXufkc87a+E++X5y4JvXzQGVuuH5oy8Esb9zwKlodZ2i+dbcin6Yb5y9JXNW0R4e7tuURJszopxOI28C88IJ85GPqmJJ8X7XOvcgqVakwL9Iv7u1kiFMZH+INYdna4F3m8q+CjdN4xhV9Mx69G+e31+FOzvz8Hw4pcu9wkWejn499O7c60Os60OFz207SS2OdF0cjcLr+YS2pCG3psVIVKwgAS8b208k+iev2gEbsWOS9xmEgBFj3slTmWWv.AvsKWXzjIzpSGMVaM7u9s9p77u0eqmOE.QXw49YSGHPny6yrp6BEBzoqia75W+5oDSYMxtmwyvbrwh4XicHsNhKgD6wkoUmNhNlX.fU8m+eYqq8i45ts6PBwQHmItFrFUhwghq+1tKRI8Luf2Nilhl4tjqgq4KdKi.iJQ3vEcw3Tl4r6W2tEcc23v7HQDt0qw3YdtdCUtZtQLEu0v15SnVB2GmpCqOYJSwaECwXY3bSHtDRutmw6Y4KIrrxKu7x4S2eobuWW3Y8ITK+4sT7485b4pmGTDlLc9+boA4fqUnPjXTnLtfuZ5pppJdoW5kn4laloN0ox8bO2yP58sq95qGqVsNnWG81x+Ye1mgc6145ttqaPOtDi95yhnkVZg4N24B.yadyi23MdCdfG3AFzarfACx3G+3wqWugske6ae6rxUtR1291WerjhKFzmw3G+weLSdxSlG+webV4JWIuxq7J7G+i+wA84Yxt28tokVZgMtwM1YPsoMsIdu268nrxJqK2Va1rwa+1uMqd0qtyaa2W9W7EeQtka4VH+7yePMdDpk9LFuka4VXUqZUc9ykVZoCoGh8u+2+6.vq9puJtb4ha8VuUdzG8QYsqcsbUW0Uwa+1uM.bzidTl9zmNadyal23MdClzjlDNc5rKKua2tIszRi8t28xLlwLFTiGgZoeWU0We8709ZeMdhm3IFzarG6wdL.329a+srl0rFN9wONqe8qmm8YeV9fO3C3AevGDe97wpW8ponhJhm7IeRdkW4U3G9C+gzRKszkk2hEKby27MS7wG+fd7HTK8qONvCe3CyMey2L20ccWb+2+8egWf9gcu6cSiM1HqbkqryKytc6TVYkwMcS2DOyy7LjWd4wW3K7E3ltoahrxJKBDHPXYaKTSWvXbKaYKrhUrBd5m9o4q7U9JgsMrVsZYNyYN7i9Q+nNurexO4mPVYkEFLXficriwF23FYMqYMbG2wcvy9rOaXc6KTO8YLVVYkwMdi2Hu9q+5bMWy0Lj2XZO8QisGOdX9ye97Zu1qwXFyXvhEKTbwEyMey2LG5PGhewu3WPM0TCOyy7LrnEsHpppp3jm7jcY4MXn2OodDW7pOiwm+4edZrwF4Zu1qsKWdas0FlFfGTrPGmCLyZVyh7yOe1zl1D2xsbKLsoMMxM2b4vG9v7TO0SgACF3tu66lq9puZJpnhPmNc32ue94+7edOV9g5rekPszqGo2eq67VCKq7d6ylNPf.3zoShIlXPmNczbyMic61wpUqX9zmUfPGumhm5TmhPgBQ1YmMZN8gPb2Wdwnm+7VJ97NKjMP9roG0NRu0oSGwEWbc9ywGe785qHVqVsjc1YeAWdwkNjOaZgxPhQgxnWeX5xKubBEFNzrKu7xCqqOwk150XbcGnzv1oIfgXrDVWeB0Q39zNnWiQSwGd1HtZtQZ2ocYN8VzuHOmQgxPhQgx3B99L1biMvm79uC1a1FyZAKloNq4bgVj9jca1Hl3haPeXnctKusFpm09W+KzlSGjc9iiEt7aPl8HtHVe9ubtaqMdrG3tIxnzyLl673ke5+S17m7QC5M1Pcd29bW91b5jG6Aua.X7ScF7Ye7p327y+oC5wlXzWetmwpJ+jLsYOWto67dAflpuN17Z9PthkL3NnIN24c6IMiYRDQFIGtj8hyVZlbF63I4zRuyaaqNry920NvfIST3kMKhHxH6xx6nkVHqwjOeo6+qC.iqvox2dEKmu9O5wk8NdQp97e0JXRExW+G83.fqVcxN+r0QASpvA8F6bm2s8ztadl+keHu9+8uj8uqcvO8gd.15mtF.n5JJm+w64V4n6qX1zGsJdjaeE3ts15xxeYWw73G+zuPmq6ZqpxgzC+KF80u9ro2159Dd0e0SS.+94t91C7I2yy3bm2s28l2v4c98t3ssYJXhExc8PeOznQCq48daZqUm8Xd69LrayF+l+i+Mtsu92YPO1Di95Ww3rWzRX1KZIrgO7C3IdjuE+p25CPWDCsiwh9Z98dVyeQ7Au4qw24KccL84bkLq4uHrlRpDrWNRuqp7Sx+0i9HL+uv0yUc827PZLIFc0mEU80TM1s0DicxSA.l20rLdge1+L1a1FIjTxCoMbeM+dGkd87bu46ygJdOrucrUdtexOl6869CYdK8Kzk0wQ2Ww7j+3uO28C+8YdKcYCowiXzWe9DrJ6nGlm+e6wvS6tAfc8YqGKIjHwNHOInN24c69Z9898ds+.u5u5oYxW1L4195eGl47WH0WSUcY4qulp4+7Q+t7s+m+YRHdIh9bOiyZAKl8t0MwO3t9xjPRISi0UCeum3IIhH56IvmymtOuae9leuW3xtd9Y+Cec9m9p2AZ0oif9Cvs+M+G5xxe4yag3rkl4IdjuYW1Fu5Z2B5MXbPM9Dit5Wyo2sXqI75wCVSNEzN.N5p6s4z6tOuae9leuCFLH1puNBQHrlRZcdjd28kWL5ZD+H8t2l+rGrN24ca37O+dqUqVrlZZWvkWboC4MkSnLjXTnLj4zawf1EUGbsxAUqXfPdXZgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxHhQ6Af3RSlLE4.dYj8LJTFRLJTFRLJTFRLJTFxKfQDVDJDDJTnAzxnQiFzn4r+rDihvlFZoMNPU01utsSNiTI43M2kKShQQXgFMfQCQg+.Avt616yaqEiFvn9H6xdEA44LJBih0TTL0rR+Bd6lZ1oSrQquGWtDihvp3i0DiIoDOuW+Xrl.IDqod85jXTDVoORcjWxIRj5z0iqKRc5XLImHQEQOuNPhQwvf3iwHSIqz5wkWXlodd2qHHwnXXfFMPxVLiEiF57xrXz.IaIld7hVNWRLJFVDiI8LsrO6KlYJY06unkyk7V6HF1DWLm9EyDJTe9vymgDihgMc7hYRny++KDIFECqhOlK7dDOCIFECq5qWvR20iXzVEGObNVDWh6DUU1PdcrsssMLcUYglma6GefcnVHDCSj2ZGgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxPhQgxX.cT67vEk+v033RBO21kCxjghA7gP12++4cFNFGWz6ot+ULZODtnm7vzhAkHzpgH0N.NXE6GjXTLnrjwjDKYLIEVWmRLdQ.85zRFwX3BeCGgTXRwx3RvLiMAyTXRwF1VuWTDiW+rJjqdpiezdXLpIMyFnfDLegugi.rZLJVPNmc5KYA4jHVMEUXYcqbmCLSLyTIKqwwwqsQNdsMRAokDydb4RUMYmiVSCTQC1HEKwv3xHEb40KEehSg+fAY7YjBlzGIg.BDHD6q7pXBYlJYaMNNPk0RUM0xn8cs9kjLEEKN2jHXnPXysOVe4MxrROdLqOBp1Y6znKOrfbrhdcZoUu94iNQ8XLBcrz7RFK5ifiZqU1e8NXYEjJ.TWasymVVigswWhlhhcUSW+cYhFihFc4cHutUpX7Fm8TXrokLGrxZ49t54xZK9H3rcODgNcDuYSXwjQlXloxWcoykxp2FIX1DyL+r42+walwmYxTzXyE6tbygprVrDsAtgYME14wJmu4xlOu151AG9T8u4NvQSSO03XGU2LmrEWTP7QigHzxNptYxINSbLasxsM4L4yprINkC2LkjikEjsU1Q0MiUSQweXuki2fg3KOoL571L2LSfokhEJtN6gkw2QZp0vx5o2nTwX5wGGZ0pAOd8wu78WKM5nM.3Zl9DYmkVN6q7p3QtwEytJsR9e23NIoXMyitxkx3ROYfNl4Te52csDHXP9WuskwNKsb18IpjXMajEN4BtnHFOVSsxUMljXFs6iRs0Js6OXWtdSQpiS4vMPGgwTS1B.XysW7FLDQpUCVMomhROdJJ83IJcZwtGegsXb3jREiu21JgqalSlke5+6i1yg3i16g6xswRzFY+UTC.zfiN9qzXi1H.zRatIPvN9GuXLZ.yF0S9oZkJq2FNc6YD7dxfWa97yen3xIlnhfqLqDIDfSO96750.nUCDLDXHBs3+z2eCd5SqtfgBgKe94cNb0.PT5zh4ntvm.88WyHUKDktt9RM7FHH6o1gdrqTu.lqYFSfxavF+fW9uvdNwoXpiICfN1im0XMiESFoZa1YxYkJ4mpUl+jJffgBQY00D.DL3Y2KRss3.+ABxmcnSfGe9os1G5OmlQBSIYKLmLR.yQEAQnUKN73GeACRpl0S5lMvIZoMlalIRFwXf4lYBru5czkkOPHnt17PQoGOYDiAVdAoPFwXLrM9Z0q+N2q6Y9uV8FHrrtUpXrjxpl4O4B3IuuuHSJqTY06ti8JtmSdJt77yhImSZ7FaXWX2c67MW17YdSJed6sTL00hCZxQaTYim8IV+5qemjZ7wxO81uNlyDyi5r6bz5t0.x5KuQZyW.xLViryZZlxs6hpb1NarhlnMe9Y8k2H03zMYFqQ1W8N3fM5DW97yFp3ruHkO9D0iM2dIyXMx9q2QOB1ghiYqstr91eCN3X1BOOOxAz4M8CWT9xGG34wSc+q3yMe1z5z.2xjxD.9yGrJBL.+VN37QodNihKNDHDrpRq8z++gu4.BIFECJ1OmWTU3hR8bFEe91.dOixgJkX3x.JF+7xSPWL5PdXZgxPhQgxPhQgxne+bFCEJD1qqVbXqIBEL77w+LPnUWDDsk3HgzyXDeaKFYzuiwVpqFbzXCCmik9Tv.9wosFQqNcDWJo14kW99KdTaLcwlbJbZi1Cg9T+9goas4lGNGG8aNs0zn8PPLLoeGiACz02wccCjow9vntONDW5XP+BXl4XyAcZ66E2RzFwXTQNX2DiprXRcNAn97hAcLFqQ8b4EjMZ6k8PZReT7PW+BYoSaBbuKYNrvBKXHMH6uLaPOKelSdHuLyHuL4KOuKKbNzD8CCo2ZGKF0ykWPV8XOjSeLYxApnFdqMuG9Me3mwBKbrCoAY+UVVimbRJAh8z6UKoXMSdoZsKe+FGezFYBYlBlMnuWWlqeVExBl7XQynzSC4yyFxuOiwYxHyHuL6xdH27gOAqsjiB.lMpGe9GYdqfxzZbDiQCjdBVXASt.tghlBYmT77sV9BvhICLwLSku77tbRItX4Au1qjTiK1trL.b3SUGu952wHx3UzUgkCgr3itifbOmrptbn+aLpH4dup4v6t0RBGalKn8Ud0jk03ozZZfu7UdY7Tu6mPfPgvqu.LuIkOs60OM5nU16IpjhO4ovq+.ctLG9T0A.kVSCXMV03bT9yaBaGOiQqOJzGgNb6siXLwXhl6bQyhUumC04+PORIZC5QmVsbCEMkNurSVWSrmSTIKdJiiu10bEnUiVdiMryNOAtDi9BKwnGe9YGkVAt85CniWE88sj4v+2F2EmZj7jm+zGzws0tG7FH.uyV1Kd8GfwkdxDYD5XJ4jN68jmhUumCQQiMGl83xkMenSLxM9D8ogbL5wme14wqryPDfqdZim3Mah64plcmW1O+s+3g88B4vc6jk03XgENVV8tOHeqku.psYGjQhV3k+jsRrFMvctnYQUMYmjh0L+0cruNWlkLswymT7QFVGeh9V+9Dxp6eraKcZiGeABvNJsRZq8Q1yI4y8i0p6iqHzoEsZzfW+APejQfwnhD6s49L6zDcZ0RrlLfCWtIvoOYiO2k4RYp9GG3fdOi9BDfcNJDhWH9Cb1895wme73qqehMABFjla004cYDidFzu0N6rzJoUEKDEWbqeGiZzz0a5nUH18wg3RG86+kM53SX3bbzuYJt3FsGBhgI86myX7olFgBFf1r2BDFOwsGHLmfUh+bNVFA0+IkK5+52wnVsZwZlYi0Lyd3b7H9bL4IfITFRLJTFC32mwQyukrNyjHvn8XXzd6eopA0a58nwzhW2mVUFsGCi1a+KEIOLsPYHwnPYHwnPY749X7LmKLC2lZNYzqmWMYYMARLlnGQFCptO2GiiTmEfSKuL50y07bRNdRLVIFgv7znbRwZlqunBo4VcQyNcwgqpdt8Eb4TVcMgC2d3SJ4H7nqbobrppGCQEIqZ2GfUN2YvK+IakP.2wBmIu5mt8A81+9t54P6d7iW+9Y+UTCUYyNew4LUp2dqjaRIvuY0eF20hKh5ZwIYjnE9qae+jjEyLswjAM4vESKuLvr9nXWmnRJs5g9T4hI8QwsufYhC2sS1V63y1eF4kEIEazjXLl4i16gFxaiKkDV2yXQiOW9vceHd2sVBGo5FXASNediMrK9KaqDRM9XINyFwdasy6r0h4S2+w3JlX9bfJpgIjQJLwLRgCV4P6avJMng2Zy6g2cakvUNw7fPgX86uTJs55wrQ8DYD5HAylnVaNXiG33XuM2zf8Vo3SVEK+xmDGop5XmkVAW8TmPX42GyYb4x51+w3O8Y6lFb3DcZ0xUNw73301HkTVUb0SK7rctTQXMFMEUj31SGe4+nAPejQfS2sC.1c0NFiLJbc5q2sWuXLxHYOmriu7gJLmzojxpZHs88GHH9BDf.AChVMZXLoXsinDvsGenUiFd4OYaDuYibUSYbjPLl5bYiHBcD5zG42qdOGbHMNNC8QEIsc56uNc6gnhTWmGHut84iMbfRCKamKUDVeX5ibp5YAEV.mnlFYJ4lAGrxZ4pl534nUWGIawL0a2IYmT7LorRiwkQRTR4UQ6d6HR7ELvP97q1j9nnnwkKQnUKk2fMRM9Xn4VcgknMRzFiBiQFI20hmMe3dN.YmbB.ZHXnfL87xjJZnYROg3vkWubY4kE+tOZSC4eebvJqg4Oo7ojxplwjbh31iOBFLHlzGEomXbnUilN+iUQXNFKo7pnAGshI8Qx+2F2EgBEhZZ1AlhJR9e23tHPvfTsM6X2ka9zRNF1c0wWHi0a2Imr9g9rKlW+94j01HZ0pg5ZoiuQrxI4DncO93k93sfKud4kVylIs3ik+1N1OM2pKdqMsWhwnA16INE4lbBnQilvRHBP40aila0MIEaz7RqYK3OXPd40tUx1Z7TxIqhZZ1NVLYDuAT+y8lVawF0b7iRRYkKwkbpW3EXPHr+8.SMM20uPCqwV294lczku6mmVtYRrFMDVdAC0zriN+xs7LJudac4m85O.Gu1y9UaVqs6oyiZ8x51sMbvgK233z+QG.9511294bcppU++7B7A+5mtyedt2zsxs8iehv9T.yH9asyp10A5xOWbYmh2dK6cXYcKF5N3lWGevu9oY5KYY7estR3F+NOJa48dS9z23kB6aqO2+9LJ5aQDkdV1C7vbW+jmB8lhl4sxaGMZzPimphv+1JruFEWRYbybtLtYNW.n0lah+vi8OPnPgX5W0xB6aqAULpBGJSi1igQ6s+HsPgBwK7P2KMTwI4696+Sj2Tu7v91X.8U7q3yuJa+6km99WI22+9yyLt5kOrrMjmynneIlDrxxdfGlzKX7CaaCIFE8KMUckrpe2ywIJdWCaaCIFE8KIldVrrG3gIqILvlyzGHjmynPYH6YTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnLjXTnL50yAlQx4r5Qi4oaUXtAu6Twwzvky27R948DxZjXNqdzXd5VElav6NUbLMbouNQ1jGlVnLjXTnLjXTnLjX7RLtb5ffAG4+xb2kSG7g+9mmSt+8vpe4Wfiu2cNfWGRLdIl095+NB52+H918jkrKxdxSkPABh0Lxg7m9LGvqi98zax0MqBIAylHXvPr1RNJiI0DYRYlJ0zhCBFLDqZWGfqbh4gI8Qg0XLy6ui8wBlbAXJpHAfVa26.dFgcxYkFScLYfFf8bhSgMmswRmwDn41bS7lLxVOZYjSRIvmTxQXgSt.ptY6jrkX5xXnsAvWR6qXNSC297SpwGCu4F2MSOuLIYKlIFiFX+kWC4kRhr9CbLZzQab+W8b40V2NXoyXBnAvqO+7Q68vcttlZNYv3xHYznAr4zE64jmhaZ1Sgla0Es5xCqojiLf9cA.GXyqiZJ8H30S6jV9iCqomE0WQYb4Wy0yG+J+Zl9RVNMVUEbnssALGWhr0+5elDRKCxZBERNSZZr5W9EHgTy.sQniq7Kd6rpe2ujDRMCJ+.EyM7cdT9nW9EXEe2GCa0TE6cceHSnn4yw10VvsCGT3BVBYNtI04X4u8hcLQP4yS6Luuzcvw18VIxH0C5zgu1cw3K5JwbbwOft+0u1ynQ8QQZwEKu5mtc9a6X+rzo2wbQ81NZ47A6X+DmIijd7VXRYkFmn1F4300HyaRc79ksmS1wTdWVVG3eokmQhVnk1by1OV4zniVwie+rgCbbNZU0QJwGKkVSCLlTRD.JHijo9Vb1qig9qThK1D3jLx..PAmjDQAQUps4NluuCFJDGulFojxplRqtAxKkDYGkVAWVdYQRwZlFc1Jydb4R6d7wgprVrFqYRMdKcttpytS19wJmCep5I2TSjDhwDZPC6qrp4HCx4hxjyNOl3UrPxsvoSUGsm+gsQywf0LxlIN6Evt9n+Jewu6iw0bueK125WCNs0HA76iwLsKi7m9rHne+bYK8FHqITHlrDG1quFrjXRXuw54faY8L4qXwrw250Huod4L44sX1x6+mN68sJNIFh1LK8d9FLsEesr209gTvLlMiunqjILqqj7l1rFvgHzOiwnzoCmt6XOLNb0NQEgN.nMOcbYt74k3LaD2d6X9qtQGsxtKsioLM2d7A.AGDego+Q68vTssVXBYlBWwjxiojSFL0byffACg2S+PQU1TKLqwlCU2jcLoWeuNF5udkOcaDsgnXASt.RK9X45l4jIdylvkWunQiFpnAajURIvLGaNryRqjnMb14n7sdzx5xjB5hKbrjQBVvsWunIDTZ0MvZJ9HjepVYYW9DGv+t.fs79uI1poJLXxLzsecFLXWm8aCELHFLEMZzngnLYDqYjMK3KeOT0QNHa7sdMZo9ZYq+0+LAB3GClhlPgBwjtxqhC7Yqk5p3DjRN4Qv.m8g6uha9157+2W6tI5SGaliOQ7zVaCp6OcW+JFs6xMVh1.SLyT4pm93Y+UTC.L6wlKiKijwZrl4PmpNhKZSDYDQvLFSlTPZIMjGb2PQSkXLZfZZ1AQnQKoFWLzRqtHwXMSz563KSncUZ4rh4NM10wJmZawwPZLbeKYNzji1vo61QmNsXM1noU2sSlVimH00we.VVcMwXSOIptoV3fUVKiKyjQmNsbSEMEzo8r+5Lo3LiCWsSNIk.Z0ngojS5TzXygJZrkdDR8W1quFLEiEp8jGC+A7QrIlDGY6ahR1vZnxC2wDkZDQDEGXyqizKXBrqO5uQo6daDUTFnlSbT14e+uPFiahnUqNZogZHJCFvuGOzRC0Sf.9Is7Jfiu2cP1iuvNtOjUtXqlpnkFpis+2O6aDeJ4jOUbv8Q4GpD1wpdWF6kO6A2cntoWmQId3hxuGeJ.5iLBxLw3viu.bplZlqXh4Qas6Amt8vIN8zBrI8QQZwGKNc0N06nURHlnwo61wm+.jZ7Vn1tMEK+T2+J5xGCVu8IOjk0DPm1yNEGmepVok1biNMZnwVcQvfAIKqIPkMZqWGCcWesMiLBcjs03wgq1oAGshYC5Ik3hgJarYRLFyTSy1wPjQRLF024z0bRwZlXM0wevbl8RBfgHijLRzB0zrCrXxH0zr8NusUzXycYxzu+76A.ZusVogJKijxdL3roFIorxA6MVONZrdhN13vRxohOudnk5qkTyMeppzCSP+9Is7GOQDYjXug5vQSMPxYmG5MYhFprbB32OwZMIBELHQaINrUSUDcbIfdiFAfJOxAPqVsjwX65dyc4zAMUUEXLFKXMirnM6sfFsZQiFMDLP.h1Ru+zxN26qcW+9Ev3wm+tLWT6nM2X2kmNi..b4waWtM1bd1ce28Pr+5bW+.cY82a2ltOFFH597scqs6gVqsimJxYlqxa2mOZ2muNuMM3n0dLOhela2YVWmIROe219KCQalrlPG60xfoN9V0xh0jwh0j671nKhHH0b634JmQAc86YFKIkBVRJkN+4jxJmdrMRHsL5xOm03684VGSwDKlN8XA37FeCDC5Yt1y7P0BQ3h79LJTFRLJTFm2GldzXNq9yKayKDUbLMRPleFEJi++.lCtUdJWEpUM.....IUjSD4pPfIH" ],
									"embed" : 1,
									"id" : "obj-4",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 376.0, 106.0, 171.0, 283.0 ],
									"pic" : "vpt7_presets.png"
								}

							}
, 							{
								"box" : 								{
									"angle" : 0.0,
									"background" : 1,
									"bgcolor" : [ 0.827451, 0.827451, 0.827451, 1.0 ],
									"id" : "obj-20",
									"maxclass" : "panel",
									"mode" : 0,
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 0.0, 0.0, 890.0, 607.0 ],
									"proportion" : 0.39,
									"style" : ""
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"disabled" : 0,
									"hidden" : 1,
									"source" : [ "obj-10", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-12", 0 ],
									"disabled" : 0,
									"hidden" : 1,
									"source" : [ "obj-13", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"disabled" : 0,
									"hidden" : 1,
									"source" : [ "obj-15", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-10", 0 ],
									"disabled" : 0,
									"hidden" : 1,
									"source" : [ "obj-16", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"disabled" : 0,
									"hidden" : 1,
									"source" : [ "obj-2", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-26", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-27", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"disabled" : 0,
									"hidden" : 1,
									"source" : [ "obj-6", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"disabled" : 0,
									"hidden" : 1,
									"source" : [ "obj-7", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-19", 0 ],
									"disabled" : 0,
									"hidden" : 0,
									"source" : [ "obj-8", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 343.0, 98.0, 66.0, 20.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p presethelp"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-140",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 343.0, 76.0, 46.0, 20.0 ],
					"style" : "",
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"id" : "obj-141",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 343.0, 28.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 133.0, 28.5, 21.0, 17.0 ],
					"style" : "",
					"text" : "?",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"tosymbol" : 0,
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-129",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 481.5, 475.0, 69.0, 22.0 ],
					"style" : "",
					"text" : "delay 1000"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-107",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1156.0, 492.0, 70.0, 22.0 ],
					"style" : "",
					"text" : "s presettrig"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-104",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 1141.0, 436.0, 24.0, 22.0 ],
					"style" : "",
					"text" : "t b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-68",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 800.0, 338.0, 65.0, 22.0 ],
					"style" : "",
					"text" : "s slotdone"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-30",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 411.0, 241.0, 77.0, 22.0 ],
					"style" : "",
					"text" : "s prespreset"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"hint" : "deletes selected preset",
					"id" : "obj-67",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 1128.0, 601.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 76.0, 50.0, 60.0, 17.0 ],
					"style" : "",
					"text" : "clear current",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"hint" : "",
					"id" : "obj-66",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 1276.0, 376.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 9.0, 50.0, 31.0, 17.0 ],
					"style" : "",
					"text" : "copy",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"hint" : "",
					"id" : "obj-65",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 1331.0, 376.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 42.0, 50.0, 31.0, 17.0 ],
					"style" : "",
					"text" : "paste",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.352941, 0.498039, 0.54902, 1.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "store preset with current number and name",
					"id" : "obj-53",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 694.0, 527.0, 61.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 8.0, 72.0, 17.0 ],
					"style" : "",
					"text" : "store",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"id" : "obj-19",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 351.5, 590.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 83.0, 73.0, 50.0, 15.0 ],
					"style" : "",
					"text" : "open",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"id" : "obj-40",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 406.5, 565.0, 50.0, 21.0 ],
					"style" : "",
					"text" : "save as",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"id" : "obj-41",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 451.5, 595.0, 50.0, 21.0 ],
					"style" : "",
					"text" : "save",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "bang" ],
					"patching_rect" : [ 757.0, 244.0, 34.0, 22.0 ],
					"style" : "",
					"text" : "t b b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-22",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 756.5, 223.0, 49.0, 20.0 ],
					"style" : "",
					"text" : "zl slice 1"
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
					"patching_rect" : [ 175.5, 591.0, 61.0, 22.0 ],
					"style" : "",
					"text" : "r supergo"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-148",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 962.0, 517.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s rfeid"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-117",
					"linecount" : 2,
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 841.0, 527.0, 113.0, 34.0 ],
					"style" : "",
					"text" : ";\rps getslotnamelist 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-106",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 767.0, 426.0, 63.0, 22.0 ],
					"style" : "",
					"text" : "s rnethole"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-28",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 767.0, 384.0, 83.0, 22.0 ],
					"style" : "",
					"text" : "prepend slots"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-113",
					"maxclass" : "newobj",
					"numinlets" : 9,
					"numoutlets" : 9,
					"outlettype" : [ "", "", "", "", "", "", "", "", "" ],
					"patching_rect" : [ 694.0, 498.0, 267.0, 22.0 ],
					"style" : "",
					"text" : "route store number name type go save slots feid"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-50",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 692.0, 468.0, 41.0, 22.0 ],
					"style" : "",
					"text" : "r rcue"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-11",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 815.0, 467.0, 57.0, 22.0 ],
					"style" : "",
					"text" : "s current"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-13",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 800.0, 200.0, 46.0, 19.0 ],
					"style" : "",
					"text" : "s current"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-32",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 841.0, 689.5, 65.0, 22.0 ],
					"style" : "",
					"text" : "store"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-25",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 906.0, 696.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "t b s"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"hint" : "to preset",
					"htricolor" : [ 0.87, 0.82, 0.24, 1.0 ],
					"id" : "obj-167",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 1319.0, 488.0, 50.0, 22.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.75, 0.75, 0.75, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"hint" : "from preset",
					"htricolor" : [ 0.87, 0.82, 0.24, 1.0 ],
					"id" : "obj-166",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 1230.0, 493.0, 50.0, 22.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.75, 0.75, 0.75, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-165",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1283.0, 520.0, 85.0, 22.0 ],
					"style" : "",
					"text" : "pack copy 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-158",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1318.0, 464.0, 30.0, 22.0 ],
					"style" : "",
					"text" : "v to"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-159",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1230.0, 465.0, 44.0, 22.0 ],
					"style" : "",
					"text" : "v from"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-157",
					"linecount" : 3,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 758.0, 575.0, 161.0, 47.0 ],
					"style" : "",
					"text" : "bang text,number,storetypemenu, pack"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-150",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "bang", "store", "bang" ],
					"patching_rect" : [ 884.0, 758.0, 64.0, 22.0 ],
					"style" : "",
					"text" : "t b store b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-147",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 884.0, 731.0, 59.0, 22.0 ],
					"style" : "",
					"text" : "sel insert"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-27",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 850.0, 199.0, 47.0, 22.0 ],
					"style" : "",
					"text" : "s undo"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-120",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 623.0, 782.0, 57.0, 22.0 ],
					"style" : "",
					"text" : "zl slice 1"
				}

			}
, 			{
				"box" : 				{
					"align" : 1,
					"allowdrag" : 0,
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_color" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color1" : [ 0.376471, 0.384314, 0.4, 1.0 ],
					"bgfillcolor_color2" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "color",
					"fontsize" : 10.0,
					"hint" : "select store mode",
					"id" : "obj-24",
					"items" : [ "store", ",", "storenext", ",", "insert" ],
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 868.0, 656.5, 57.0, 20.0 ],
					"pattrmode" : 1,
					"prefix_mode" : 2,
					"presentation" : 1,
					"presentation_rect" : [ 83.0, 7.0, 68.0, 20.0 ],
					"prototypename" : "vpt_umenu",
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"textjustification" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-51",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 444.5, 631.0, 52.0, 19.0 ],
					"style" : "",
					"text" : "writeagain"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-31",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 549.0, 202.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "..."
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-16",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1220.0, 53.0, 28.0, 20.0 ],
					"style" : "",
					"text" : "r pp"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-18",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 1224.0, 84.0, 69.0, 22.0 ],
					"save" : [ "#N", "thispatcher", ";", "#Q", "end", ";" ],
					"style" : "",
					"text" : "thispatcher"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-102",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 623.0, 136.0, 34.0, 22.0 ],
					"style" : "",
					"text" : "r fps"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-93",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 737.5, 200.0, 22.0, 20.0 ],
					"style" : "",
					"text" : "t b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-98",
					"maxclass" : "newobj",
					"numinlets" : 7,
					"numoutlets" : 7,
					"outlettype" : [ "", "", "", "", "", "", "" ],
					"patching_rect" : [ 623.0, 170.0, 246.0, 21.0 ],
					"style" : "",
					"text" : "route slotname delete read write recall current"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"bgcolor2" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.0,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"bgfillcolor_color2" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 1,
					"id" : "obj-99",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 630.0, 246.0, 103.0, 22.0 ],
					"style" : "",
					"text" : "...",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-73",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 985.0, 488.0, 30.0, 22.0 ],
					"style" : "",
					"text" : "v to"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-70",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 945.0, 488.0, 44.0, 22.0 ],
					"style" : "",
					"text" : "v from"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-55",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 624.0, 808.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "t b s"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-49",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 5,
					"outlettype" : [ "bang", "bang", "bang", "bang", "bang" ],
					"patching_rect" : [ 692.0, 618.0, 73.0, 22.0 ],
					"style" : "",
					"text" : "t b b b b b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-122",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1094.0, 18.0, 46.0, 19.0 ],
					"style" : "",
					"text" : "column"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-123",
					"maxclass" : "number",
					"maximum" : 4,
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 1094.0, 40.0, 35.0, 21.0 ],
					"style" : "",
					"triscale" : 0.9
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-124",
					"maxclass" : "number",
					"maximum" : 150,
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 1055.0, 41.0, 35.0, 21.0 ],
					"style" : "",
					"triscale" : 0.9
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-125",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1055.0, 66.0, 58.0, 21.0 ],
					"style" : "",
					"text" : "pack 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-126",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1055.0, 88.0, 88.0, 21.0 ],
					"style" : "",
					"text" : "col $2 width $1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-127",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1055.0, 117.0, 94.0, 21.0 ],
					"style" : "",
					"text" : "s dim_command"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-128",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1052.0, 19.0, 37.0, 19.0 ],
					"style" : "",
					"text" : "width"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-116",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1007.0, 438.0, 74.0, 22.0 ],
					"style" : "",
					"text" : "prepend set"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bordercolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-115",
					"keymode" : 1,
					"lines" : 1,
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"outputmode" : 1,
					"parameter_enable" : 0,
					"patching_rect" : [ 1033.5, 408.5, 84.0, 18.0 ],
					"readonly" : 1,
					"style" : "",
					"text" : "presetname",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"varname" : "textedit[2]",
					"wordwrap" : 0
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-112",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1224.0, 556.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "s ps"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-110",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 1210.0, 525.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "t b s"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-100",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1098.0, 529.0, 91.0, 22.0 ],
					"style" : "",
					"text" : "prepend delete"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-101",
					"linecount" : 2,
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1060.0, 562.0, 49.0, 35.0 ],
					"style" : "",
					"text" : "delete 4"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-97",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 959.0, 618.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "t b s"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-96",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 973.0, 645.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "s ps"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-95",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 997.0, 528.0, 87.0, 22.0 ],
					"style" : "",
					"text" : "prepend insert"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-94",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 959.0, 590.0, 57.0, 22.0 ],
					"style" : "",
					"text" : "insert 4"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"htricolor" : [ 0.87, 0.82, 0.24, 1.0 ],
					"id" : "obj-92",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 984.0, 459.0, 50.0, 22.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.75, 0.75, 0.75, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-89",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "int", "int", "int", "" ],
					"patching_rect" : [ 937.0, 406.0, 89.0, 22.0 ],
					"style" : "",
					"text" : "unpack 0 0 0 a"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-86",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 643.0, 848.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "s ps"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-81",
					"maxclass" : "newobj",
					"numinlets" : 4,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 623.0, 758.0, 93.0, 22.0 ],
					"style" : "",
					"text" : "pack a store 0 -"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-54",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 768.0, 679.0, 61.0, 22.0 ],
					"style" : "",
					"text" : "route text"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bordercolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"hint" : "preset name to be stored",
					"id" : "obj-58",
					"keymode" : 1,
					"lines" : 1,
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"outputmode" : 1,
					"parameter_enable" : 0,
					"patching_rect" : [ 767.5, 656.5, 84.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 43.5, 28.5, 77.0, 18.0 ],
					"rounded" : 0.0,
					"style" : "",
					"text" : "presetname",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"wordwrap" : 0
				}

			}
, 			{
				"box" : 				{
					"allowdrag" : 0,
					"fontsize" : 11.595187,
					"id" : "obj-60",
					"items" : [ "individual", "output", ",", "output", "as", "one", "list", ",", "output", "as", "one", "symbol" ],
					"labelclick" : 1,
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 812.0, 125.0, 105.0, 21.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-61",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 812.0, 150.0, 102.0, 21.0 ],
					"style" : "",
					"text" : "mode outmode $1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-63",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 797.0, 88.0, 101.0, 21.0 ],
					"style" : "",
					"text" : "mode selmode $1"
				}

			}
, 			{
				"box" : 				{
					"allowdrag" : 0,
					"fontsize" : 11.595187,
					"id" : "obj-64",
					"items" : [ "no", "selection", ",", "one", "cell", "select", ",", "column", "select", ",", "row", "select", ",", "header", "select", ",", "in-place", "edit" ],
					"labelclick" : 1,
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 797.0, 64.0, 105.0, 21.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-48",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 600.0, 369.0, 33.0, 22.0 ],
					"style" : "",
					"text" : "s ps"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-29",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 637.0, 314.0, 96.0, 21.0 ],
					"style" : "",
					"text" : "getslotnamelist 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-37",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "clear" ],
					"patching_rect" : [ 640.0, 370.0, 42.0, 21.0 ],
					"style" : "",
					"text" : "t clear"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-38",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 800.0, 308.0, 64.0, 21.0 ],
					"style" : "",
					"text" : "route done"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-79",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 550.0, 162.0, 32.5, 20.0 ],
					"style" : "",
					"text" : "1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-74",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 510.0, 122.0, 24.0, 20.0 ],
					"style" : "",
					"text" : "r lb"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-5",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 656.0, 639.0, 32.5, 20.0 ],
					"style" : "",
					"text" : "0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 656.0, 612.0, 24.0, 20.0 ],
					"style" : "",
					"text" : "r lb"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-47",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 175.5, 657.0, 70.0, 20.0 ],
					"style" : "",
					"text" : "send oscpres"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-35",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 277.5, 701.0, 29.0, 20.0 ],
					"style" : "",
					"text" : "s ps"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-12",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 406.5, 632.0, 35.0, 19.0 ],
					"style" : "",
					"text" : "write"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-21",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 333.5, 632.0, 30.0, 19.0 ],
					"style" : "",
					"text" : "read"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"format" : 6,
					"hint" : "type in the preset number you want to jump to",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-71",
					"maxclass" : "flonum",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 175.5, 633.0, 51.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"fontface" : 1,
					"fontname" : "Arial",
					"fontsize" : 24.0,
					"format" : 6,
					"hint" : "current",
					"htricolor" : [ 0.87, 0.82, 0.24, 1.0 ],
					"id" : "obj-111",
					"ignoreclick" : 1,
					"maxclass" : "flonum",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 298.5, 770.5, 75.0, 35.0 ],
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.75, 0.75, 0.75, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"hint" : "preset number to store",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-20",
					"maxclass" : "number",
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 725.0, 665.0, 35.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 7.0, 29.0, 35.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"tricolor" : [ 1.0, 1.0, 1.0, 0.501961 ],
					"triscale" : 0.9
				}

			}
, 			{
				"box" : 				{
					"angle" : 0.0,
					"bgcolor" : [ 0.52549, 0.0, 0.0, 1.0 ],
					"id" : "obj-15",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 445.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 7.0, 7.0, 74.0, 19.0 ],
					"proportion" : 0.39,
					"rounded" : 0,
					"style" : ""
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-158", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-1", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-165", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 1340.5, 436.0, 1340.5, 439.0, 1292.5, 439.0 ],
					"source" : [ "obj-1", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-71", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-10", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-101", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-100", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-97", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-101", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-98", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-102", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-85", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-103", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-107", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-104", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-85", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-105", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-112", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-110", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-110", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-116", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-117", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 6 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-148", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 7 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-20", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-35", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 4 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-53", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-115", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-116", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-58", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 1016.5, 547.0, 777.0, 547.0 ],
					"order" : 1,
					"source" : [ "obj-116", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-35", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-12", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-55", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-120", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-114", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-121", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-125", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-123", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-125", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-124", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-126", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-125", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-127", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-126", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-51", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-129", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-121", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-133", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-49", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-134", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-133", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-135", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-136", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-135", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-140", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-137", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-121", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-138", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-164", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-14", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-139", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-140", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-137", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-141", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-143", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-142", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-51", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-143", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-37", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-145", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-37", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-146", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-150", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-147", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 933.5, 754.0, 764.0, 754.0, 764.0, 691.0, 657.166687, 691.0 ],
					"source" : [ "obj-147", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-86", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 960.5, 833.0, 652.5, 833.0 ],
					"source" : [ "obj-149", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 916.0, 782.0, 752.0, 782.0, 752.0, 695.0, 657.166687, 695.0 ],
					"source" : [ "obj-150", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 893.5, 784.0, 744.0, 784.0, 744.0, 699.0, 632.5, 699.0 ],
					"source" : [ "obj-150", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-94", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-150", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-154", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-153", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-156", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-154", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-160", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-156", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-165", 2 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-158", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-167", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-158", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-165", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-159", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-166", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-159", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-18", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-16", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-37", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-160", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-104", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-163", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-89", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-163", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-165", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 423.0, 567.0, 877.5, 567.0 ],
					"source" : [ "obj-17", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-21", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-19", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-53", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 1029.5, 722.0, 666.0, 722.0, 666.0, 519.0, 703.5, 519.0 ],
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-138", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-20", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 2 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 2,
					"source" : [ "obj-20", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-95", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-20", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-35", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-21", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-7", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-22", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-44", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-23", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-2", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 896.5, 681.0, 1029.5, 681.0 ],
					"order" : 0,
					"source" : [ "obj-24", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-25", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-24", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-32", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-24", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 3 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 929.5, 725.0, 706.5, 725.0 ],
					"source" : [ "obj-25", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 915.5, 722.0, 632.5, 722.0 ],
					"source" : [ "obj-25", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-36", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-26", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-106", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-28", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-37", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 646.5, 357.0, 649.5, 357.0 ],
					"order" : 0,
					"source" : [ "obj-29", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-48", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-29", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-99", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-31", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-147", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 850.5, 718.0, 893.5, 718.0 ],
					"source" : [ "obj-32", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-20", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 355.0, 657.0, 734.5, 657.0 ],
					"source" : [ "obj-33", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-53", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-34", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-58", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 341.0, 556.0, 777.0, 556.0 ],
					"source" : [ "obj-36", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-164", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-37", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-164", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-38", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-68", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-38", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-40", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-51", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-41", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-149", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 755.5, 651.0, 960.5, 651.0 ],
					"source" : [ "obj-49", 4 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-20", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-49", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-32", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 715.0, 649.0, 850.5, 649.0 ],
					"source" : [ "obj-49", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-58", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 742.0, 647.0, 777.0, 647.0 ],
					"source" : [ "obj-49", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-49", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-113", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-50", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-35", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-51", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-87", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-53", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-81", 3 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-54", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-129", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-55", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-55", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-86", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-55", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-54", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-58", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-61", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-60", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-162", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-61", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-162", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-63", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-63", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-64", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-1", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-65", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-159", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-66", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-101", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-67", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-7", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-35", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-71", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-47", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-71", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-103", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-72", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-31", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-74", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-79", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-74", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-162", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-8", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-120", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-81", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-105", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-84", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-133", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-87", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-134", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-87", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-152", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-87", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-11", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-89", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-116", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-89", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-92", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-89", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-5", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-9", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-100", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-20", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 993.5, 558.0, 734.5, 558.0 ],
					"order" : 4,
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-70", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 3,
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-71", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 5,
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-73", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 2,
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-91", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-69", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-93", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-97", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-94", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-94", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-95", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-97", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-96", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-97", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-13", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-98", 5 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-98", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-27", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-98", 6 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-28", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-98", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-30", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-98", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-38", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 632.5, 290.0, 809.5, 290.0 ],
					"order" : 0,
					"source" : [ "obj-98", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-93", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-98", 3 ]
				}

			}
 ]
	}

}
