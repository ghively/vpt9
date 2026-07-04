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
		"rect" : [ 34.0, 34.0, 732.0, 532.0 ],
		"bgcolor" : [ 1.0, 1.0, 1.0, 0.0 ],
		"bglocked" : 1,
		"openinpresentation" : 1,
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
		"boxes" : [ 			{
				"box" : 				{
					"bgcolor" : [ 0.290196, 0.309804, 0.301961, 0.0 ],
					"blinkcolor" : [ 0.784314, 0.145098, 0.023529, 1.0 ],
					"hint" : "rescan midi bus",
					"id" : "obj-100",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"outlinecolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"patching_rect" : [ 124.5, 15.0, 24.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 9.0, 22.0, 17.0, 17.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-89",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
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
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-76",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "float" ],
									"patching_rect" : [ 105.5, 106.508423, 47.0, 22.0 ],
									"style" : "",
									"text" : "/ 1024."
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-42",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 50.0, 145.508423, 96.0, 22.0 ],
									"style" : "",
									"text" : "sprintf set ser%i"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-68",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 50.0, 173.508423, 49.0, 22.0 ],
									"style" : "",
									"text" : "receive"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-70",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 155.0, 182.508423, 68.0, 22.0 ],
									"style" : "",
									"text" : "s to_router"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-71",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 155.0, 145.508423, 59.0, 22.0 ],
									"style" : "",
									"text" : "pack 0. 1"
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"id" : "obj-86",
									"index" : 1,
									"maxclass" : "inlet",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"patching_rect" : [ 50.0, 40.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"id" : "obj-87",
									"index" : 2,
									"maxclass" : "inlet",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 195.0, 40.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"id" : "obj-88",
									"index" : 1,
									"maxclass" : "outlet",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 105.5, 262.508423, 25.0, 25.0 ],
									"style" : ""
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-68", 0 ],
									"source" : [ "obj-42", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-76", 0 ],
									"source" : [ "obj-68", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-70", 0 ],
									"source" : [ "obj-71", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-71", 0 ],
									"order" : 0,
									"source" : [ "obj-76", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-88", 0 ],
									"order" : 1,
									"source" : [ "obj-76", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-42", 0 ],
									"source" : [ "obj-86", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-71", 1 ],
									"source" : [ "obj-87", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 598.5, 313.491577, 32.5, 22.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p sr"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 8.0,
					"id" : "obj-85",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 460.0, 268.0, 112.0, 15.0 ],
					"style" : "",
					"text" : "val"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 8.0,
					"id" : "obj-84",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 440.0, 269.0, 112.0, 15.0 ],
					"style" : "",
					"text" : "ctrl"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 8.0,
					"id" : "obj-83",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 435.0, 291.0, 112.0, 15.0 ],
					"style" : "",
					"text" : "id"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-4",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 418.0, 222.0, 128.0, 18.0 ],
					"style" : "",
					"text" : "serial router",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-131",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
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
						"rect" : [ 397.0, 134.0, 275.0, 301.0 ],
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
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-4",
									"linecount" : 3,
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 193.0, 165.0, 59.0, 45.0 ],
									"style" : "",
									"text" : ";\rserialout close"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-1",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 2,
									"outlettype" : [ "bang", "" ],
									"patching_rect" : [ 193.0, 134.0, 36.0, 20.0 ],
									"style" : "",
									"text" : "sel 1"
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"id" : "obj-15",
									"index" : 1,
									"maxclass" : "outlet",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 47.0, 206.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"id" : "obj-13",
									"index" : 1,
									"maxclass" : "inlet",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 68.0, 27.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-11",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 83.0, 134.0, 91.0, 20.0 ],
									"style" : "",
									"text" : "expr abs($i1-1)"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-8",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 68.0, 72.0, 32.5, 20.0 ],
									"style" : "",
									"text" : "t l l"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-7",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 47.0, 171.0, 34.0, 20.0 ],
									"style" : "",
									"text" : "gate"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-3",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 83.0, 100.0, 97.0, 20.0 ],
									"style" : "",
									"text" : "zl compare OFF"
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-4", 0 ],
									"source" : [ "obj-1", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-7", 0 ],
									"source" : [ "obj-11", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-8", 0 ],
									"source" : [ "obj-13", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"order" : 0,
									"source" : [ "obj-3", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-11", 0 ],
									"order" : 1,
									"source" : [ "obj-3", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-15", 0 ],
									"source" : [ "obj-7", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-3", 0 ],
									"source" : [ "obj-8", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-7", 1 ],
									"source" : [ "obj-8", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 326.0, 442.0, 71.0, 20.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p workaround"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-81",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 345.0, 264.0, 22.0, 20.0 ],
					"style" : "",
					"text" : "t b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-82",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 345.0, 304.0, 66.0, 20.0 ],
					"style" : "",
					"text" : "insert 0 OFF"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-79",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 511.0, 138.0, 75.0, 22.0 ],
					"style" : "",
					"text" : "print serialO"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.913725, 0.913725, 0.913725, 0.0 ],
					"blinkcolor" : [ 1.0, 0.89, 0.09, 1.0 ],
					"id" : "obj-77",
					"ignoreclick" : 1,
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"outlinecolor" : [ 0.713726, 0.713726, 0.713726, 0.0 ],
					"patching_rect" : [ 242.0, 100.0, 20.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 165.0, 8.0, 10.0, 10.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-41",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 448.0, 118.0, 55.0, 22.0 ],
					"style" : "",
					"text" : "s osc_in"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-74",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 264.0, 636.0, 75.0, 22.0 ],
					"style" : "",
					"text" : "print serialin"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 1.0, 1.0, 1.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"format" : 6,
					"hint" : "incoming serial value",
					"htricolor" : [ 0.87, 0.82, 0.24, 1.0 ],
					"id" : "obj-73",
					"ignoreclick" : 1,
					"maxclass" : "flonum",
					"minimum" : 0.0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 668.0, 342.0, 43.0, 19.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.75, 0.75, 0.75, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"allowdrag" : 0,
					"arrow" : 0,
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_color" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_color1" : [ 0.376471, 0.384314, 0.4, 1.0 ],
					"bgfillcolor_color2" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "color",
					"fontsize" : 9.0,
					"id" : "obj-66",
					"items" : [ "--", ",", "A", ",", "B", ",", "C", ",", "D", ",", "E", ",", "F", ",", "G", ",", "H", ",", "I" ],
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 523.5, 341.0, 44.0, 19.0 ],
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"hint" : "controller nr",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-69",
					"maxclass" : "number",
					"maximum" : 100,
					"minimum" : 1,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 599.5, 342.0, 48.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-67",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 589.0, 95.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "--"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-64",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 212.0, 489.0, 74.0, 22.0 ],
					"style" : "",
					"text" : "prepend set"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-61",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 213.0, 514.0, 116.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 75.0, 6.0, 86.0, 17.0 ],
					"style" : "",
					"text" : "--"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-92",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 5.0, 42.0, 33.0, 20.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-95",
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
						"rect" : [ 263.0, 44.0, 894.0, 628.0 ],
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
									"hidden" : 1,
									"id" : "obj-25",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 513.0, 387.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 542.0, 368.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"data" : [ 5678, "", "IBkSG0fBZn....PCIgDQRA...jG...faHX....v.ovqZ....DLmPIQEBHf.B7g.YHB..UTdRDEDU3wY6clGdTTj2G+SeLyjIYxjCHPf.J2fbn.q.KDO49P7BUTwKPQ2E7XW2W0kCEbWWO20Ud8U84A7VQTAWtUA2EbAu3TDDTBfgH2PjbOmc206ezSh4XRxjvLYFRxmmm4IS5t5Z9U82tpt5p90+Jo48k6U3dpWO5GHKj75gl4rSD.XKNT6TWIt2XYfjDn4G2S85QYX1rOWs08IMKvmkiDfjtFhhKBLLPo+CBeu87QaceBROYZoK3TGuBGfWIYJTUEuxJQGKNXHDX2vf3MzvtgQz1Zp.MHmuBwxu.PtEoQ7e7lnjqXHvoNNphbOAf4UB.TnhJmV0BtTTvqjxutinMBvlPm30UnEZ9IQcsnsEAz.d9JDK+R.h79EyCIf1pJIDkk.ORxjmhJEnXg3D5zBMuHKEanxFBAtUTHeEK.fECChSDcqQ2Pd9pNU9CTSuTsUt76qHUUJQUk3D5jfgQLi.CfrjDIXXfcgNtTTnXE0nsI0fd95Lo7WAQ1mjL9jTHNc8vtQVabdiX3zyQNhZMc100wmjBdkkq0zFoIZb9p9T9qPJERRHj.kfbEYmFxf4Bm3MblakAgjaaa4NdiWma+0eMRNiLpwzJGvFEUxFM.xCn72oxck93OrZ0074qHEUW4uFOlPIQYzm9vc+AuOo191WuMtpCIYYlx6713nksDGsrkLk29sPRot0KU2.uBv5.dSfe.PG3cK2m4Ar1vogeVD0pHOna8V3993UQQm7jQDCX7O9boyYNjx9+Nm4P3Je74VmxiMAbd.S.3VAVCfBvTC745AR.X3gEKt1oGCanL5G4gos8t2kssV1wNPRsoMjTaZC8+5l.I211Vgio0cqab4Se5z2q7JqyWjWaTqhreOd3oGzfY+a7KBq+vkxJdzGioGW7U3yxm8iVmxiR.RMv2sA3Mv1JkUALr.6KRhhUqb+exGyfusaCEKVXJu6ay3dzYC.Ydm2I2wa75bWu2BoyCYHL2cuKZe+5G.bo+9eG20hVHwmRx7atgqmYsssfTXrOG0ZWz19hWRX6GKRQ2wr1ap.GhJd+2iAT.POa.riNNvAPtYmMu2zlN.r+u5q3ZepmjU+WeB.PWSi4M5w..1c5j9LlQyg1wNnOicr7xW80PdG5v.vSenbnUcoKbhrxJrXWQ+mCILPWvTT2IPGAZIf8.6aG.CnAxN1+W7kn62Oia1yh3SMU57PFLJVrT19+4u8aK664erighMafPvqdyShgde2KRxxz4LyD6NcVgi6Lkn+ygDFHaLE4q.HCLKTk1z79wrldCAcenWN2yh+PN1d9A9p27s3Cev+TE1unRCGojjDp1rwr11VQRUkr1vF3ktxqhhxM2vpcE0qIOskuL50nFYE11tWyZ4kupqNjyiVA7o.YAbRfwUt8UDPRm4lYHw4M7gyNW4pX6+q+EfYmJkTq4Swo2idf8jbZ1jtPPF8oOjT5oibsbb0Eh5h7aM4ovL17lHk1Y97w4c3ivaMk6rNkGI.bOXduWmX1y5RYlgI6LTXqevGx8s5URq5ZWQwhEx+3GCmokl4z9UMbzcuaN9O7i7m+pu.OEUL.j6AOHIkd5b3u66BK1kzSFXpHA3v1ryorXkz76Krj4gJcZv+V9iel4Sw9OG4n3m9putFSeo1X675tgv7pVhVmuBkxeBa5mnjA0IfJWSVH.AHDBjZ.GEme5q+FVwblKRRR0p.KBXiTtIVIpQT37U8o7WAQ1pv.KBC7JqzfOCOe1+34Coz4UVAKBCrDCHxQiyW0mxeE5cc7553PWihkUvijr4UMwP3VRlhkUvgtFNhAlO4F5yW02xeEpI6vPGeAN3hUTonvXO7BGXwvfj0Mmv7DLZ3morJSC84q5a4uJVUpZ9wpgA1MLveLvz4UdTMLhYD3Rog77U8s7GzK8bXniiXnSjw5Dqe9J1ppZyDQnYQtI.MKxMAHn2S1ORTnpJtkUpwgjCg.KBAIo4Op64jMS0SUDYMj3TVsQQJlhrnVFHGqFF3QVlz76i3MzwZRIQGG9voE8nGUYP1Mz0I2cuaxY8qGu4meE1maYYNXbIPtVrVy9ujPPZ98RG73pZcxbOX5uWQ2A8LzPBHdfDC72HAUQjKPUkhTTwujDo32aM5jZBg.WJJTnhEyZzwk.m+TlBjTxTbPdbBIEUbdA8k910txNl+7KSn8HIyNbjDEqnheI4Z7BKIg4n9jmpU5Ww4WEgNeLmIpXtWNfpi.NMeA55zZhLyXVUDYOxJ3QVgj86qV8BQo.9BrWEE7JISqurKGRJYN1gNDe6RWF9JojJjdaNbPeF2Xo8cpSzggOb16RL85jrsm.EqnhUgft3pHrP0OxQ9PhiDmcbonP1wk.8zUQksO2.4BTnpURPVhTQJlx2wCFFBAEiDEHo.Z9vJ+pCODtnJU2DRRXHAJ0gyMJBAFRfyN0Q7KKyNV9Jph.Cf2hKlcs5OFexxjZW6ZYa+zVrfeIYZuaW0n.CfUDjgG23SRlSawZE1W9.EqnPBxRjnjbLu.CltXqSIYRPVBWJJTPj32HblYp1rg.vaQEUsowawEi.SmdqTzCzDs0ZQfKEqHPHAFURD8B3SRg3i4aitp3.I7IoPj3cKsQ0iPY.MXN6da5YOwZBID1xuRcZ9HwynznRjaHY7O9bHsN24nsYDRDaMMSMfzldzC520dMT3IOIa98VD9b4hLmxjYeaXiLfabhr2+6+sLeMukcrCzuq4ZPyqO17hVDkb5SWg7J0y8bXP27MyQ+9cy2sxUB.ViOdN+weEXygCN0AN.EcxSww1ydZnKl.MQqI2990Otg48Br+u7KIwzRia+Mec.HyoLYF+bmC4rssyMNuWftbwWDImQFbGuwavQ99uGetcw88wqpB4UuG8n4dW0J4H6bWLvacRLlY7mAforv2g1229hEa13Ne22g1zqFBO+N3zjrlbI+Rt7l2wjoEc3bImssMtvabhksuUNm4xIOvAns8pmz1d1SNYV6i2bxSl3SIU76wSUd8Vxbp2Iu8TtKN3V1B6b0qlmXeYwV+vEi8DcxRmgoaD1hNzgFxhWUnIoH2xN1QtoW9kXmqXklu0BkqiZtKrP.yQmSRVlDRIEt6OZwrm0rVN092eUxq3clDkb5eor+2awEQxYjAtJ3WGQuJ27dCMMIatdf27MyJl0ixRmwLI6MuYjqgI6ueW60vWL+Evhev+De2JVQU5Q8IxJK5xEcQ.fyV2Zr4HQN3l2Lo28tSBsnE.PuF0nhbElPflj0j2wRWFW6y8LLva4l4D6MKN7NL8u4ed6eKZ9Lcu1SenCggO+j8l1L2wa8FbdCe3b3ctS9g+y+AK1syQ28dvWIEyp+qOAS7EmGCZRSBggAyeh2H983gkMiYwTWz6A.9b4BzidSfSSRQ96+zOku+S+zpr82+9efx991WxGU12+K84BpRZW0be7x997u9IVg8Iqpxu45uNdgQZVCdpevhHuidjyX6t9RiJQVBhJ9MdkwPSiBNww4dW0JIwzZIY8e2.Y+MapFOlR8m5HgU2nRjsAXQXfajiXSaWnxG8PORcJ8twz1sVqortSipNd4.vgtFEXXfKgHlyuwqNJQHn.CCbnqgyHP92nplrSLmjBz7QwJpjmrLg3bdDUwhgAIoqQxX57.gaZTIx.jFlMaWjtFdic8R1JfULcVfHg.CMBEY+HgeUUDxJX8rf4StT+jyhleHB4mbMpD45p+oEqPk8StvMMpD45h+oEqPk8St37oG16MbiJQt79m1100XKAdYzFfhJCPM7EnUBmTY+jyujL1ByMa2n5QnpO9mVrBk5mbFQ.auQkH2LAmlE4l.zrH2DflE4l.zrH2DflE4l.zrH2DflE4l.zrH2DfFWhb4BChmsgPx7cuNRL+2MpF6ZKBgo6+nnPOPPaC3psIFiOQEZXNCZJABiigaZTIxIp6G2xxTnhEPUgDBTsv.y2c4XUzjjIQc+jngdDQPZTIxwaXPK76CqBAdADRmcb2HKB+jntNIoGtW4pLIlRjWUhg966a6ql6ckngNI5SmBPh7I1K3vHgY3hvAP7AtMhUgQDsyQwThb3ByfCiH1L3vH.2Bc7nqSqEhFjkNgXJQ9Vu9PeYB7y+vOJnaOVO3vzPDHXpLwThb3fJGbXh0PVRBmHAxFlABFc8HtHG6cV3LjyVBNLQx.ASkoQmH2PFbXNSHRFHXpLQrlq6xEeQAc6Qp07w5BS3YeF92O++jBN9wq0zlR6aGNaUqImssM53ucPb5ClSHcbwRDwD4tcIWRP2drfH2ty+7wh83Boz1+ILA761M4rsswv9CO.q4oe1lE4yVXryZVjQe5MEb7SvBtwahz6d2Yzy3QXAS7l.f+xO9C7zCdHbwScpXXnivPmtjYlj5K8h7+NlwQeu5qhK4dtaTrXgu3UeM137W.icVyj1bdmGoz91icmIxBm98VqKARMDDwD4r1vFhTYcXgr27l4suqoxnejGlQ8vODe2xWQURiq7xiMtfEfe2tYiK30n6CaXrlm9YoEm64xkeuSmWXDiBc+9YZKaoksZr4tfB30tkakyaDCmgN8o23VjiEZVtlnzHIvNV1x459G+8fJxUGss28h8r1OC2EXFIL20pVEcZPCB.xdKaA.x6mODVcD9hXemIznq20gJVhy7dx1SIY741k4zSVtdjqXs5eiKzb6g3SN4x9e6olJ97X9vPUdkUMVflrh7nmweltdIWLiYFyfss3kPdG9vbN8sez2q7J4JlyiQbNb.XFTW58XGKo28ti+RbwEe2Skr2xVnqW5kvEL9wSuF0nnWibDrqUs5nbIp5oFatdKZ09rhzMYky5tTYIOzCitlF+lIbsrrYMaN52+8.v7F0nXPSZRr20ud1wxVN.70u0ayw+weDW4mO+qYLSRuGcmRN8o4EG63n2iYLDeRIwKNtwiq7xiu4cdGz7ZF8f9ke9mYYyb1QsxX4olE4PXohqURxTZCWF5luQdp1rglWuAM8kFBjMzhdKCeGYW6B.V8S72pv1yM6CVkso40K6aCarr+unSdR.HuCcX137WPER6o+4CU12861MGc26NrZ20WBq0AK7vGFKBC50nFUPWt1UrZkdNhQfEgAEjSNkscIg.IA3WOzd2b8qqijv73pLkOB.EKSjLZ+TYpZM4x4mTCPo167cxAFdNIC3vaXiz1N0I5Pu6IYzmdGzzaQXfpa2j8+9eW11RRyOtkUXgKa4HqqUiKfMF.BYKzUgfjCxsShkh.P0DQxn8SkoJpX48SpADBi+qFP9A7OIeG8Hrq27MoCCcnjbm5TPikVmd+6mbV25vU4F0nN3wEEnZAjshgbn8Tcwa3kN3opKABkEAfjjAYYrCQ0X5UvnDgfBCDLXhDQ6mJSUNiVd+jxihBx0h6CVY+SpjidT1869t0IivotFWPwEPxZ9IOUK07ZQEPJ98w45wEIFjl2OaHB.Eoi1OUlpHx0U+jJb4eRN00nOkT3YTdTJw5Q.nHcz9oxDz1FK0Oo7JUa0ii79mT8EmA9zL0xiPEticEMSzgXwJgMSXllE4l.TsMWGxq7pQRDBraniSMspckeS.TnhJEqnVyKjmAAYgf3CzowXqGxJ7RPEYMjHWq1nPEUbIG87aYIADmgNdkUHMedCpPWnhJ4ZwJEoXoNGA9jDPhx9QFANCggv8rUBpHWfpJEpnhOIIRMJFY6zDBJQ0BEonhMUcZQPFgqRTToXEK3TyeHuL.VJ9PhBUsfcCiF0hbPumrGYEbKqPhZZQUudTURhDBLjmdjUBZZLBDf1rhf1zydRK6XGp07sEc3bos8pWU6Z9XiMBpHKBLdzpUpr2we6fHozSuZyrDSKMZSO5QU1dWujKlDRM0PxfZc25VE9e0.1Rnb+1Tae64dVxhIk1kQ0llTZWF769nkPJsqcgj8DKQh0SaNj6c8C7oeB+Oe954I1eVzsK6Rqx9u7oOcd5CkCydGamI7rOCf4rNMysrI9CqcM7D6OKxnO8gjyHCdIOtpvma3e97XygCl812JO1N2AyXyeCspKcoNWX18ZVCK4+4gXZKeYAUnSocYvzV9xXIOzCytWyZpy4ezjddS2Di8Ue050wFRhbuG8noaW1kxb5YuXaKdIbU+0+RE1uyV2Zt1m4oXdidL7Z2xsxPu+6ijZSaXPS5loUcsq7Po2VxdSalw8XylhN0o3EF4n3EF4n38l1zQ2ue1z6tPF0C+PnZKNtemIyI2+9YpevhpWEn8t9OOnBc4E38tt0Wux6nEC84dNF3C9fHUCqeU0DgzQ0gAMPx6HGgb+orYeabibN8u+Ho7q2irvSbBtOGN4X64GnKYlIEbrigq7ymNNvAxQ28twU94y923FoCCX.n6yG6aCaj8sgMRl24TXs+immb111Hk10NN9d+Qz84iC7EeIssW8h3Rr9M5tUVnOaVfA3.exmvJlzjp2GeHMud1RzAZdL8zC+d8hrhB1hOd7ToEC6tjYlzigOLN3V2JFZZX2oyJbb1c9qilbOF1PIsN2YV6HLW6jxYqaiqXNOJia1yhdO1w..w4zYU9MBUJUnuuUuJPRhO3O7GOqTfAHm0sNRsR8UotPHIx597WlmdnFv8c76opupVe6RWJ+35VGO8OePF7sealWPXQsriq7GSlSdxr8k7Qlq9Y.e9q7Jn4yKIkd5bvsrUNm92+f9aTW3j6aenZyl42yJqyn75rYBolqOQVYQxssM3r0slyoe8ib+orQ2ueZau5Eo28tSGGz.4k73hNMjASbNMahUHDbx8sORqycFaNbP66e+33+vOVVd1yQNBNvW+qNd9ENwafteYWFe7S9TXwlMNdVYQI+xuTEaITozlnW3zlNK72OspsyXMEHjpIukE89j4jmLOUNYiglFu6ueZ.vU+j+M7TPA7529cvNW0p3Ost+C.bfu7qXKK58QwhEtvabh774dR74xEu9sba.PRsoMDmSy6gWJ4rksvs7JuL+etJF+d7vqbsSndWnB18fK8dzu7Uc0j2gidKodQCjdxf32DG1lcNkEqjleeM3FTWujKlCsiuCOE9qNPPo1R67V0H.Rks0ZpSVc+xuLtt+9yUAgtlx6ylIgM8STxf5DPL3rPsuMrwJHv0EpsdQWcOdUicBtHGviM0iAbqU8.1BgfszogLDV5LlYM1K58t9OmkNiYRmyLyvnUFaSPumrMgA1E5ThhJNz0hZAVEcg.WJpDmPuZ8RkR8YaMfs8gKNjx28r1OC.7CUq+a2XBUjjpRsjjz7iWIYJTUkewhsn1TMJDP7BcbnoQRUyqrS7F5jntF4oZsNamRBHQcMrGAVvshIHf1pJkfCDEWwAbvpPPq76EaBC7JIG8bZ..aF5jjlerVM01RRyOBLm245pSCfPPBAx+FUjn4fNUp1pJOhwi1pWBR9pXOosJDQkdWWWQFHUM+X13ayfManLhwC.kpsx1dfYhbRohvZccJ2alXNhyN3LEr86dP.nTsUVxd7X+CVCVF6DPxQCk6d2LgajhOATG8US7Kb0HkTJlaKf1JMuM8SMWAtQN++gchCV+wZw.......IUjSD4pPfIH" ],
									"embed" : 1,
									"id" : "obj-8",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 425.5, 331.0, 121.0, 110.0 ]
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-43",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 110.0, 70.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-44",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 135.0, 71.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-42",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 47.0, 43.0, 134.0, 33.0 ],
									"style" : "",
									"text" : "Select port used for serial communication"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-40",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 107.0, 117.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-41",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 131.0, 96.0, 24.0, 24.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-39",
									"linecount" : 6,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 13.0, 104.0, 116.0, 87.0 ],
									"style" : "",
									"text" : "To read incoming data activate the listen button and adjust the refreshrate according to need"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-37",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 387.0, 387.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-38",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 419.0, 376.0, 20.0, 20.0 ],
									"style" : ""
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
									"patching_rect" : [ 508.0, 408.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-36",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 544.0, 388.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-33",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 475.0, 335.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-34",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 489.0, 299.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-31",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 430.0, 330.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 403.0, 272.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-29",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 423.0, 450.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 428.0, 419.0, 20.0, 20.0 ],
									"style" : ""
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
									"patching_rect" : [ 532.0, 452.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 461.0, 387.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-24",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 393.0, 257.0, 339.0, 33.0 ],
									"style" : "",
									"text" : "The adress of the incoming serial data (needs to be formatted according to the arduino templates"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-23",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 491.0, 298.0, 281.0, 20.0 ],
									"style" : "",
									"text" : "The value coming from the microcontroller"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-22",
									"linecount" : 11,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 536.0, 451.0, 324.0, 154.0 ],
									"style" : "",
									"text" : "Sensors often don´t respond in the full range of their output. Use the tuner slider to adjust the range.\nClick and drag vertically to adjust the range.\nshift+click above the current max to change the max value but keep the min value\nshift+click below the current min to change the min value but keep the max value.\noption+click and drag vertically inside the current range to change the size of the range.\nctrl(win)/cmd(apple) click and drag vertically to move the current range."
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-19",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 145.0, 376.0, 281.0, 47.0 ],
									"style" : "",
									"text" : "smooth: Sensors can often give jumpy outputs. The smooth slider gives you the option of less abrupt changes"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-18",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 238.0, 451.0, 281.0, 20.0 ],
									"style" : "",
									"text" : "the values being sent to VPT from the input module"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-17",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 549.0, 396.0, 299.0, 20.0 ],
									"style" : "",
									"text" : "button or toggle mode"
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
									"patching_rect" : [ 549.0, 374.0, 299.0, 20.0 ],
									"style" : "",
									"text" : "adjust threshold if used as trigger"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-11",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 549.0, 352.0, 299.0, 20.0 ],
									"style" : "",
									"text" : "use analog input as continuous controller or trigger?"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-9",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 549.0, 329.0, 124.0, 20.0 ],
									"style" : "",
									"text" : "analog or digital input"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-5",
									"linecount" : 9,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 388.0, 70.0, 348.0, 127.0 ],
									"style" : "",
									"text" : "This module lets you communicate with a microcontroller using the usb/serialport.\nYou can both send and receive data.\nYou send data using the router.\nOutput and input is formatted with a adress and the data value,\nfor instance 1 255 or 2 1.\nLook at the arduino templates available for how to set up the code on your controller.\n\n"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-21",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 551.0, 420.0, 281.0, 20.0 ],
									"style" : "",
									"text" : "VPT ctrl number which can be set from 1 to 50"
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
									"patching_rect" : [ 391.0, 7.0, 112.0, 22.0 ],
									"style" : "",
									"text" : "serial"
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
									"patching_rect" : [ 747.0, 40.0, 47.0, 18.0 ],
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
									"patching_rect" : [ 557.0, 30.0, 148.0, 18.0 ],
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
									"patching_rect" : [ 547.0, 7.0, 243.0, 18.0 ],
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
									"patching_rect" : [ 531.0, 53.0, 69.0, 20.0 ],
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
									"data" : [ 22289, "", "IBkSG0fBZn....PCIgDQRA...DO..DvGHX.....jxCxS....DLmPIQEBHf.B7g.YHB..f.PRDEDU3wI6cdGdUTr9G+yt6oj9IcRiVnmPGoiTTT.QT.KXWAuXAreupWrfb+4090qkq8tnH1onfJfnRu2qg.ARuQpmb5mc+8GmjPBmzqmD1OOO7PN6N6ruy7ce2c1Ym4cDdiseJETQEUZyhXqsAnhJpz3P0IVEUZiipSrJpzFGUmXUToMNsKch2xxVJolvQZwNeEmWtHKK2hc9ZuS9YlFq6ye2ls7O2zRl0ujOpQmOEla1MAVSim1kNwGXCqkrOyoZQNWxxx7bW+Dwoc6sHmuKDnnylK6X0+XyV9WXNYwt+sUznxi+3q9X9qu4yZZLnFIZZsMfZCKkTLYmbRzo9ze.vrwhHmTNMcpO8GEEER9HGfrSNIhc.CgPhpim6.UTHgcsEra0B8ZXiAMZ04VdmdhGi.CORx7TIfMqVo6CdXkmNEEEN8A2CFyOOhpG8t771RIF4romJRZzPQmMaz6ieXt3h3j6amU53UowSAYmIIcv8PG6U7DZLct7sWzYygSt2cffnH8XHiDeMDXMdcB35lsmbu6..DDDpxy24qs8XHir7qCxMsjI7NEKcouCjRJr.RKgifrrSxN4jH7N0U.3T6eWTRA4ST8nODRTwzbV0TIjlxbevE0hc1Z.j7QOHeyK7DLlq4Vb86ib.9tW5oYzy7l46d4ExdV6OgNu8lU9VuDhhRz43G.652VA66O9UJof7H4ireVym8tbQS9pPqN8UJu+pm8wYCe6mQIEU.oehixu9QuICYRSCAfO7QuKN5V+Kra0Bq7sdI7KnPH5dzaRMgivhe5Gfcu1ehj12NK+hCAfdM7w314Pk5OElSVrkksTN9N1HJJJrp28+fV8dQm5S+Xm+xx4KelGAMZ0RRGbOrx25kXnSYFj0oOY0dchSG14st2ahjO5AH+LSiM8CeIRZzvnmwMUoy64qs8e7Sh27dlEYelShkRJge6SdKLUX9DTDQwl+wuhhyKWBpCQRT8nO74O0Cv9+y0fC61XUu6+ACgGIQz0t2hTe4w+j3Zh8ttUw8+teEQ08dyPt7qhzNw4dO39N5IvLd3mF.9rm5AXy+3WwDus6ws7nWCeLL8G3I.fEuvGhM88KA+BNDLUX97Pe32injDi7pmE+24LS52XmH.jWloyytpsguFBDYmNYMexawrVvyiV8pNvMU3vtM9auxGfgPCmwLyalW6NmIC+JuVxLoDX1O+aQG6S+.fWetWGm9P6E+BL3pMu165VMhRRbOu9mB.qeIeT01b5Jpsod7CSuF1X3ptuGG.56EOQV4+6EXp2yem3u3KEmNbvvl50v9V+uPtolLOxm7iHJIwnmwMwabWWO8arWJRZz1DWy3NsochG2rtc9uyYFzsANL54vFMCepWS46qOiZ7k+2cafCiStucTk4QuF1XJ+u69fFNGeGah.BqCz6gOVDkj.fn5duw+fCgbRNI.HjHiFeMDXyPIRkxHpt2aLDZ3.PG5R2PRqNNaZovkeGymculehcr5ejbR4zjdhGGYmNqw7Jkid.hc.WT4+tWCaLUqSbE01X5U73zoSV068pTP1YRxG4.PUzT7TO1gnjByiO4eNux2lkRJl7ROUBqzlZ2bhGeGaIHHfREFXnxNbT9eO4+1CxS+C+IC5xtRRXmagWatW24RWEDVmNrglp6NhUHycX2FZzoCQQQb5rxcTkC61QnTmZAQoFSQRk5.JxU1wzoC6HoUKu88cqj3d1F8YDikq8Q+WzoRehbMcchnFs3nRc7X0ORiqn1djM+G7wO1cSfgGAi7pmEy3gepp4XDoy8cPL449fk+u+9msBBrCQUOJwMb73ch8xW+nvbxBaVr..Gcaa..rYwB+qoewnnnvHl10wr9mOGEjU5k67df+72.bI96e8+J83hFYUl+662WcooyA6+O9U54PGMcafCkC9WqCqlJA.Nwt1JxNcRDcoatc7BhhHHHfC6VaZK3WfSZm3njaZIC.Gcq+Ed6W.3evgRxGY+Ls4+XD2nm.581GR6DGAYGNp1qS.WO48va52wpYS.v9+ieqNYCmXOam9Lhwxnm4MSrC3hHw8rcjc55lCBBh3zlKMO1ANTNyg1KgDULDSOiCAAA93Gy8Wcq4BO9lSGQr8jt1+AyKbCWF9XHHhp68F.z4kWL1YMad0YOcBuSck7yLct56eAk2D3bSMYd0YOcrThQ51.GJCqBM0thjdhGi+6blIVJoXhoWwyEM4oijFMjvt1Ju3MMEBNxnIuLRkaYQuJZphNsRPPfNEW+4Ym4D3A+vuiNz4Xa9pLt.h.COR9zm39vKe7k7xHMtim+sPu29vvl50v6b+2Fg24XwZIkPL8JdxKyzXPW1UVkWm.PuG9XnmCcz7R2zTHfv5.58x65jMLjKeZ7dOzr48e36D6VsP3cNVJ9r4fSG1oS8oe7YO48gMKVXVK34XfWxUvKeKSkfiLFx5zmjo+fOYKVejHzVYVLUP1YfnjVBHjPqz1MUTgX1Xw3s+AfO9GPk1WQmMG.HfPBqJyy2+guSF5TlNceHiDEE4xeGrxnjByGKkTBFBMrpzAtLjc5DKlJAu7w2xuIhJMdra0JEc1bHfPBqRNDElSVHK6jfphlqVcWm.t99yxNcPfgGQc1FrYwLEm2YwWCFvKe8uR6qrmrq2ae.N20h9EXPn2GeqymiFKd7OItLBL7Hqxs6S.Fvm.LTk6q5bdcOctK3.3qgfvWCAUqGunjja2.QkFOZ0quJ+dqFBqCU6wTcWm.UuNWSnyKuq1u4aYNukQMcsXyIsYbhaNXB2zbHjn6TqsYnhJMJpSNwVJwHElS1XwXwM21SKJ581OLlWdXLu7ZsMk1FHHfO9G.9FTP3i+McOwo850WUhlo5NnN3DWXNYwYSMULVPtXoDSU5SxnxEd3ke9geAFBg1oNUmeckZhKjt9pottqLpQmXyFMxYSKExKyzwa+7mv5TXHp9MRufEYmNwTQExYSOE.PqNuva+8uVNppmKjt9pottqhTiNwEka1XL+7va+C.+Br16fGUZeinjD9Ejqg2nwBxEi4Ebi5BwKjt9pottqR4cMsSqlJAalJAu8qo4johmMYmzwI6ScrZMc9DfArZxDVJwXi570d55qV55tJRM5DqHKirrBRZZ3chcBadcHKWyis0FBEjQJjchGsQmlLOwQHiicfpc+VMUBIefcVosYt3B4DadcjYBG1szmxg1EIts+.aVL619ra0RkNWmM0jH6jNNNrYkD1zZwhwhpT5yK0jH0CuGjc5fD1zZqR6LyDNLmZGarFKi0ErXrH12O80rue9avbwEVioUTRBEYkpLPHX0TIjvN1B6Z0Kmcs5kyo12tvl0pdzrUUWeY2pYNy91FmYeaCmUXnSBfMSkvI175H0CsaTNu2cN0Cs6prduj7xkD1zZImSehZrL0XnoptqgRy9vtLgMs1ZZnp1fwRwEgw7xsFSS9YjBYdxp2IVQVlCutUxAVyxvgcaUYZNzZWNobfcU9uy9jGis+MeDJ.mYeaiD255A.YmNXie9+iBRKErayJa4KemJcAkSGNXeq5aH8ievyYeodFxIoSfFc5wpoR3.qYYkuOyEWH6dEeE9GZDnnnPBadcbne+mpzEuJJJbn0sBN0tZbNwxxNYOqXIXyrIrY1D6ckeU4Cuv5CEjUFr0ksTLlxIIZ+8hn82KJ7TGis9CeE4kdp05w6vlU15W89jWJIg0RLxV9x2FSE55KGXL2rY6e6Gg2FBhylbRrsuwUj4nr587SK4yUuW5fvH0Csa1yJWBHHPBaZcj7A2U0dtanzTU20Xnd4DayhYJLqzK+2VLVDFqPHJonryfbSNwprPjWpI41SZLWbgjaxIV9XTtLjc5fbSNwxEPv0c3Mla1Xpvyhwbyl.ipizgt2mJYa4lbhjWpIUmKO4b5DvK+MPPQ2YR6v60s8m5Q1KEjQku363aZszmwcEzyQOQFxUeybpcsYrYwLYchifjVczuIMC5yXmLgEauH48sM.nfLSis9UuKVJtH2NGkQbWxTwTd4RJGZ2HK6j8txuhtMrwggJLpj7xu.HuzNc4+N+zNcSxjw33abMjWpmKeyK0Syw13ZqW4gMqVYeqcUz8nijKeLif90ytQ+5Y23xF8vIttDCGb8+la574S5Gc+n0aeYfScVzyQOQ55PuXRnT63fqc4D6vFGwz2gP+mx0fFc5vbQ46pdWi1yUu2sdWd89w1vuQ+l705Rql9Myw9yeoIuUgME0cMVpWsStnrSiD13ZYT278B.YcxiR9okLC7JtNNvu9CX0jQ7x2.XOq7qYT23cgeg3ZXLt0k9ADTLcgzNztoGi9RoKCZjj5g2CmbGafNzsdyd+ouk3lvUPzwMPJLqzY6e6GQT8o+TPFoSPwzYheBSkBRKYN9l9Mb3vAd6uAhnmwSw4jI8eRyjSsyMQR6dyDUbCfbN4wv+PifAMsanVKOmY+6fniaf3aPgvw9qegNOvgW99rXrHRbKqm3mvT4j6z0S5jkcRQYmAgT53iViduv2fBkhxJMxKiTHzNetIHQHQ2ENyA1AceDS..5yDlJlKtPx5DUcr+RRiVFzztQ15W8djaRIfF8dQrCcLUJMQ2mARlG+fDRLtldaocj8SL8cvjx40b+5K8YbSg9Ltoznxiybv8R.dqmA1md5d92stPJYjIod7iP2FzPq17vhwhHfviDAQWOawuPBmi8W+JxNcPAYjBC4puYN41+Kzn2KF7UcSHoQKIs6sV458n5LmY+amX5WQ3vpEBLhnAbcCPIMZwTd4hegV8i3q5KME0cMVZRZNshhBobvcy.l70R+lzLXPS85qz6FzmwOEha7Sgwb62OGeiqAmNrSx6emzqQeYz6wNYF4r9a3nzYDxA+skw.uxYQem3zYL257HqDOZ4Oc0hwhX7y4gYj2vbqz4N2TNIi9VtW5yXmLi7ltGR6n6ys2Y57wloRH2jRfH6c+IjN2MLUTATPFoT9926O8MD+kNMz3sWkuMY61QQQtRiiZM5zgcylvgYynQ641tjd8Xqzm7DXDQSHcr1mXDF5PTzwANbR+XGj9OY2mvFQ1m9Slmv0qGHK6jrO0wI7t0a2RWqAElSVzwHq9wjbGiLBxOizpw7v2fCirO0wJ+ZgzO1AwgMa3vpU.E12u7c3zgcxKkSwN+gOGYmNvgESnQ24zHI85wlYS3vpEjpv1APqWdgUKlZ3EROTZRF1kBBBDcbCj091OGAEUmHl9NXhN9AA.RZ0RvwzE.va+MfNe7EimMGhNtAvtWwRvPGhjP5ROnqCdTX2pEJHijIwsrdRbK+A.3vhIJL6LvG+Ch.BKR2lfABBBzuIdUj791N4mQJ3zlMPQAEky0wAEkSlbn0rb.PqO9vPmwsQpGZOnQuObl8rE.PuO9QR6dKLnqbVb58rU7KjvHrt1SxM4DO2ISTzsAifhhBHHffjHHnTwcTuapqEiEQ5GYeXHhX3T6ZyD23q7c306ie3igfofLRA6VLSHcJVjj7LF4rNc3nZicU.HIJhyZYx6GceF.Ykvg4WesEB.creCEQIQTTjwoc6zsgOtxaExe7Q+GxqrWmnJp2EkD476LFEYYDD73m8s0aZTWAnTAQYfS85ItKcZj4wOHIefcQAYjB8exWiaOQT1gSPPfNOvQPm5+vHyDNDYjvgXqe8GvXts6GDDXD2vbQ77t3LqSbzxalUEwoCGr4u78H1gNZ51vGKAEUm4Wd0JO4s8If.omWrqPqinjqfCPxGXGz8QNd7uzYtj+gEA64m9Zh+RmF4m1YvbQEvVVx6gcaVvTA4wtWwRXHW8MWdmPU1rTwt4RPuetlgKk0gJ.X0bI3U836.J6zA6YEKgniaPzsgON1vm7ZDVm6Fg00J27znha.j9wNH1LYjX56fqy4eyMFBMLxLmLn2w14pb+Yd17Hffq8Qozfu5ahAe0th8U4kZRTR94hVu7AAQI7qBGuuAGFVMZD895WUVuq0aewgUytbbK85FqlJAuaGNQUpWNwZz4MlJr.bX0BBRRjyoOAZ8xGLWbArgO4MXBy8ePmFvvPRqNN8d1JfqHrPlG+PDQu5K4kZR3zgc7Ojv32euWh9OkqgH6c+InX5B+969hHIoACcHZR4f6hNOvQfMKlYSK9sneSZFUqMURd4frCaD6PGK.m6SJUg6cnQuWDZmNWPKK+zSF6VLSmG3vqzHDJncsIR8f6rRuOctImHGeCqkgb02L.DQO6Koc38RrCcLTX1YfYiESPQFCRZ0x9V02P2F93PRiVR+XGfH5Q70451x5LjdO1KGQIMLfq3ZYu+7WyXm8Cg1JL+WirW8iM9YuIZzpkALkqkhyMq574n5X6e6GSNIkPk1VXcsmL7q+Nqy4QL8turiDNFIkRZz0NFck12ISIUROqbXDiZh0XdjaxIxQ98elwba2GhRZHws+WDdr8BQIIBu68lLOwgoyCX3Xt3BovLRi9doWI9EZGX+UQ8tV8dSPQ2ExLgCQj8t+j6YRD893KdGPS6fJoontqwR8xI1PGhhP5XW4We8mAAIMzkAORz6ie3s+AROF4kvZemmm.BqCHKKy.lhqPkSncoGj7g2MmbmaDyEU.i5FuKDkzP+mx0vdV9Rv2fBFqlLQ+l7LQTRh9MoYx195OfSumshoBNKcdPihv5b2IuzNC9G945oVu8y.JNbhegDFADdTr9O3UPqduHjNEKcnmwiMykTdZNeJLyToaCertMD+hcnikrOuOIkV89P.UX5sE+DmFa6q+PR6H6AyEUHC4puIDDEwP3QRmG3v4O9f+CRZ0QvwzE5T+tnJkWd4q+3eE5TEuCHPznSGFOaNTXFoxfu5at7VfDdr8lNOnQRx6a6z8QdIDbLcEPAcd4MQzi9f2ADHBhhnUudBN5tTejQ2XfW4MvF9z2.qFc0OF58y.C5Jq8NFrh3WPASeF83Xaa324zomEgFjqA4+YyuPxHmyR+lvkgeAUyNPg1otiegDNq6cddTjUHxdFOcejt5XvALoqgc78eFIt0+DEYYh6RlJ9XHD.nSUS89.thqis90eHmZWaFSEb1lEGqlh5tFK0XPA3LGZ+jURmjNzU2CKMpz9hylZRrsk9A.vHuw6pzaZT8T10EctuCnRa2X94SpG6PXL+yB.d4m+zo36GADR3tkGsWt9poptqgRM+jXAAPPnRuWgJsOIjX5J8ZLWNJnTqWDpHKW90FmO9ETPz6Qdw0sSZ6jquZpp6ZnTiNw581az4kWX0TI3U6fw2pJ0Lk0z0ZCKkTB57xazo2qZOw0.smt9pkttqhTi29y2.CF+BJXJJubwbwEWqe6UUZ+iohJDi4eV7O3fw+FP3tohbg10WMk0cUjZ7Iw9GbHkGLvLle9TjGxp.mJsdnyaeHvNDAADVGJep00P4BsquZJq6pH0ZuSGZzcD8d6C9FXdU56woxElnQuWXHzvq0dZttxERWe0TW2Ud9VWRj+AGB9GbHMomXUToLTu9pwQa2tDTEUTAP0IVEUZyipSrJpzFmZ8chMarHxKizwTQEzRXO0HBhh3qg.IfPBqNsxLnhJWHPM5DmeloQRGburkksTN0A1ENsaulRdKB8ZXiggOsqitMvKpFWxNTQkKTnZaNsohKhSen8wO7eVDmX2a0ivAFfiuiMw27BOImbe6BSEUyAkLUT4BApVm37yLc17xVJFKvyaINwpIirkkuTJLmLasMEUToUmp0I1RIEyYphfGmmBm4P6Cy0PfmSEUtPgp0IV1oSrY18XmrmB1sZoVC2KWnxVWw2PJG6P0XZNa5ovu+Euuaaufryf07YuSykoQgMACsxit0+hO4edurtE+dM57J+rRm09YuaiNeJNubaRikz0GZTehIsZ0xhW7hAf24cdGBN3pd7fFUTQwHG4HaLmplE7SWkCJ.ZDEH.8t2We9qSCZEa5l5XM2XyrIb5nl6CiByIK10utb21trS4lzUmfJxe7UeL+027YM574qe9mfXG3PI9wbIM57pnylK6X0+PiJOjkk44t9I1p0uQMpXrknnHCe3tByqezG8QXzXUK9W0UcUXvfA15V2Zi4z0jROCwW5Sn9yJNtq2qtiA3MCOlfn.y1vWcZXkkt8qrmc.S1cRn9nismZ9b5Ba9acRIEV.mX2aC893C8XHi.MZ0U99N092EkTP9DUO5S4K90om3wvPXcfjNvdHldEO8bniB+Bx0vXTVVlSev8PtokLg2oXoK8cf0341WCAx.F+jJOeCJhnH6jOMElSlz8AOB7w+.vRIFI2zRl.BILR9HGfNz4XIrN4ZdzZojhI6jShN0m9C35STlSJmlPhpSjVBGwUT5L4jH7Nct4cqkRLxYSOUjznghNa1zigLRDDDpxx5oOzdojBymfiHZz6sOj1INVc53ps5UiEjGIs+cSPQDEwzq3qx50.COBJ5r4vI26NPPTjdLjQhuFBjTO9gvbwEwI22No6CdXnQqtxyOsd4M87hFoaA3wlRZxBUhuy67NL8oOcFzfFDKZQKBGNbv11113odpmhG9geXznQC6bm6jjSNY91u8aQQQgcricv7m+7YDiXDrnEsH72e+If.BfO7C+Pd8W+0apLM2XLcLXhI.uvhiy07mQ2ofYkGOSLY2ISnKgPrA4KJnfQaN3ON8YwWsRbU8JBNcg0bXWswR1ImDu88cqLnKcJXrf746ekmgGcw+D58wW97m5AnfbxhN169xxd8+MW08u.F3kLYV4a8RTTtYiFc5YPSbpbhcuUFxkOM56XuLdy6dVDRTwP.g1AV068eYXWwLXp2yeu5O+m4T7EOyCyS88qme5seELUTADTjQicqV36ekmgGeI+B4lVx7oKXdDPHgQuGw3XEu4yykbK2Ei7pmEom3w46d4mlGeI+B.jdhGme3+rHtkE8pjdhGCEEW2TohNwYlTh7kK5QPAvG+7m66c+ZV5+9wpxx5998UirSmrm0sJrXxDq4S9e0oiq5pWAvX94wG7H2IcpO8mCu40ynmwMwDu860s5U+BJD9kO30HtQMdJL2r46d4ExiujUyQ1xeB.65WVFcN99SJG6P7oK39H9wbITRAmke8ieSl2atXz4US2bHthzjGuSerG6w3dtm6g8t28xcdm2IRRR7Zu1qgACFX8qe8ricrC9G+i+Aqe8qmm+4edl+7mO6d26lXiMV5Uu5Ed6s2b7ie7lUm3SWnINTNEy36rqmVIIHfdIQLY206XmdwVoC9oGPgLJ1ULPtD6NQqjHRBB3rYbdudrssA5bb8mq9AdBDDDXKKaoX1XQbrsuQxM0j4Q9jeDQIIF8LtIdi655oei8RAfdNrQyzefm..Nwtc0hmbRNI50vFCW0883.Peu3IxJ+euPM5De9D6.GJW88+OAfWc1SmSt2sigvijRJHe96e5xw+fCkKZxWM+2YOcF5Tld0lOQ08dS7W7khSGNXXS08XpcdYlNO6p1F9ZHP125+kpsrN8G7IYyKaoLyG9oIuLRqNebUW8J3Z8e5tesOAeMDD8crSjU7lOOS71uW2pW+o24kY1O+aQG6S+.fWetWGm9P6kK+NlO+xG75LqE77nUud95m+I3ZezEQ+G2kC.e1Sd+rou+K3Rtk45V4toflbm3Eu3EypW8pYe6aerrksLJojyszc3u+9y.Fv.XgKbgrvEtPLXv.IlXhr6cua10t1ENc5DiFMhCGMuqkMoVjEBzKsk+aMhB3P9bNlNjUJ8cfEvdE1tSYEzJIfSGMeNw8arSj+boeB+eyXbzmQNN52XmHA0gnXy+vRnjByiO4eNuxSqkRJt703nN1695VdESuhGmNcxpduWkBxNSR9HGndGVXhtGmaoxw+fBAG1bslUEU26M9GrqI1d3cpqn0KuImTOS8t7VFgDYz3qg.AfTO1gp1xZXcpqMniq5pWK5r4RfgGY4i.P+BL3Js.vUw50K+NlO6dM+D6X0+H4jxoI8DONxmWmq5vtMxJoSvl+wuhc7ytdW6bR8LsMZNcYb7iebhLxHI93im2+8eexLyy8sbsa2Nomd5L9wOd.vfACDczQSfAFXqVO6AtbZ0TgNtRiXYNuUd6RhBX2YyazmHnHhlm56WOmbe6jD14lYwK7gYlOxBQPTjN22AwDus6o7zN449fDXoqUSU0hy8Q17evW+BOASZN2G8YjiigLoqhk85OW8xdDOuXekRowB3yOJb3vlMznUGBBBUJ95KWGugbECz90VYsgbbZ0quJqWCuyw5d78pBEfJVu9122sRnwzItnIc0LtaX170O2Bb2dJ8ljS71tmJEiq81ulu3ccS9DfXgKbg7vO7CS3gGNRRRjRJofQiFYRSZRzqd0K1yd1CKbgKjILgIvO7C+P4Nzsl3TQA6NkwGstDrn7WOYYzBYYzFQ4uqklEe0JgcmxMqMkFfe+KdeVwa97zigLBl5872ouichjW5oPrCbnblCsWBIpXHldFGBBB7wO18Ti40I1y1oOiXrL5YdyD6.tHRbOauIaE6KsSbDxIkSC.Ga6aBu8yeBI5NgW95GElSVXyhE.3naaCkeLBBh3zVUuLmVQZHk0Z63pt505J1rXljOx9YZy+wHtQOgR6TsifrCGHHJhff.NraEIMZoywOPR6DGgX5YbDSOiie+K9.N3FVSc9bUeoQ8jXa1rwsdq2J.Lu4MOxKu7XVyZVb228cy3F233dtm6g8u+8ygNzgH0TSkbyMWtsa61XJSYJLtwMNd+2+8469tui.BH.d1m8YKOem0rlUiqT0.XiImGSqmcfBs5.chBbp7MgBP7g4OSpagQPdokMmRy+nWanWwL4suuakWc1SGQQIjc5foMuGi.BITF3kbE7x2xTI3HigrN8IY5O3ShV85q17ZHW9z38dnYy6+v2I1sZgv6brT7YyoV+7S0E7xW+YwK7gPm29PtolL25hdUDEEIhX6Ics+ClW3FtL7wPPDU2O2ZEUm5S+3ydx6CaVrvrVP02hf9LhwVuKq01wUc0q4WgU4yZBcd4MCapWCuy8eaDdmiEqkTBwzq3IuLSCAAA5DZtAnP...H.jDQAQUb8mmclSfG7C+Ntwm5k3C+Gyk886+BVJwH9ZHPF1Tu15VEaCfpMtSehcuMdq4cSMam3lBtu24qnGCYDMY4mNIAzJJRI1q7643uNIL6PtRu2byIxxxTX1YfhBDTDQUo03HSEUHlMVL9EXPkuTxTSXyhYJNuyhuFbsTyzTvYNxA3KWzivi+kqhByMG7O3PcqmWKH6LPTRKAbdADtxhoV581mZ87TeKq01wUS0q0UJLmrPV1IAcdMsW1oSrXpD7xGeQTRBYYYJHqLPTRrYeh5TsOIVPTDIMZba0Z2SAIsZaxiUw1bpfspXTfUrsV1QFlnnHAEQzU497I.C3S.Fpy4kNu7tReqzlRznSe0l2U2Et0Em2xn9VVqsiqlpWqqXHrpdYQUTRBepv6.KJJRvQ13NW0UpVu.u7w2J0THOMhpa8F8UXMJRkVNBM5Nxzl2i1ZaFpTJUqSr+gDFi3plERUXTs3ofNu7lQMiaDCgW8qGtpz7guFBh9W5n5RkVepVmXCgFN83hFIy7QVHcr28qkzlpQ5Tb8mY7POIwNfKh.Bo1WpLUQk16Ti8NcG5br3ku9Qmiq+MaCJ95K571GBpCQ4VGlnhJWnRs9IlLDZ3XHT2WQ6TQEU7LPMZWphJswQ0IVEUZiipSrJpzFGUmXUToMNUcGaYyJ19pOFGeymhRdmsE1jTowhBfPngitq8VQyseuUdjsopssoopzV2G6zNri44dc37jIffUKsNVpJMZT.PuWnI1dfWe5xcMOhU011Eb9ZqaMm11W9Qphb6.D.DrZAmIkH19j2BPUaauv4qst8j3RtxQAmWPY2pfHEoQCVqhIddqFJJ3srL9H6.uaECn.UEsH0W0wxuBfXHggOqd6pZaS.dhZqauSrRtYA3xaGfhjzPdZzhIIIrJHctczZiBnWwI93ThPbXG+ahlr6MVZwpupikeA.k7c8tupZaiCOUs0MmXgJD4JrHHR9RZnPIs3khSBwgUDa.yAylCjUTvrjDEH4JVYoUVFuTZcuqcKY8U8p7W5cyU01FNdxZaM9IlJViFJQiF7RwI9JK6wHx.HJHfuxx3shSLIIgQol7vEV8lVx5qFa4WUaqe3Iqs0nSrMAQrIHgWsBKWJ84xlHwc4WVslNuc5DaBRXsIN.AzPn0n9pgV9U015GdxZaMtWEAATDbEWlOehcTijKZVWeiyJqFBLpn3N9zOga+S9XBL5ZN5HHVpMpbd1nLP9.U7sILed+qodQ2nlpuZtn5J+0FpZa8COYssAcKtn6W+3t9lulf6XGaPFWMgfnHy4KVL9EZn3WngxbV7miP8Ll8ZF3cAVOvmAbT.m.eYE92a.z7E+Aa6hp111i5sS7vu0ag6e0+LEmcie0sqpXZ+qEQ2F8nJ+2cazihq5esn5Udrcf9.bM.2JvuAHAL2R+20A3KvDaRr3ZmdeoWBS9weLhpumKPjGZW6BFhLRLDYjL3q8ZHvnpbfWqC8rmLg4OeF3UcU06Kzannps0e7Dz15sSrcKV3EG9HIwMtoF8IupXkO8BY9d4Sk92JdpmtdkGk.T15ynd.qktsx3mAtzR2WyIR5zwC7KqlQda2FRZ0xb9xEyTe5mB.F8cdmbGe5mve6qVBcaTihEc3CRGGzf.fwcu2C+sktD7In.YHW+0wSt6c1jGT.qJT015NdRZa8ta+1y288MpSXKA8BW2gNXfTnxuiTF.EBDWKfcz0gMTxMoj3ql27AfD2xVXluvyypd1+M.3zgCdiIOE.v6.Bf9MkISJ6aezuq3J3cl9LH+TbsDs7hobFBu6cmrRHglU6UUaq63Ioss98cey.cGWB6A.5JPn.kEWL2GvPagriD2zlwoc6L0m5IwmfCltMpQhj1ysFPk7d2a4+cAYjAR50CJJ7Q2zMykb+2GBhhzsQOZ7Nf.pzwcgLpZq6z5228MCjDtD5qDHZbUHKq4UIhq6l2RPutjIvc+ceKYbjixV9rOmu8Qp7pQnx4Mj5DDDPid87j6dWHnQCIrgMvaeUWMEmatsPVrmOpZq63w8j34shkS7S5xqz1N7usFdmqt5W1LOeBG3WAR.HafoVg8ULP8Obj2vnOSbhbfe5mYO+3OB3picDzTyU4Qz6di2FBvUyxTTH590OLDQDHVKGWaAT01lGs0i6JiOe1ygErisSPw35aHlepowmOm6rdkG9Bb2358iB.W8dYY7DMQ1Ycgc8MeK2+p9IBuG8.IsZofLyf.BKrZb4EM8CeXx7nGi+4V1DVJ1UDFM2SeZLDQDj592eKko2rfp117nstOKlFdrk+2op2axQqNBytsF7IngPribD7vq00W560t7Iwo1xVqwzWlMFiUysDlW0RqU8Uco7661Okp11HvSVaq4mDqn.JtVKZaHK9TMTN0V2Fq7YVDBBB0pHqTpMRy7RNZchVg5qFb4WUaqe3Aqs0nSrNEYzpHiUQoV7YQxZe0+acJcVEkPqhLZ8.D5Vi5qFZ4WUaqe3Iqs0XuS6iSm3mSGXTTBKBhts5v2ZiYAQLJJgeNcfed.y4zV55qFS4WUaqe3Iqs03Sh8S1I1JMCLJogh8v5gTsxxDnSWSZZeka4mMNmOsz0WMlxup1V+vSVaqUKIXG1QmrLdKKicOfoDVEQirrGiHWFsj0WM1xup1V+vSUaqS2NwOYm3mGTkomNskpuZKYqdB3IVe4Yc6WUTQk5MpNwpnRabTchUQk13TmdmX6HPQZzfYQoZbXkghBZUTvfC6s5QmPUpanpss8oVchcf.4nSOEK4RnUpkAqhNYYrHJRX1sgOxNQmACz0INQBo281sA5srSmj6gOLm4O9CrVPAUZelEE4zd4K4pUWMGigTTHL6VoKVLUsAZaK3JlL05Nv8paH.3Cf+k9+Mmnpssrzbos0pSbgZzPwRZvtf.AY2ZMFnvTTTvjjDEIo00cs8xW5+blCXHPLVEcIufjFBX.CjA1idv99fOnbw1hfH6yOCXTRC1EDqwKtDTbMxVxWiNFjwBbSrK.Wy1EOt.jd0QoAN7Bc5jNPy6rxQUaagoYRaqUmXKhRXQTh.saqVizeBkFubsJIgUAQ5v3m.XHPxHkTXuKa4XqjRpT506mezuodEzwXiktLwIxw+dWQVhj71WLJoAcJJzcSEiVp9QGiMDHMu7FSRRjjW9RblJt78YFHWfhznCeEEHXD7nhuxUExJJXDAJTPBbXCcbtI8dSMpZaKKMWZas1wVJBBHK.R0i5GIEEjEf.hsqXWTj8shU5lHCfUiF4fqZ0XSTjf6QOJe64oUK1EDoilMUihL.5PgnsXFaBhjmVcUZeE.XTRBeEEveAQOdQFbElRCPPDeEEvjjDE1LdtT01VVZtz1l0dmVid8n.Xs3hq1zX0nQTvUfGqLbVZyrzUKhbYnCETD.4ySHsBXSPBe73amk63GBXSPBO00uPUssgSSs11t9SLICsXA76HiKNz4quMY4WYANb09AtpooPaMDQDDTGiooynpizTqssqchaIYZ+qmgv5V2ZsMCUpB543GGS8odR21dGG3.o6iYLsBVTSKdVSckVQhr28lAMyYPQYmM63qVJ1LYhQOmYyI1vFYn2vr33+0eUd7XNzt1EFzLlANrZicrzkRI4kWkxqf6bmX32zMQ5G5vr+e5m..c93C8eZWI58yOx4jmjhyNGx3HGoktXdAIW7cMWBH7NvAW8uPjw0GxJgSPrCe3bxsrYLWbQ.PPcLFFvzlFYmXhDPDQvNW5WiS61oWSX7zoAOXN559cBNlX3.qZUnyWeYn2vrPqduXme8WSI4kG8XrWLNrZk9boWJ+06+ATxYOaKV4S8Iw.cbPChq+MdcRbyaF+CKLt8O6S.fQOmYyzVzyvY18d3FdiWmtewig.iNZtiO8SIsCcHrY1D2+p+4JkW8cxSl66m+IR6.Gjgcq2LSYA+S.XNK4KniCbfnUudtyu7KHx3aIhNxp.PlG63jeJoPgYjAi3VtEl3C9.HoUCwLfAPOFyXvmfBhGdsqEyEUDC4ZuVtt+yqfF85YB228wje7GmrS3DL6O6Sn+S6JQPRh68G9dBoycFG1rx87CeOZ8xK543FGWyq7xsHA4+yG0mDCTxYykO6NlMgzkNyY18t4htgYU999omYQj8IOIQEebDUbwQ1IbB9rYOa7InfwtEKtsDcL54dmr34723z6bmbfUsJ92mHA1029c3s+AvxVfqP4VHcoKsjEuK3IyicLjzngByHC.Xcu9avo24NYzyY1.vEc8WGa7C9.19WtD19WtD55HGA.Ll65uwKN7QhcylwgMqLnYLC51HGAZ81aN55VG.TTNYS7SZR.vd+geje+MdyV7xmpSLPncsqbiuyayAV4O4Jx7WgNKwbQtZtkrSmHHJhuAED20O7cbjeaMjShI5Vd4S.Fnj7NWSorZrXBL5nwTgmaTKc9M+VkVVLlaNU529ERHTXVYU9uMke9.f296O1M6ZrfUR9tzO+CKbP.54XGK.j9ANH4mZpDc+6GFaAaBcEQs4z.C6ltIV4S9zrrE7DjzN1Ah0PShFzLmAa5C9P9tG4uy9W4JcqGoyJgDJuyRBnCc.894OmdG6fH5Uuv2PBAfxuysJsLnnnfXMrvkkzN2IwOYWZRvcpiDUbtdUmTOvAoGi8hAf9NkIC.YchS.xJrpm64YU+6mCEEEjz05t5bn9jXf8srkyLekWhgcK2DYc7DH084JF.m7d1KNr4JDklWJofrM6jz12A2wm+ozmINQR8.Gfi96+NZ81aR+vGAakXjU8r+al0+6MX327MihrLevrtArawBKeAOIycoeE.XyjIvo5GOpkhT2ydYryctL3qYlj5AN.1M65KzVX5YfMyl4nqcczqwOddn07aT7YykRxKejc5ju4AePto29sYpO0SgwbxASET.oenCwQW2539W0Oi+gEJ4jTR7quzKSXcu6TTEdZdKIpNw.G5W+UNzu9qts8u9Advx+6878+P4+8+W+Ffao8mWz+p7+9CttYUo8IpQCC45tVd8K20c6m62rTxO8zZz1sJ0Mx9jmr75987C+X4auLMuaidTTX5Yvqe4SBsd4EO892G1MalK4AteV7eatTXFYvXu66B+JskTq5e+btcN19W7ks.kjpl10NwBPqRrU97Q1gCJLqL4994eB+CKTR3u1.IsssWiGSYwb31diGoVFZJ01rNdBLwG4gI9oLY7OrPY4OgqNf7z6bWbqe3GfV85wTQEx27.OTi2vooWaaW6DqGPqhLlQrYeZ8Ua7CO5iWuRuYbY65p0TdgIMkZqwbyk2+ZtN219NW5WyNW5W2Hyc2ooVaaW2wV9A3mSGTnrLlTT73hsxUGknnPgxx3mSGDPqsw3ghp1dNZW+j3.v0.kGG1vnjFxWTj533tuUEsxxXvoCBDWSfbUbGUs8bzt1IFfvvUSuJ1oCr5YEoQqVzgqILtpCbMip15h18Nw1Q.6ZzfhnD5ZCLmSKKVVo0gcPMVVUinpstncsSb8MFR4ov4GKqTwcT01yQ6Zm35SLjxSgyOVV4kMmsu68wFHpZ64ncsSbEigT6woC1YoKHVCURCCUSq6Pkq537ikU1EDQuZypci5S7AamNr6Qn8MWZa65ax2PhgTdJTVrrRtMns2Rfp1dNZW6DqhJWHfpSrJpzFGUmXUToMNpNwpnRabTchUQk13n5DqhJswQ0IVEUZiipSrJpzFGUmXUToMNsuchKMLnzVYBiWQTDbs971VXNx1pfp1VNsqG6zZUTbEBWjjn2nPTkFJZ82Cevx6.WyRGIEYzpNtoqRpn15ibMWG0aIIOFsu4PaaW6D6uS6XVTjhjzBZjv2Ru0mLtVea8TwgfH96zN9K6r8s.0HnhZqEIIDqkGqUVzAu0V6aNz110Wi3irLgX2F5TTvJfhPai2dPqhc72oSL3zdqsozrwO6eceYfsiUg+op1dN7ncharBM.9K6D+s4jBQfBvUjFzSBA.uwUfeymRapmNE414cVQSCpZqK7nchapn.frw0Dx1pfjmUvbVALq3DKNcRGTTvPqs8zBwsdcWecNs+429CU69T0VObm3lBg1LPt.EoQG9JJPvHfnGTGaIqnfQDnPAIvgMzgq6dqRsip15BOZm3lBJ.vnjD9JJf+dfu2jnf.Af.HJiIIIJzoSUm35HpZaommlg7ziBq.1DjvGOp1Y4N9g.1DjvRqsgzFBUs0Es6chkw0GW2SOPpIJHfhfK6Uk5FpZqKZwZNc2u3wTkaOwMtoVJSnZ4Zd4Wh08eeMJLyLq0zFTGig.BuCblcua55HFN4c5yTmNt1ynpsstzh4DW1Jq94imfPGS+6OZ81q5TZG70bMX2rYNyt2MW5C8f7au3K2lPnaNQUaacoceGaUW4Jdxmjn6WeovLyhO7FtQhnW8hIufGmObV2H.7+crixKNxQwEO24hrrSTjcR2G8nI329+waNkox.m9UyXu66BIsZYSezGyF+fOjq3IeBhrO8gf5XGw6.7mkL+6iSsks1JWRuvi16ZaKlSbBaXCsTmpFDIsicvh+aykI+3OFS5wdT1+JVoaowT94yF+vOD6lMyF+vOldcoWJ+1K9xDRm6LS39lOu9kMIbZ2Nya4KiT2+9A.yEVHe7sbqzmKahbIye9sKchU01VWssEyI1SnoU0D646c8cl22xWAW6q9epRgt5Hp9FOGYMqEyEVH.bve9mI1gOb.HoctS.H+jSAc9U2GAZskPUaac01188NccEsd458l7Nn.wlYStlhaUnWOkzU8qZ.NLaAeBLvx+s2AGL1r35CJnTKyvFUZ9o8t1p5DWJSdA+S5wXuXlxBV.6969dxO0ToSCbPLvq5p3JelEhW94G.XyjI56UbEDQu5E1KwDW7cMWRZm6jdLtwx.l1zH9IMIh+xuLN3OupV4RjJkQ6cssd0b5c5n1m4E8TTpM2sF99G8wvoCGLjqYlr7m7oH8CcH.3MlzjX327Myw+i+f8s7U..a8yWLYdrigoBJfebAOAQz6dQI4kG+uqXpz2oLE7wfA9eScZXJ+7YaewWfCq1.fylbxr7m3oZ0Ji0FpZaaWss94DW5hRUMQ3BhTViOjc5ZUeSid83vp0pL8R5z4JsNp87t4hzN3AAfU8uetJs8bS5ztsMGVsxI1vFK+2Emc1.P9ojJa7C9vJk17RNkx+a6lMS5G9vMo1cSIpZaaWssY89pEkZpnUQl3mzjPRq6u2gjNcD2kcYnUQlBOyYJe6BJJHn.1cV2V+Vs6zIBJtNtyGAnMQXbQozvMim8XO5bnps0cZt01Z+IwUHVFMToZO4AV5PLSPFRcCajnhMV5Reiin6WeqxzqUQFMlMSRqackuMCNriYQIVxxWAhNcPMMp5jATD0ROTTHvpnIg5K8bXFQ7oVs9VOLiK6TWK4IUUaaQn4VaqUkqhwxngVGFipN.JnzXHjszSiC9YeFc4RtDBL1XQnJN97RLQNy5WOlpvHioKVLQgZzBh5PVrt0heejsRWrThaa2O.+b5fBEDAQQ7FpR6n0jRTTnHYYL3zAAzBddU01leZIzVg2X6mpRsEojgGakRfIQQxVqdWwoJnVikQkECgBxgcBtNzYIUGEIogy3kOjuFsTi2tFHH61nyVLQ.Uy60kCP9.FkzfcQOudlQqrL94zAABDdyz4v2seJUssUfVBssVuUX8MVF0TECgBvoC5WIE0nxixHLb0zqhc5.q0sWEqEEc.F.7uE97ppsM+zRns0o1yTVrLxpPscuZO23CU.k9OUpLpZaaepWehI8pw.41snpsscwS7FqpnhJ0CTchUQk13TmaNscDnHMZvrnTs1ihMannf2xNI.GNPa07FbJ3p2OMJoAk5ocJpnfOk1wMdVenhlWT0111Tmbhcf.4pSOEIoAShsdw1WAEvKYmXUThvrYsJE6hjzPtZ0QwRZQodZmBJf+h1QDkp8SZzdCUsssO0Im3B0nghjzfMAAB1t0Vs.SlCEEJQiVJVRC503jPphuUYIRZvnjVBvgczUOW14rg.EoQKdKK2tSnqNT0119TmdmXKhRXVTB+c3nUMxBpQP.eKcX6YQTpJSirf.xBfNTHx3hiP6ZWp07MjtzYhJ93QGJthJgdXi5mlST0119TmbhUJcLyp47J+ccDCGCQDQ0db9GVXDYu6saauGi8hw2fCtNYfcnm8rR+VSo1Rc4chBticj696+NBJlnq1zDTLQy87CeOAESL0I6wSB+aBr4pSa04iOD6nFYiN+qOnpsmi5i11f6c5G7W+E9G+4ev+NwDnmiebts+IL+4yKlxY3o12d3Zd4WBv0La4I1414gVyuw+NwDH590OBL5n4ssXpR+65es+K58yOdp8rKV3A1GKXGaiv6d2q213g+seiu+e7nLuUr7pTrCJlnYdqX478O5iwg+seq9WIzJRb23MxU7QeTyV9OkmXALuk8iMa4eiEUs8bzfbh66jmL8b7iimIt3Y2e22yU+r+eUZ+AzgNvLeoWf2XxSgO9VtUtjG39wPjQxvu4ahv6QO3QiHJRZ66fotvmhhyIGd8KeR75W9j3ql27woc6r8ubILoG6QQidu3ABHPxNwDYteyRaHlJG+O9ypTrqnHe70+GMn7t0hK4UdEF1i7HHzLLVgMDYjbKu+6wk+O96M44cSMpZqKZPWEzkgOLxOszH2SkDmXiajNM3Aifz4dOlhxJKte+BfLNxQo6idzTXFYfoBJftNrgQ5G9vXpfBHwMtQ5xPGJNsYiSrgMxI1vFYz24bXMu5+kyr6cSPwDCYd7igSa13jaZyDU7wiW92vFApmuX2VVjA3j+xuvJu4atYIu8xO+PQVle4Eeolk7uoFUssAFsK06ue3vhqn4fcqVQTRB893CVJt3JkttO5QSum3kxo20tP1gC7Nf.pzw4c.maDu16K8RHrt0MVykMI.3L6Z2bkOySyTepmj9dESA.7Jf.b6bTWoLw99W0OCBB7MOzC2lTjA3Lqe8D740WAMUj0INAK4dmGSX9yuYI+aN3BcssA4D6zl8xilCZJMDrX2h6KWT6cYKiis90yKl7oYj29s4xgWqlxOtJdLid1yl878+.1LYB.9y28cwgMqXHhH3z6bWzoAO3p7bTeH6SbBznWuq+NgDZT4kJdVbgr11fZNcVIj.AFUjDPG5.cZPChbOUR3ztchJ93Ihd0K55vGFusESD6nFIdEfql.qnnP1m3DDV25F58yO53fGDYdziUddF2keYbxsdtfu8EMqqmdM9wype9W.s50SlIj.kb1y1fKnk0LqkLu4yRt24UscHhJUMkosdhbgt11fdR7NW5Wynm8r4ENSRH6vAe48NO.X5O+ygkBKjO41uCNvO+y72W+uC.mbyagctzuFIsZ4htgYw+M2rwlIS7I2xsA3pyT7J.WuCcYblctStk28c3sLYD6Vrv6NyqoAWHqp2Spr2i5ct5oS9olVCNuuPgx01a61asMkJgp1VGhrG.jpduIGs5HL61ZwLrxnGi8hIk8serTz4lD4kYKwX0rao+7s0ZpiN50DFOW6+4UpjXWS4caYppH6Az5psUEpZa8GO9YwzI1vFqjCb8gZqmJqtOQgJd9npsmi5lSboQEQmd.gFTmkZKTGrkXG0nXYK3Ipwdp73+wexxVvSP2F8naBsx1Pnpss4oN8Nw5UjwaEmThjF7yoCDakF+oNUTvjjF7RwY0FIJJKtF6.X2e62Umx2irl0B.1gpMFG2dEUsssOt6DKH31cBM3vNVEDoHMZ3rZ02pMc0TT.eTbheNbfgpIZK5irS72oCxWit5scJn.96zAdK6AFw0ZJPUaaWpst4DK3qenXrxCnBcJJDtcqnWQFqBhsdSbb.8xNwfC6nqZtipAG1QAWyM056DGGEE7sz7ucE96ZP0npssO0V2bhEurogiU88HXqx8VoNEEOldvrlPDJMlH2NSrZnnWORW1z.T011cTp15VGao+AeBDMDLJ5puS6ZU73vKug.BB82yi.npssqnBZqaNwBd6Cd+M+FZuhqAA+ZoCm4pzTgfO9hlIOc7YIqBACA4ZapZa6BNes0sA6gJpnRaKp5OwjMqX6q9Xb7MeJJ40vGuxpz5fBfPngitq8VQyseuUdtoppssoopzV2eRrC6XdtWGNOYBHXswMqgTo0CE.z6EZhsG30mtbW85rp11tfyWac6chs8kejpH2N.A.AqVvYRIhsO4s.T011Kb9Zq6S.hqbTPNYVoCprACf0pIJD1pfhBdKKiOxNvaYOq0QnVj5q5X4WAPLjvvmUucUssI.OQs0s2IVI2r.N2.hoHIMjmFsXRRBqBsdAWb2PAzq3DebJQHNri+dHwR3Vr5q5X4W.PIeWu6qp113vSUaceDaUgQKiEAQxWRCEJoEuTbRHNr1pM1ZOejUTvrjDET5BjsVYY7pUdk8qkr9pdU9K8t4pZaCGOYssFmESEqQCknw0fR2WYYOFQF.QAA7U10f22jjDFkZPw2flTZIquZrkeUss9gmr1ViNw1DDwlfDd4rkePi2mKahD2keY0Z571oSrIHg0lgv2Z8kVi5qFZ4WUaqe3Iqs03dKa0AnhKuGFhHBl5S8jbEO4Svk9.2eyRrONvnhh63S+Dt8O4iIvnq4IzsXMrpAjOf0lbqq5oppupHQEe7bSusqdJdzyY1LpYeG0X9EZrckY+4eVMllZp7WesUUss5wSVaqWpjNe8kGbs+FADQDjxd2Gi7Ntctw+2aVexhZEAQQlyWrX7KzPwuPCk4r3OuRwz55Bx.KF3O.9Xfi2jZgMb7NPCzogLX.H2jRhyd5SWio2pwR3z6Xms.Vlp11Xo0TaqWNwCZFSmBRMMV58c+bvUuZdqoc0Lx631aRm9ZS6esH51nGU4+taidTbU+qEUuxiiAX.Xl.2BvZZxrtFFccDCmAesWSkdxVtIkD4lTRk+6v6V2n6W7XPid8Dc+6O58yOrZzHIsiczhXipZaCCOAssd0iAa+KWBa+KWR4+NnNFiqf4dSXzRXkO8BYkO8BaT4QJ.cvryPE..XArIQTPTcpz+N..a3ZxqoswYZ0eDD3AV8pPPTjrRHA59EOFbTZrydz24cBJJrxE9LL169tXJOwBXKe1myM7+dSz4sO7w27sfCqVY1K9y4Y5SbM6lpp1VOwCRaavc6m2FLvrd8WiU+rOWi1HZpwFUVT0PqiPOfq7JQm2dy+Y7S..tzG7AXn23MToznyGe3JelExKL7QP9ojJa38de9WG8vsvVZkQUaqc7jz1FTOWDd25FO1V1DIsssye71ucSsM0nQGUdZi6fVg6TCz8KdLbr+3bAxsD9qM3VZ53fFHEkYljeJoB.ElQFj9gNTKlMd9nps0M7jz15sSbjwEGO75WGq4keE9lG5gaxMnlBhFH4R+6h.zSqiPqnnT9RKB3Z8mxszHKiF8dUoso0KubKcsDnps0c7jz15kSbPwDMOxuuV91G5QXqe9haxMF.l2JVtaqWwyaEKudkGwAT.v2.7E.SpYvNqKb70ud5UEV6l6ykbItklTOvAw2PBl9LwKEv0c3iLtl+2A97QUaqe3Ios0q2Idb268hOAED+sktjJs8GJnPvt4llnp+mO64vB1w1KOfemepowmOm6rdkGh.2NtDaevUSvZM3v+1ZXLy8uwSu2cSw4jK9FRv3zdkiOT1JoDd2YLStme36w2fClSrgMhoBJ.4V3Aggp1V+vSRaqwkwkVqk3iXG4H3gWqqOdvqc4ShSsksVio2SY44nAUeIHP2F0H4jadKt9onHuXJmgW4hGK4dpjpkC1E0kx+4uLtnps0O7j01Z9IwkFQ9UTTPnEbr0dpstMV4yrHDDDpUQVodrpAzrSCo9RQga3MdcRbSaFi4lKQDebjyIOYcVjavkeUss9gGr1ViOINas5Has5wKOfYQR0gEAQrHJRX1sQGr2RNP7bmFZ8kgHhfQbq2BZzqmylbxbjeaMTTVYUmN15Z4+7eRrp1V+vSVaqQmXihRjqVcTfjV7S1I5kc1hdW6ZCyBhThnDA5zNgY2F91JGc+aoqupOk+y2IVUaqe3Iqs0Xyo8S1I1JcBIaTRCEqo0eJgUQzJKSfNcMooasEYnku9pwT9U015GdxZasZIA6vN5jkwaYYr6ALkvpHZjk8XD4xnkr9pwV9U015GdpZac51I9I6D+7fpL8zosT8UaIa0S.Ow5KOqa+phJpTuQ0IVEUZiipSrJpzFm5z6DaGAJRiFLKJUySRbEEzpnfAG18X+1ipTYT0119TqNw++s2Yd3QU0ce7O26cVxLYlrgHxlDhJhAPIUQDPPpEjMot1JJ1JXKVKtVWPA78wkZstz99Hu9ZaEzBtPQKQC6B1VQ.AU3kEkEkvRjUARjP1lIyL2k2+3NIgP1lDm8b977viybmy76dN9M+Ny4dtmy2qJRTrM6TghoPazB2ZLa550dCpcpqgszSmdNhQPG5cuQ9LlVdcMMJYm6jCr5UiuScp58Ydkk4aSIUJwpsl2igLLniA7Q1U6oIMZ6pwzSlhsKbuPCILWSvtC9eijHz1nKQJssEShKyhEpPwBAjjHy.9ZRiBCLWlXdTTnbEql8ZmRpbw24cBomAU1HSIujhER6R5O8+Bt.11rmcshc0RxrMWoyVblZn0Jb3f7rXi7p7TMPrOEvIf3OCRuoHnwgWllFcBSqnIRgPaixDgz1VLItZYEpVVgLB3uYEY.jB5Wt9TTvmjLcZ3+XH8L36NzgXqErH7WUU0q71c4h9MtwR2yIGxdDifcme9.PQNR0zqcMzQV0eKMJOzULck+hRIUx0SE09YdAJAnbK1HUYIxBo3J+UtwP2vfJQhxjT.U+XCvQD5bIz1nKQJssEShMjjPWBTZE++GECCzkfzxomDPVlss3kz.QF.eUVIae4qfN8.2OYcAWPsG+jVsR.IYt0qcbX2VKuku84O.edAKgSZs9aLsSATohBoJKgaoDi4vSVRhzPBj0wihBkooEwRhEZazkHk1FQa8VraGC.eUTQSVFeUVIF.J1pSjzjjwPhPRjAyxYHA5mQOw9.7Kofy39wY0PbgD9kTHd84WnPaa6Dt01DitvZinCMqgeGNoy4lK1RMDuNuPfZLNbw7.23Hz1SKdgo3ztmw+zOIc77NuXc0PPDf3csM9ZqqDCoy8t2j2MdCT9INAa7er.76wCC4NmL6YsqiALgagcul0vdW2mB.mUOyl7tga.Ue9YiKXAT0IOY8hUV83bYf21swQ2wN4KW5RALsuzKd7WK1c4hh229nhSTLe2t1UztY1tjjcsU7Kw.cOu73mOqWl8t90i6N1Qti482ALel5L9m5I4.adKLgY8xb9C8JIit1UlzbmKGYG6.+d8v8shkUuX02QOZt2ksTNxWsct7ewDYLS+wAf6b9uMcu+8Gq1syu5cda5beh9lgW6QZOnsheIFnpuuDl2jlLcH6dvA17l4xlvsT6mszm7o3D6aezk9jKcI2b4DEtGl2jmLNyLKBTc0jQW5R8h0Plxuh25N+07saZS7UKe47r6oP9+9mKDGtSiBl9L.fNjc1QylW6ZZOnshjXfypm8ja8u7p7UKYolF88oMYIdKub.yUfjjrLolYlbWu+BYWq5in38t2FDKmokNUcxuu126qxJHit1U7TVcqZoybHZBhbzdPaECmF3xusaikLy+KJX5yfh13FQtY1v24ci2.e5rmCK7gdX9xkrjFLqkGuvB47uxqD.RqScB6tby2twMx4bgWHo1gN..8YTwJ2Rt8GsGzVwuDCrsBVD23K8Bb429sww2cgb3s8k.vA2xVQ0uoEkdxCcHz8Gfh9hMxjdy4xEMhQvg+puhu9+7evpCGbzctK7WUkr7e+yxs7JyhANwIhgtNy9Vl.AptZVzzmISYA+C.vuGOfl3lGEMn8f1JRhA1wJWI6XkqrAG+cu+Gn1Wuk7e+Ze8yzuKoAkcYO0SW6qm8O6Vp2mIawBW5O6l4kuFydomx6s.J8nG4Gb8VPKS6AsMoNIVBhIdq7YhtpJkc7iw8trkh6NdVT3ZVKE84eQy9cpwygS7VORQGDZacjTmDaGvpgNdQNhus9ZId+G8wZUk2Kl08X0ioj3cDZacjTOwVt.booRY553wvvrGvD.pxvfxz0wklJoEqqLwoHz15Ho9WhSCyEJOp9oREKTprr4iEi3brpqS5ZpjAlafbAMDg1VGI0Iw.zQLG5UEZp3K9xoQaRrg4FFWj.27HzVSR5ShCfDArXACYErEmuowAp0KqrpF.DdYUyhPaMIoNIt05gTwKbldYkfFhPaqij5j3ViGREuvY5kUo3WK4d1GaiHz15HoNI9z8PpsnoxlB9.wZ.JVX.VBMmkHZyY5kUAjjwtXX0M.g1VGI0cx2V7Pp3EpwKqzS.q6QCDZacjTmDKPP6ADIwBDjfiHIVffDbDIwBDjfiHIVffDbDIwBDjfiHIVffDbDIwBDjfiHIVffDbRtShCZCJIJaX7SGCIPxfDh8HaLAg1VKI0qcZqFFlV3hhB8FC5RP6J0cb9hkWEycoihgNVEqa5FEg1VGI0Iwt0BfWYYJWwJXQgTC10mNlOeaiWQURF2ZAvstVxs.8C.g1VGI0+MhScc5P.+Xyv.e.FIHOLpsZD.2ZZjtVfXcUItEg1VGI0Iw.3VWC290nLj3TX5zfwSHA3.SieyYvgBZyPOIexJBOHzVSR5ShAygWcBL2P19jThuLyYCvqgFUqoQmLLH8Xc8IACg11NHI1KPI.kawFoJKQVHgbbzjenaXPkHQYRJfpergYu2BZYDZqII8IwmBnREERUVB2wgW2jrjDogDHqiGEEJSSSjDGhHz1fmmHPLiqvGfeIEbFWMNqFhKjvujBUGqqHIPHzVSR5Sh0w7lqGuajZxRRXHYVeEDZHz1fwOBE2DJtoW7EH8y4bBoxlY26F83RuT.nmWw.C4umfXColUVbACangkXIIKyjm2bCKwJbhHIFnaW7EiUGoDRk8GcS2D83xLSh+IO3CPZhj33Zx4JtB5+0ecgmfIIQOFv.BOwJLRR+DaEpL1YNS5Z+5Kkcriyblvsx4bgWHid5OFy4VtU.3Y9lulmePClgNkofttFF5Zb9CYHj0q9J7+LlwQ+u9qig8atKTrZkO80eCV2rmCiclyfNeQWDY18tiizby7um6k8ugOKF2Raewnd7oQFcoqruM7YbzsuC9Y+2+YRIM2T5QNBu4j+UDvqWF2SLStnQNRT84Cao5jY+ym.RRvs+ZuFNROM9tc80XysK9629ur13dV4zS90y+cvvvfCtksx6d+O.F5wlKFR7KwAonMtQ9iCbPr+MrAF0zdzFsLdJsTV2blCex+6qx5lyavdW+5YA2y8QG5QO3Geu2CuxXuV9yC+p4Ru4aldNvKG.7VVY7mtpgS9S6w3pum6IZ1jD.rpm+E4KWxhYK4+9L42ZdrpW7E4kF5UwdVyZ4leoWjtmWdb9CcnLqQMZdm69toCYmM.7SelmgM7luIu3UNLN4AOXCh6jl2bofY9D7BC9JohhKlgO0oFkaY0gHINH07zheaKZwjcqbHScou8gc8Q+K7VVY32iG19xVF4LvAB.EsoMA.kdvCgMWoFdqzBZUj5YY9P.GfM8tuG4LnqfyaPChctxURfpqlR1eQbnsrU.HmAMH15GT..r4Ele8hiUGN3b6e+YLO9iyC9Qqh9M1wv4OzgDcaLmFQsgSe9C8Jaziu208oQqpPyh0TLulXGYlA985wbKtcZy5ohsl9oJfp2pwYFYT66cjUVT1QOJ1c6NlMDqnIw6ZaMnXwBRJJXnogyLy.+d7fmSUJmSu6cskwQFlqqJumpTRMyLohhKFGYlQ8hitpJkcriyKeMiB.RwsaxnacK50PNChZIw8ZXCqQOd7hPO5o+3r4EtPF4C+v7Eye9T5gOLma+yi9+S+ozs75Oo3xE.32iG523FGE9Iqg.U4ggdWSgU7GdNF+u+o4RF+3Q0ue5y0LRdsa9myfm7jhsMpnDwyZquppjdNvARNCdPr8ksbttm4oYmqZULr65t3Se82fsu7Uvndrogle+39rOayDZCCVye60Xxu0ax9V+5oWCe3T9INdswTKP.91MtQF2SLSJbsqkQMsowNVwJ3Xe8WGSZispj3Mo1x67hdIqjvMH87ezoglpJW5McirnY9DbzcrC.XViZTLvINQ18pWMaaQKF.9r27s3Xey2fmScJ9foOCNmdegT0IOIuxXGG8cLiAmomNux3FOdJsT9729sQ0me.36O3AYQy3IhYswVhjUssv0rV9fGe5T928c7dO3ui9MlwPuF1v3S9q+U1252.NyLSd2669AfpqnRxd.WF985kCr4sPIEUD.7c65qouicLXnow7lzjAf2ZJ2E8czildMrgwFl6bYKu+GDyZistj3fOzpZNNaIYpYvG5ZlO02rX2NEt101nkWwlMyxp1xwNRwQ191Afk+r+g5c7RJ5aavwT84i8r10U66q3Dm..J8PGl0M64TuxdxCdnZec.ud4n6bmg05c3jjUsEp+HB11RVBaaIKo12mQW6JSXVuL4+nSidbYWJRJJ3ozR4Fe9+HUTbwrqO5iXPS5NXKefYR52FbNNB30KasfBXqETPzswzHDQGNc4G9vzwKxM8YTihc7geHZApeu8J1rQtibjX0PmxNvAp83RFFHY.AzzvphRKddBnogjg426LQBp0FWjhiWYOFAsal32ZX8IYQaO5N1Auwu3N3hFwOAUe93EFr402+dO3uibGwHnWCaXrhm64nnO+KZSwGh7ZaKmDeZdYz.TZ4hmQvkXljNb30tN5RN4P18MW5Z+5aiVdqF5XwqWJ5e+uq8XoqF.uxJL+EsXj0To4zGc.CYqbAFFjQiLjP6AOGdQFmsXsO1gWLqm1hlmTg1BXlHWykPUCA75kuboKkuboK8GPjMIRqssnxc5dYz.Bgd6TANUPODx+QOBaedyiru5qlLxImFs2xSt28xA93OFOG6X0drrq1CkYwJHaCc4PavBN08Q1UWUCNtK.WZpTljLHKiCHt6Wjqxvfx00IcMURKJddEZajmng1JMquX+0abJUMvbpWA7HKyIrZ2zKi.jaAK5qFODJS0.jUHLYIMEkqXgCjhSJ0hUZ1tqAxLfe5Q0dHsl355JFnTfJUrP.43uYlwptNtzTICfyNBcNR8K1uPaiADMz1VrqvVqWFEt7PnzzToeUU9OnXTCcDygdUglJ9zBKgLrhMfzAbGkOuBsMxSzPaCowyTiWF4Spk5qN90enRK3+DTeDZahOspYm1tvCjSZQnsItDO1wp.ABZEHRhEHHAmPd3zAPhxsXAuxJs3LJFwvv.G5ZjlpJVahqfy.yY+rREKXzJqmxFF3L3D2DeciJhrHz1DaBojXUjnDa1obEK3QN14suRFPJ5Z3SVgN52WiJ1kqXgRrZiJTrhQqrdJY.tkCfLFM4szHYCg1l3SHkDWlEKTthE7KIQVA7EyLlLUCCpxhUpPwB1snQGZj6UYUJVnREqjlZ.r0Jery4GIJ2hUbnqmzIzMEBsMwmP5ZhqVVAuxJ3VUMl5rfVjjH0fKaupka70cqtjD5RzpEYv76XHYFi1KjnpscN2b4r5Y1sXb6P18ftzm9jTqsgTRrQv0Lqkyn8GKb6QKAqKs1qIJYD2ggMhdSos1b5jbF7f9AG+VCsFsMqt2c9M4uPxracsIKSlcqqb2ue9jYLbC62Vo0nss4Ym9AV4Gxi7IqlmcuERuF9U0VCif1H4dq2Ji80e8HV7GyLlNSsfX2djskXmqZUj+i7nL0EunFMQNyt0Ul5hWD4+nSictpUECpgscZsZaaJItuidzzqgeU7j41G17Bymq62+LskvHnMxU+RuDW9C8PHEAVqvo24Nys+Z+MtlG4gC6wNbytW8mznIxmdB7t+3UGCqgsdZKZaa5uBxdfWNkdjiPI6uH1y5VGm6O5GgTHr2PEDdXee3GxRl3DiHwNEWtvPWmO74egHR7C2blIxIxIvPaSaaSIw1c6B0p8A.A74CYEEr6Ldd25lbwA93ONhE6ium8v7+sSkpJtjH14HbSMIx22xWF22JVdBaBLz1z11jydn4O.JVM29ZVBZAKApV7n.SPriSrm8fE61MecgEFiqMQWZSIwGuvBIitzYRqSchyMu7nj8WDZABPW5SePWUkis6cGtqmBhwDOqs0LD54O06ALLXpKdQ7WttqmRO7Qh0UsnBsoj3Msf2kgL4Iye7.EgtpJuyu0z86u9m6OP0kUF+8e4cDVqjBh8DupsM10.Wy0H2dIQtEc1C.NrcGTrUazw.9iZUrliZpKcym2F7Y+PqqMWrSjowb1CHwVaatIw5B+wCma9O8R0KQNYUaE6hIAIjzRyBcSc6mRFIzRhC5JhZMhsgFsQKXcg3f5RRAInZaNCdvTvzmQyNKz6d0eBEL8Yv4MjX2yIonAgz0Da2PGGFZTkhEboohbLZIOpYXfGEKjhgVS5DE03qwpz5uf+.PS5wwIqjnpsa9etvPJt65i9W.I2ZaC+6bIoFzSX5pAvmjLkawBeuU6wrsqlgA3zPCWppjdS31hN00vslJkZwVqtdJY.t0TwgdbniqENPnsIkZaCRhkR0EFUVQ8NlMCCN6.9vtgN9jjicabb.65ZjtZ.r0D8nltZ.Lvbuo1p2jDFFjZv3mTgaSajSnsImZaCRhkG43Qc44ij+5Oak1LLhalAylCYHnmHmjIVsUraGkQNd.g1lzQPssASrk8GXFHmdVXXqsribEDWQJNfzxD628CAHz1jJNMssAIwRNbhi2aUXcr2DRth11YtfvERNSEKi95w47WNRomo4wDZaRAmo19+CtTg2RBvg3iK.....IUjSD4pPfIH" ],
									"embed" : 1,
									"id" : "obj-4",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 131.5, 72.5, 241.0, 287.0 ]
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
									"patching_rect" : [ 1.0, 1.0, 890.0, 623.0 ],
									"proportion" : 0.39,
									"style" : ""
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"hidden" : 1,
									"source" : [ "obj-10", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-12", 0 ],
									"hidden" : 1,
									"source" : [ "obj-13", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"hidden" : 1,
									"source" : [ "obj-15", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-10", 0 ],
									"hidden" : 1,
									"source" : [ "obj-16", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"hidden" : 1,
									"source" : [ "obj-2", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-28", 0 ],
									"source" : [ "obj-26", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-25", 0 ],
									"source" : [ "obj-27", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-29", 0 ],
									"source" : [ "obj-30", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-31", 0 ],
									"source" : [ "obj-32", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-33", 0 ],
									"source" : [ "obj-34", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-35", 0 ],
									"source" : [ "obj-36", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-37", 0 ],
									"source" : [ "obj-38", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-40", 0 ],
									"source" : [ "obj-41", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-43", 0 ],
									"source" : [ "obj-44", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"hidden" : 1,
									"source" : [ "obj-6", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"hidden" : 1,
									"source" : [ "obj-7", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 7.0, 85.0, 43.0, 20.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p serial"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-96",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 5.0, 63.0, 46.0, 20.0 ],
					"style" : "",
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"id" : "obj-97",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 5.0, 15.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 295.0, 393.0, 21.0, 17.0 ],
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
					"id" : "obj-65",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 439.0, 577.0, 93.0, 22.0 ],
					"style" : "",
					"text" : "serialport ready"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-63",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 438.0, 600.0, 34.0, 22.0 ],
					"style" : "",
					"text" : "print"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"blinkcolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-62",
					"ignoreclick" : 1,
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"outlinecolor" : [ 0.094118, 0.113725, 0.137255, 0.0 ],
					"patching_rect" : [ 438.0, 552.0, 17.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 165.0, 24.0, 12.0, 12.0 ],
					"style" : ""
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
					"outlettype" : [ "int", "bang" ],
					"patching_rect" : [ 424.0, 525.0, 34.0, 22.0 ],
					"style" : "",
					"text" : "t 0 b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-54",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 144.0, 558.0, 24.0, 22.0 ],
					"style" : "",
					"text" : "t 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-53",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 143.0, 488.0, 24.0, 22.0 ],
					"style" : "",
					"text" : "t b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-52",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 143.0, 523.0, 63.0, 22.0 ],
					"style" : "",
					"text" : "delay 100"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-51",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 439.0, 490.0, 40.0, 22.0 ],
					"style" : "",
					"text" : "sel -1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-48",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 104.0, 152.0, 65.0, 22.0 ],
					"style" : "",
					"text" : "metro 500"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-49",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 79.0, 153.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-47",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 63.5, 260.0, 50.0, 22.0 ],
					"style" : "",
					"text" : "pak 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "bang" ],
					"patching_rect" : [ 27.0, 238.0, 34.0, 22.0 ],
					"style" : "",
					"text" : "t b b"
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-45",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "sensorinput_module_vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 1009.0, 485.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 162.0, 281.0, 118.0, 110.0 ],
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
					"id" : "obj-46",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "sensorinput_module_vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 782.0, 538.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 43.0, 281.0, 118.0, 110.0 ],
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
					"id" : "obj-39",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "sensorinput_module_vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 1010.0, 387.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 162.0, 170.0, 118.0, 110.0 ],
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
					"id" : "obj-40",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "sensorinput_module_vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 763.0, 395.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 43.0, 170.0, 118.0, 110.0 ],
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
					"id" : "obj-38",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "sensorinput_module_vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 1010.0, 289.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 162.0, 59.0, 118.0, 110.0 ],
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
					"id" : "obj-37",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "sensorinput_module_vpt7.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 865.0, 212.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 45.0, 59.0, 118.0, 110.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-19",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 228.5, 346.0, 150.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 179.0, 3.0, 59.0, 20.0 ],
					"style" : "",
					"text" : "baud rate"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-16",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 228.5, 370.0, 150.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 24.0, 3.0, 56.0, 20.0 ],
					"style" : "",
					"text" : "usb port:"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"fontsize" : 10.0,
					"hint" : "listen to serial port",
					"id" : "obj-208",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"mode" : 1,
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"outputmode" : 0,
					"parameter_enable" : 0,
					"patching_rect" : [ 9.0, 167.0, 39.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 250.0, 20.0, 42.0, 20.0 ],
					"rounded" : 8.0,
					"style" : "",
					"text" : "listen",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "listen",
					"textoncolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-32",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 57.0, 91.0, 63.0, 22.0 ],
					"style" : "",
					"text" : "r serialout"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-20",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 378.0, 506.0, 40.0, 22.0 ],
					"style" : "",
					"text" : "A 179"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-30",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "bang", "bang", "int", "int" ],
					"patching_rect" : [ 665.0, 71.0, 67.0, 22.0 ],
					"style" : "",
					"text" : "t b b 3 100"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-21",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 665.0, 44.0, 27.0, 22.0 ],
					"style" : "",
					"text" : "r lb"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-18",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 460.0, 517.0, 58.0, 22.0 ],
					"style" : "",
					"text" : "s serialin"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"hint" : "serial input refreshrate",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-44",
					"maxclass" : "number",
					"minimum" : 10,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 143.0, 200.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 292.0, 22.0, 37.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-56",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 435.0, 465.0, 64.0, 19.0 ],
					"style" : "",
					"text" : "fromsymbol"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-57",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 435.0, 442.0, 96.0, 19.0 ],
					"style" : "",
					"text" : "tosymbol @separator"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-58",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 3,
					"outlettype" : [ "bang", "bang", "" ],
					"patching_rect" : [ 435.0, 371.0, 67.0, 19.0 ],
					"style" : "",
					"text" : "select 13 10"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-59",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 435.0, 421.0, 67.0, 19.0 ],
					"style" : "",
					"text" : "zl group 100"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-60",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 446.0, 395.0, 40.0, 19.0 ],
					"style" : "",
					"text" : "itoa"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-34",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 212.0, 451.0, 79.0, 22.0 ],
					"style" : "",
					"text" : "prepend port"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-29",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "print", "bang", "clear" ],
					"patching_rect" : [ 260.0, 266.0, 80.0, 22.0 ],
					"style" : "",
					"text" : "t print b clear"
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
					"patching_rect" : [ 143.0, 370.0, 27.0, 22.0 ],
					"style" : "",
					"text" : "iter"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-27",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 143.0, 395.0, 98.0, 22.0 ],
					"style" : "",
					"text" : "prepend append"
				}

			}
, 			{
				"box" : 				{
					"allowdrag" : 0,
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_color" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_color1" : [ 0.376471, 0.384314, 0.4, 1.0 ],
					"bgfillcolor_color2" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "color",
					"fontsize" : 11.595187,
					"id" : "obj-24",
					"items" : [ "OFF", ",", "Bluetooth-Incoming-Port" ],
					"labelclick" : 1,
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 143.0, 419.0, 138.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 27.0, 20.0, 137.0, 21.0 ],
					"style" : "",
					"textcolor" : [ 0.149, 0.149, 0.149, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-23",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 143.0, 346.0, 62.0, 22.0 ],
					"style" : "",
					"text" : "route port"
				}

			}
, 			{
				"box" : 				{
					"allowdrag" : 0,
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_color" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_color1" : [ 0.376471, 0.384314, 0.4, 1.0 ],
					"bgfillcolor_color2" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "color",
					"fontsize" : 11.595187,
					"id" : "obj-25",
					"items" : [ 1200, ",", 2400, ",", 4800, ",", 9600, ",", 19200, ",", 38400, ",", 57600, ",", 115200 ],
					"labelclick" : 1,
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 150.0, 260.0, 100.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 173.0, 20.0, 64.0, 21.0 ],
					"style" : "",
					"textcolor" : [ 0.149, 0.149, 0.149, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-26",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150.0, 285.0, 52.0, 21.0 ],
					"style" : "",
					"text" : "baud $1"
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
					"patching_rect" : [ 168.0, 230.0, 34.0, 22.0 ],
					"style" : "",
					"text" : "print"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-43",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 7.0, 200.0, 65.0, 22.0 ],
					"style" : "",
					"text" : "metro 100"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-22",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "int", "" ],
					"patching_rect" : [ 56.0, 304.0, 71.0, 19.0 ],
					"style" : "",
					"text" : "serial a 9600"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-13",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 557.0, 181.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser9"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-14",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 511.0, 181.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser8"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-15",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 464.0, 181.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser7"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-10",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 419.0, 181.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser6"
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
					"patching_rect" : [ 372.0, 181.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser5"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-12",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 326.0, 181.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser4"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 282.0, 180.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser3"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 234.0, 180.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser2"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 188.0, 180.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "s ser1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 161.0, 106.0, 56.0, 22.0 ],
					"style" : "",
					"text" : "r serialin"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-1",
					"maxclass" : "newobj",
					"numinlets" : 11,
					"numoutlets" : 11,
					"outlettype" : [ "", "", "", "", "", "", "", "", "", "", "" ],
					"patching_rect" : [ 211.0, 131.0, 154.0, 22.0 ],
					"style" : "",
					"text" : "route A B C D E F G H I O"
				}

			}
, 			{
				"box" : 				{
					"angle" : 0.0,
					"background" : 1,
					"bgcolor" : [ 0.52549, 0.0, 0.0, 1.0 ],
					"id" : "obj-3",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 690.0, 155.0, 128.0, 128.0 ],
					"proportion" : 0.39,
					"rounded" : 0,
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"angle" : 0.0,
					"background" : 1,
					"bgcolor" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"id" : "obj-36",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 958.0, 56.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 0.0, 0.0, 345.0, 418.0 ],
					"proportion" : 0.39,
					"rounded" : 0,
					"style" : ""
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-10", 0 ],
					"source" : [ "obj-1", 5 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-11", 0 ],
					"source" : [ "obj-1", 4 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 0 ],
					"source" : [ "obj-1", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-13", 0 ],
					"source" : [ "obj-1", 8 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-14", 0 ],
					"source" : [ "obj-1", 7 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-15", 0 ],
					"source" : [ "obj-1", 6 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-41", 0 ],
					"source" : [ "obj-1", 9 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-5", 0 ],
					"source" : [ "obj-1", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-7", 0 ],
					"source" : [ "obj-1", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"source" : [ "obj-1", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"source" : [ "obj-100", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-34", 0 ],
					"source" : [ "obj-131", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-1", 0 ],
					"order" : 1,
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-77", 0 ],
					"order" : 0,
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-43", 0 ],
					"source" : [ "obj-208", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-30", 0 ],
					"source" : [ "obj-21", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-23", 0 ],
					"midpoints" : [ 117.5, 334.0, 152.5, 334.0 ],
					"source" : [ "obj-22", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-58", 0 ],
					"source" : [ "obj-22", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-28", 0 ],
					"source" : [ "obj-23", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-131", 0 ],
					"order" : 0,
					"source" : [ "obj-24", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-53", 0 ],
					"source" : [ "obj-24", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"order" : 1,
					"source" : [ "obj-24", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-26", 0 ],
					"midpoints" : [ 200.0, 282.0, 159.5, 282.0 ],
					"source" : [ "obj-25", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"source" : [ "obj-26", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"source" : [ "obj-27", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-27", 0 ],
					"source" : [ "obj-28", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"midpoints" : [ 269.5, 298.0, 65.5, 298.0 ],
					"source" : [ "obj-29", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"midpoints" : [ 330.5, 342.0, 288.0, 342.0, 152.5, 342.0 ],
					"source" : [ "obj-29", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-82", 0 ],
					"source" : [ "obj-29", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-25", 0 ],
					"midpoints" : [ 706.5, 242.0, 159.5, 242.0 ],
					"source" : [ "obj-30", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"midpoints" : [ 690.5, 255.0, 269.5, 255.0 ],
					"source" : [ "obj-30", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-44", 0 ],
					"midpoints" : [ 722.5, 166.0, 152.5, 166.0 ],
					"source" : [ "obj-30", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-67", 0 ],
					"source" : [ "obj-30", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"source" : [ "obj-31", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"source" : [ "obj-32", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"midpoints" : [ 221.5, 470.0, 24.0, 470.0, 24.0, 294.0, 65.5, 294.0 ],
					"source" : [ "obj-34", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"source" : [ "obj-43", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-43", 1 ],
					"source" : [ "obj-44", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"source" : [ "obj-47", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-48", 0 ],
					"source" : [ "obj-49", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-18", 0 ],
					"source" : [ "obj-51", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-55", 0 ],
					"midpoints" : [ 448.5, 515.0, 433.5, 515.0 ],
					"source" : [ "obj-51", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-54", 0 ],
					"source" : [ "obj-52", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-52", 0 ],
					"source" : [ "obj-53", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-49", 0 ],
					"midpoints" : [ 153.5, 590.0, 55.0, 590.0, 55.0, 122.0, 88.5, 122.0 ],
					"source" : [ "obj-54", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-49", 0 ],
					"midpoints" : [ 433.5, 610.0, 48.0, 610.0, 48.0, 124.0, 88.5, 124.0 ],
					"source" : [ "obj-55", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-62", 0 ],
					"order" : 1,
					"source" : [ "obj-55", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-65", 0 ],
					"order" : 0,
					"source" : [ "obj-55", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-51", 0 ],
					"source" : [ "obj-56", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-56", 0 ],
					"source" : [ "obj-57", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-59", 0 ],
					"source" : [ "obj-58", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-60", 0 ],
					"midpoints" : [ 492.5, 392.0, 455.5, 392.0 ],
					"source" : [ "obj-58", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-57", 0 ],
					"source" : [ "obj-59", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-47", 0 ],
					"source" : [ "obj-6", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-59", 0 ],
					"source" : [ "obj-60", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-61", 0 ],
					"source" : [ "obj-64", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-63", 0 ],
					"source" : [ "obj-65", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-89", 0 ],
					"source" : [ "obj-66", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"source" : [ "obj-67", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-89", 1 ],
					"source" : [ "obj-69", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-82", 0 ],
					"midpoints" : [ 354.5, 282.0, 354.5, 282.0 ],
					"source" : [ "obj-81", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"source" : [ "obj-82", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-73", 0 ],
					"source" : [ "obj-89", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-96", 0 ],
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-95", 0 ],
					"source" : [ "obj-96", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-92", 0 ],
					"source" : [ "obj-97", 0 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
				"name" : "sensorinput_module_vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
 ],
		"autosave" : 0
	}

}
