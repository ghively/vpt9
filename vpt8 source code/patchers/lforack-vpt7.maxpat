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
		"rect" : [ 463.0, 166.0, 359.0, 440.0 ],
		"bglocked" : 0,
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
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-25",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 332.0, 272.5, 39.0, 22.0 ],
					"style" : "",
					"text" : "s lfob"
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
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 332.0, 241.5, 60.0, 22.0 ],
					"style" : "",
					"text" : "loadbang"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"id" : "obj-101",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 363.0, 374.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 301.0, 390.0, 21.0, 17.0 ],
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
					"fontsize" : 10.0,
					"id" : "obj-13",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 361.0, 414.0, 33.0, 20.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-45",
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
						"rect" : [ 212.0, 131.0, 896.0, 625.0 ],
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
									"id" : "obj-81",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 540.0, 470.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-82",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 504.0, 456.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-83",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 481.0, 472.0, 40.0, 20.0 ],
									"style" : "",
									"text" : "on/off"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-79",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 125.0, 303.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-80",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 114.0, 277.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-77",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 537.0, 568.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-78",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 582.0, 542.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-75",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 677.0, 566.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-76",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 629.0, 538.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-73",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 621.0, 470.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-74",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 648.0, 442.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-71",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 591.0, 468.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-72",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 587.0, 430.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-69",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 567.0, 469.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-70",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 504.0, 433.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-68",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 683.0, 565.0, 146.0, 20.0 ],
									"style" : "",
									"text" : "reset mix to 50%"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-67",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 516.0, 567.0, 146.0, 47.0 ],
									"style" : "",
									"text" : "mix level: 50% half of each, 0% all of source 1, 100% all of source 2"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-66",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 655.0, 496.0, 122.0, 47.0 ],
									"style" : "",
									"text" : "The range sliders work as with the normal LFOs"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-65",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 558.0, 429.0, 152.0, 20.0 ],
									"style" : "",
									"text" : "mixtype (add or mulitply"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-64",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 429.0, 437.0, 122.0, 20.0 ],
									"style" : "",
									"text" : "lfo first source"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-63",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 650.0, 456.0, 122.0, 20.0 ],
									"style" : "",
									"text" : "lfo second source"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-62",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 363.0, 88.0, 172.0, 47.0 ],
									"style" : "",
									"text" : "LFO 1-6 are normal LFOs, LFO 7-10 are LFO mixers:  They combine two waveforms"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-61",
									"linecount" : 5,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 37.0, 229.0, 101.0, 74.0 ],
									"style" : "",
									"text" : "Turn the lfo on.\nThe number represents the VPT control nr it is mapped to"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-60",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 82.0, 408.0, 234.0, 47.0 ],
									"style" : "",
									"text" : "same as ctrl(win)/cmd(apple) click and drag inside the wave monitor to move the current range."
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-57",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 127.0, 373.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-59",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 176.0, 334.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-56",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 120.0, 371.0, 76.0, 20.0 ],
									"style" : "",
									"text" : "wave phase"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-53",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 69.0, 139.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-55",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 59.0, 101.5, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-22",
									"linecount" : 4,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 59.0, 138.0, 280.0, 60.0 ],
									"style" : "",
									"text" : "by default the lfos are mapped to VPT controllers 1-10, but you can choose to move the controllers by adjusting the offset. With an offset of 10 the lfos would be affecting VPT controllers 11 through 20"
								}

							}
, 							{
								"box" : 								{
									"data" : [ 3166, "", "IBkSG0fBZn....PCIgDQRA...PF...fYHX....POpPyW....DLmPIQEBHf.B7g.YHB..LTQRDEDU3wY6ctFbTUdFG+2d+V1cytYyMR.hXTtibQ.EoX7BBVZs3XUfNs1N01YrNNn1ocJU5zp8CskosenVqisVwpPEEGao3vTSUpnfUB3.i.pbI.AXSfbOYyd8r6d19gjMFxdIa18raNYy96SY1y6447bd9+7bt7ddy6qhHQhDgBHaP8ybnyOV6CEX.13RtFTNV6DE3poffHynffHyP8XsCjMvuG2za6sge28MxMVgBLZ1BlrYCilsl8ctQfXDjGaoSSxOH+gFNGvnLPkLRRPr21akNc5D28zA983ERgGhTeQEQQEWBNlxTvRIkFy1kL+dD7cHAUHq4XR2Ux1y7DARu.UxHdAQetcSmMeI55JsfghLSoSoTTpTURsiX3v30UuzYKWB.znUOFLadvsK09ch78njStjU5DnRFIJH5pi1vc2cgAyVnnhskR1RoJUTjM6.f6d5.2cYePAQp86j46C5OYj0SQtp.kM6Y7IUzfnQKVGHH1A.DvqGD75ACEYdDrPrXzhUB30K983Nq42Iy2Gb6opglioUfYU1SKmHSBTIigGDiHJhnXDTodzW3qTkJhHFAQQwA+srkeCwOA.RAAYx5lI+sYbAd7p2JaalMyhLu5Q8AejBTNO0I3+92eA.nCmWf5eomE.dye+Swa7a+4HFNTb2u3EDkRRle2tyKvtetsva769EzvasS.X2O2VnutZmlOymwKtoe.G+CdmDZ6D46infbuk9DzZvl36cpZ4c69kYiU8WFsmWIkSbf8xA9GuZLA8tZ4R3p6NntM7PnTkZ70mKtx4OSFe79nc+57Q690yX6ruc7hbaa3g39+QOMs4rIZ6h82ETAED3y+n2mYur5X5K9V.fqzTi3sudSI6Nh015UZBOg6A.ZUnIJQSUXPoY7IJAOBHf0RKi51v2kSLrroNa4RH3yGseoySOWoYZ7nMfEGky9eysyZ23ShFs5jjie5x8+i+kC92gBFDs50OveKPOs0JA75EOt5g2dqOCNptF5n4KPsKXoLqattjZ2QTP9fd1I+zotSdrp+qrTK2C.nUgd7gzHHSd5ycvrqgx0ciKiC+1+Sl0MWGa6odBV+S9aPiVc7g6ZGz3QNHy7lt0Q0wo9s9Go21aEWc1N.boO+3XwQYr5GZiYj+u2s8mojIMEJtrJA.ClJhoNq4gsxmDW9rmhxmxzXoe0G.Aed402xlybA4ft9W7COyMwBLeWrmNeNVWYaVxpNFMDshvrM6H322nd+uga+tIX.e7Ye39.fYcK0gFcFRa+IbnP7edomkRpZxrju78E21DvqWLY2A.n0fwTxti38Ppq3uAeyJdZNs2CQsFVHM56iQHh+Qgqm4XzRwzZSmEQwvbtieDpp1YNpsQE0TKSd5yEKNJCKNJiIO84RE0TaZ6Su2q9BnuHST40d8boScb760SLso7ZtVN6QafHhhzxYOM1qn5QztiXExm54.r9x9Y7ql16xm58.7quvCjdmAIASVKloMuEC.FsVL0N+k..ycE2E.b2e+GmS7AuCm6SNLK7NVCNpdpo8wZxSe1YtCCX1tCDCGFmm7SA.K1cvzW7xQqAiLoqelXvjYrWY0L6kc6bv2ZmnViVV424QFQ6NhBR6AuHO7omUl48JT.JTPDQQTnL1hRSVswzl+MB.FMakqcAQEjUN3usj070iY+hHJNnsSUpd5yQR76k9Ut+XZt0R6+9HCsBt1EtTpcgKMl1lHeOm7l55LX.s50Sf3TVmI32iGzp2.Z0oWRsaTxV9MjXeOmHHlJ1NEYyNt5pC70WeHEeFeut5E2c2IlsaGykz+MNGZF8nk3kwlM76D56CPNoyEMauDB3yK.3t6twUGskw1TqAiTb4UfkRKevNGbnYz5Gkc2Q7xXyF9ch78nDWAIZWlKk3npIiNCFwTwcgv.mjYBp0oGqNJihr8E8pazL5ta8xDIR+cyshT39Kdc0Kd5oarUQkwjwJ09ch78A21v+gneLorAlsWBlsWRV09oSFcxxXiZ2roeOTx69DtoSFcxxXy0HoBR13y+NdfnWUIheuD7rGCwNaFh2CVnPIJKqZTWybPoASw0VIUPD84Aem5HDrsKRjvgi6AP6jpA80NeTYrH.nolZhMsoMwt10tvu+b6azmKQiFMrt0sN1912N.DwuGDN59HRfjTUFQDwVuHBcdEztn6LthRBEDQetouCVOh9SxyfGQDglOGAaqYLur0..Ke4KGmNclhmVieIXvfCJFc1hSL2SyDIfWrVVkLikcanyXrA6.dcyoaX+z8kcRnycLzN6aNl1jPAw6oNJh98f8Jql4U2pR3A3D6euzgyKf+SeD.voSmT0LmAq7QdXLUbwo8IrbG2c0Mu2VeIt3mbLdq+zVX8q91AfYrrai2c2uYBGLD24W69ngcsCD65Jwc6ITPB0d+Y4y8Vuq3JF.nyXQLmuzcv91wVIX6MO3u+LO+yS4UVYpclMNl0tvEw89kVAe1+aevJWA.nynI92u11R39rlM7s6+ORzWAMQ6XjPAA.8lJJoNktAt2Qz1CLgPL.nzxKG.IsqUx6drW4.285+Vo832pffjEXMq+AS68svfsVlw3NAYKaYKi0tPVkwcBR9NiqDj78pCXbjfLQPLfwIBxDEw.FmHHSjP1KHSjpN.YtfLQSL.YtfLQDYqfLQr5.joBxDUw.joBxDYjcBxD4pCPlIHSzECPlIHxQx0IIxFAQNVcLV3SxFAQtwXUBhrPPjaUGik9yX92TWNIFxAeIkDj87ZuRBGEECNNiFGibPHhRJIHoz.+JMXrLPHmDggxX9krxEHWC9wiTRPxjA9UhHaFjFOI.CmTRPxjA9UtjwyBQTFStjkTG3xGDhnjyeOjBhQxQV7hgoK4ahAjiEDoL.lOJFv3zJj7Uw.xgBR9bPTJImHHEDiTmwkWxJelrtfjOWcjMN2xpBR9rXjsnvkrRSxVIaYMAoP0Q5QgJjzfrYxVVQPxmqNx1maEpPjYTPPFEjKp7KHHoH4pKCWPPRAxk2SrffHynffHynffHQDQQ+gxPBBIscCt83LG3CYIAIXf.YCyJ6H3.AWM5zgph6eBXtwO9CITv3KJgDD3rG4f.fRqwt.VBIaTmnTEHFlfABfFcId4EJphqP0Wrjx0PCMP0qX4nRiljb5L9lvADn4CeX.XZ2vhQ80LWD5cezVSMRaM0Xx2YUZP8zlab2TBEDM1KifcbYN4Aeel4xpC0ZzFSaBIHvIaX+8eLJtrA+8tOSiz8YFAmJOh64Q+InzhczL+5H74OAg6tURzDbtR6Uf5ZlMJMG+Is4DJH5utEPvtZiVZ7jzRimLoNjB0Zw3LVD.bnCcH17l2L6cu6Mqsb1IWXUqZUTe80S0CrHwnxhcTcCqHirYBED0E6.y2zpw2oNBg55JIbnjp1wjv30u.TYo+4L8krjkjQNz3Ipu95kbalzQtnZqkf4krxT1XYyIx+IJHoCkzQbpIOeh3LMqObTIFBiBdPiXPBoTEd0TDgTk7GzQxDjTZpIOehgMMqOTQQYDQJwSaXIPunjgdo9VoWcVoSSkQXEwegNVxDjTYpIOehgOMqaZ98eybkhgoZWWDsg7iMa1vhEKnUqVBDH.tb4B5sWzExONsVCQhyhMij8hgoxTSd1f87ZuBO5ZWIO5ZWI6YGubN63FcZVG3pll0KySqnMjeppppvgCGnUa+utfNc5nzRKkJqrRLHJfCOsFW6JYBRpN0jmOwvml0UIFByBtvlMaXzX7WYOMYxDVsZEqA5E0gCFy1KzWVRHlB1+8OsXwRRamEKVPAQvXnXWqQJHHRHpFHiWyHzkQQ2tZwBUHYUhnr+mbJTn3uTTDkvC7JAhwI7WPPjP7pt+UeZ2tcmz10We8uZa6USr2mQ5DjAxNlnz06Pr8zsfZ83QiI5t6tIPBhCBBBzUWcge0FPPcrKYrR16gjJ8Nb1f0r9GbL4+R3D0S2sZpBz0aSzbyMic61wrYynRkJBGNL80WezYmch.p3xEE+E8FISPFM8Nb9DCsmtAHrJM3r3Zn79ZAwN5fN5niqp8d0Xh1MVJgTE+DVISPR0dGNehg2S2QInRM3z5TQan.XJnaTDIBhJThWslPPUh+XefD24hi1dGNeGA05PPcxEfgSgmxRlQAAQlQAAQlw+G.EUAvfcHB0wC....PRE4DQtJDXBB" ],
									"embed" : 1,
									"id" : "obj-9",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 541.0, 462.0, 100.0, 102.0 ]
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-54",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 362.0, 37.0, 150.0, 47.0 ],
									"style" : "",
									"text" : "Use the LFO generators to automate the VPT controllers"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-23",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 232.0, 304.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-24",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 351.0, 239.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-47",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 169.0, 323.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-48",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 177.0, 252.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-45",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 122.0, 328.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-46",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 75.0, 312.0, 20.0, 20.0 ],
									"style" : ""
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
									"patching_rect" : [ 88.0, 375.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 135.0, 334.0, 20.0, 20.0 ],
									"style" : ""
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
									"patching_rect" : [ 293.0, 354.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 267.0, 335.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 194.0, 414.0, 20.0, 20.0 ],
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
									"patching_rect" : [ 193.0, 333.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-34",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 559.0, 401.0, 73.0, 20.0 ],
									"style" : "",
									"text" : "lfo mixer"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-32",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 293.0, 352.0, 190.0, 47.0 ],
									"style" : "",
									"text" : "same as option click and drag on the range in the wave monitor, changing the size of the range"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-30",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 26.0, 320.0, 68.0, 20.0 ],
									"style" : "",
									"text" : "wave form"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-29",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 37.0, 372.0, 76.0, 20.0 ],
									"style" : "",
									"text" : "wave speed"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-28",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 173.0, 226.0, 97.0, 47.0 ],
									"style" : "",
									"text" : "normal or inverted waveform"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-26",
									"linecount" : 9,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 361.0, 212.0, 458.0, 127.0 ],
									"style" : "",
									"text" : "The wave monitor doubles as range slider. The range slider lets you transform the output of the wave. At the default full range the wave outputs 0. to 1., the range slider affects the minimum and maximum values.\nClick and drag vertically to adjust the range.\nshift+click above the current max to change the max value but keep the min value\nshift+click below the current min to change the min value but keep the max value.\noption+click and drag vertically inside the current range to change the size of the range.\nctrl(win)/cmd(apple) click and drag vertically to move the current range."
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
									"patching_rect" : [ 390.0, 7.0, 112.0, 22.0 ],
									"style" : "",
									"text" : "lfo module"
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
									"data" : [ 2615, "", "IBkSG0fBZn....PCIgDQRA...fF...PLHX....fMcxtm....DLmPIQEBHf.B7g.YHB..I3dRDEDU3wY6atGbSUkGG+y8lzWIoMMM88CJPsXaApEqHuqsPkGh6J1YWkwG3phKJt.pKnqnvhJ3Rk0c.lt63SVVgEbGvsfnhVjcAbApBhUfAJR4Yg9toMMMoooI2r+Qg.Y6CHookrL4yL2I2bN2yue+N46bdL+N2HbhSbB63lrwMtQzLkY3tM2GcCy8NG..HX2tc6.r5u6L2PCHe3LWVfj6pMbdiXfd7fomv8M2Ex3e3YdiNL50P7Fc.3itGWdDj2Ls0pEZrlJvTSMA1c6kVccDDPQHpIzHiA+BveOpouoQfrZwBUe1xnoZpFiMoG61s0m4aAQ4DjRUXtYCD8.GjGUjtoQfZn5JQeMUgEylQabIfL48ccMqs0FMqqNLTWsDnJUDQB82iYaO5ZPqbkqjUu5U2o0UbwEic616vknX6gfBEJXUqZUX1rYra2NaYKagINwIdc6ayFZBSFLPHgGUep3.fb+7CUgENFMzDsXvfG018oaRXoKcojSN43zkjjDJTnfhJpHTpTICZPCBUpTQwEWLaZSahoO8oecYaIIIrKYE490t3Devc+zLQDhJFWZIQvAEfixTET.LwLtUBSUPtbeSte9gcIqXWRxkaa2ZWOp0tFb7ieb10t1UGJe9ye9HHHvLm4U1t7xW9xo3hKlO8S+T9rO6yn4la1k70vhPA.bACV5PcIFYXb2YbqrqiVFOR1Cm+5WWLJBvOd3ruS18QNIO4cOJ9fcreZn4VbsNXu.8oBTpolJYmc1N9dokVJUUUULgILAV6ZWaGd98rm8Pas0FidzilhJpHW1eckH0joVXi696wXqVH8Dik3zplADkV1YIkxwtP03mexXn8KV1ywNkK6SOM8oBTd4kGiabiyw2yO+7Y6ae6DQDQfNc55vyKIIQEUTAZznws8YmIRWdjwSb2ijvCQIa8aOBYlTBT5Eq4R0ah3STsa6SOI8oBzxV1xXCaXCcnb8502khfFMZn95quG42gEgBZwpMpuEm258Z1QwbO2QZj0fSBa1sinf..boO7JvqHSB6XG6fYLiNlz0bxIGToRE6ae6qGY+xMXwIwYrCNIhWan.vYppdBUUfnyfIznp8QagErJZvvM90efdAAJt3hiryNaGWYlYlWy1je94iZ0pofBJf3iOd.XpScprt0sNxO+7wjIStc7TtAKTRsN29SUYcLsQNTlzvRgwm9fX2GoLNvIOOiJkAvjFVJLhj6Ge2IOGQEZvLqIMF212dB7nSwUVYkQFYjAKYIKwQYm3DmfYMqYwgNzgn5pqtSamQiFYricrr3EuXV+5WuixmyblCEVXgtc7zYhC.UpSOE74eC.7U+PoNJ+c19+woxL2nAd2uZuts+8D3QEnBJn.JnfB5z5l8rmc21VCFLvBVvB7XwRWIN++FdEqA4QPP.AAYHYyJ.84hijMqHHHyiuCiaZDn.UpjfBNXLnqdjj56RTJzt3zrNcDnRkDnRUdTaeSSxRCMxnwrQinu1pn1yeN.OaJW5VrKfB0pIXsQflnh1iZ5aZDn.TnjnGPRD3kR6eeMApJXBMxnv+fT3QsqKKPS4olWe5YgcsX.oe6NtO.EJIp96ccj78TbYAZxybd8FwgO5BtoYSB2rhOAxKGeBjWN9DHub752lsAc0gxPCyw6tvko9JJmR14WvDdzY0mDGGe+6l8u0Ol9k1sQbImpi6ycFOsKaqtpO0YziGAEr+xveY8NGfhjjDK6AxEas0VGpSesUyA+xszq32NiO9MWHCLigyfG63c5dWktqO0YziFAMsaMZhKjfvtc6rsepZJuod1Ynb9ieXzWaMzuzRG0gGIW3DGkVLzDmpjCP7oLXzWS0HStbZp9ZPl7N+kBwrwlo9JJmPiLFNcIGfPhHJRLszup5tfCajbliBgqJ2Y1samydjCQyMniXSNEzFaB.vYO5OfQ8MPXQGGMVSUNtODsQfQ8MxI+9hI.EJH4LGIx86Jw0o+wChwFafXSNUzFa6GixU2mtka+Nc546LbaAJIMJIA0AwZKobFQ7ZXb8KL1vQunaYKIII9vW5own9Fo+CIC1zasHl9B+Cb9ieX.3fauPDDEXS4uHrCnPUvbuO6K0o1p5ycZV2heNBTYvz+gjAGd2EQV+xYPtO1yPUmoLV+RdAG1XNuy+.+CLP.vpkV4CdomAKsXh3RNU17ebIbuydAL7oLMJYmeAR1rwg95OGYxk63dDD4Sd6WigMgoPyM1.adE+dVvGsMBPgR9au5bowZqlDRYHT3JWJ+747xjw3mLGae6xQeJwAmdum.EkR+wnEaXvhUpzfYRKbUHJ.RtQVFN1d+2zPkWj4+QaCQQQFTlihydzRXxO4bX6u2J4Ae42jKdxiitppf23yKFkpCkS+iGrKsWi0TIu119DTpVCoM5rYa+kUPtO1y.fS13p4.e4Vwj9F34d+MinLYLp66A4O8D4wPyJWl17dE1agaj7d9EQHZifCuqhHumeQTxN+BRLsz49l6BQPPf8U3FoklahR+1ug5tv44EVy+DQYxXL2+Cwp90O.CMqIvD+UOqi9jeADPmE9NgaKPxEEw5kx4isKoJxEEvhMWWgJuzix.yX3NVzLswjCoMlbPxlyYkVaLw0geX6LTGYLnTc6uiCpBSKVa6JuvHckMpnrRIkQjEhxjA.wdKoPvgokZO+YHgTGZm5mglUtrqMtFd86+tH0QcWLzrxEMQEK68S96XTuNVyu6JmAlYiFPWEW.sw0uqY7e031BjU6RH6RyeKSr8Os5NCe.DEEcRLZq0VQecUSXQGmSOmfnrqa64DWUxC6JaHJJhMaNuvs01ZCAYcsO0Dcb7pa9ewoJ4.7SGXu7QK94IuWXwHHJRhCYXNsCuI+TyiPiJ1qq32o3xkawknNiVPk+xHX+kSLpBf5LYwsldCfAda2AkV7dn0VZ+P1Nv1KjMk+hPPTDAAAr1VqtaXdcSRYLbNxt+ZZ0jQ.3jGb+HYyFQ2+j5x1ry08tr0U+ljblijo9z+VFRV4htJJmAlwv4bG8GParwS7CJMDDD3Cew1EKWsO41ifNoNiL3lLyimQBXUp8cw4tj7cLJtsblLq3QuWBI7HwP80xLWw6gff.8Ksz4MxKG9Eu3q611+5gzydR7SGb+r7GZJDVLwgtJu.OxRdaj6eWuNwvum73O+adTd6GeZHJ19o49yl8KRHZCmLF+8va8HSkvhIdp9rmhoMuWwwZNWtOMu2eSDUhce126w+EHC1eYzpMI2Zsm+WLpuAZ0jIBMpXbLMkjMaX1jQBTgRGqOzahQ8MfYiFQc3QzshykQRRB80TI1sCZhNVm11tolzSKMa.Ugpg.Tn7Js45nO46+npWNWVf7kKNub7IPd43Sf7xwm.4kiOAxKGeBjWN9DHub7IPd43Sf7xwm.4kiiT83CuS9uNbIyjsp89V......IUjSD4pPfIH" ],
									"embed" : 1,
									"id" : "obj-4",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 59.0, 101.5, 99.0, 20.0 ],
									"yoffset" : -23.0
								}

							}
, 							{
								"box" : 								{
									"data" : [ 4037, "", "IBkSG0fBZn....PCIgDQRA...zI...POHX....vs5rFN....DLmPIQEBHf.B7g.YHB..OvWRDEDU3wY6ctGjaUceG+y8pqdbu5pm66GdY8aCXC1XrieDCFHlGkLPSgzRKoz+f1jokRKLvjjNkLooCsSSGx.kYHMTBzosyTRXRHcHiK3Zf.wIfcfr1d4kswXV6cWsuk1UuktR2a+C4Uf7pUVRqzJ4E84ezcz8btmuiN+z4247673JXXXX73+lOlFzfEC9q15xQrVKhF7YOZXz0fEcjp0BnphgNwNwQH9oONjVqfIUvhMrzwxQ4huRPPXQRfe1jkzFcwNwQH9od2hJsFIiShS+AHHYF40rQ.POVDhc79Pa7yfQ5zyMSBhXoydw1p1HlTT4u9yshJo7q63e4PmB.LhGEsOpezmZXPWetITPDwV6FodWOhx1mysywnqZ7i1rBsPXNcRTSDBGICh0zI.fXRxjPRl.xdIkX48eiDCdB.vw1tQj7zZASap.iSnC9Rj3LGC40rQziElPGbenGOx7mICcRN7oPa7gwwNtY.n+icb9NequE68m+BDOd7xR20SX1rY9R29Wlm6Y+uA.i3QH4geMLRDc9yjgN5icFRN0nXYyeg4X3MmZyat+JW2716kkm+EbN3Nd.ZNx3HfQNeubpXHmJFNRLMAs4loTZACJM2dFZIA.IOsxHezwwrMYZtqdxIMS4aPRDMBctp0kSdhd7Cid7H3sit4x18MfUk49O1DQCy6dfWgIG5zD+D8A.2z0ccL7vCUR5rdFMMsrFbS4aHbL8vXjHJtZsCV2Ntl482kSbnCPfQFhTmperboaOm6W6buZXPaQFAmIBB.1saGmNchhhBBBBDKVLBEJDACFDOw7i4TIXDmKqrKt.i5iW3I9m4q8nOMdZqyLe2X93odvuJ2x870yZzMKolHigyFt5qOu+vBfUEUV+ttNdsm8YPahgAfgGdH97W0UwS8u+eP6czQYq25E74aXtu64uf8uu8wO+I9tbG230B.qaGWCu7K7SACi7luuvsdabn+mmEc+iNm6UyL5ZJ1D3LQPLYxDs2d6HKKmy8kkkQVVFGNbvHiLBpZQnoniyTJE1M47wkryqAIKV3Iu+6lu1i9z.vSd+2Meo66gXsacmyI8FoxLvCa1UK3y0phZNoGf+0e3SujvfCfN6rKdrm36yktpUx6+FuFrmqB.rpXmW7G8eMu46l+C+SxbQ5Ty4dEkQWSl6hqw8WgexDe2RVz4CKoSh2X9wvvfN5nCrYy17lVYYYZu81wmOe3Id.BZyCZhlKqxcMaYm76c+ODe+68t.fa+A+N40fagR2cW9sHWORmc1E.jHZA5eaIv40nS.Atq1dX1lqashYz4Lwz.fKWtJnA2rnnnfppJgCGFWwmlIUZorK6V5Y4jVKSqRsdQKureNM.to63OddcuVHJnQmWoN3ue4uH8ZaCDQelxVbmKJIy7OFU0B655SiKWtHb3vXWKLSR4YzEXLe7j2+cyevey+HBBj0U6r8wqAkF27cbWkU9J3PUkM4f9B++wSMxCTVO74CyoyLBwhoUtYwpUq4j2RkYM3lsOby5p8Iu+6l.i4qrdlMn7nfFcCm3D7Li70wv37G5iRgYC7gPID4+rosLZNGfScz2la8d+l4zGt0rkcxsdueSN0Qdqx5Y1fxiZxnWSIZBy5oPSSCKVrTT4IYxjmMuE+fHDjLiQJMRGdZ170eK4MMW71uZ.Hc3LcePvzR5IootfZxuvwLqf4DAIXvfzbyMWT4ITnP.PTyJEc4XoqUPhSebBdfWnnyi41unhNsMn7nnl9gI0Fh2OxuphUnyX0clOmYlrsfUHzzzxZzEzl6htbjW6UhktWEHZ57mXAQr1yZP4R1ZQ+7aP4QQ0R2aD744MB97UrBMtYEBY0INRDjQFYD5ryNwr4761Lc5z3ymORmNMgsnRbI47lt7gfISXeC6.6aXGUJo2fJ.0rNvLl81wlVTPSiAGbPb61M1saO6nTSjHAgBEhYlYFLLLHonYF29Rin7+YcpYFcFBhLnqdoiv9PVKJ986G+98m2zF0rBin1E5Eiax5.d7W9kJoz+c+Gd3rW+M9aenJsbp6nlNTszhRLjydPVKJtRLMV0hgE8LyVPZAQhXwAgsnRDKNpkxrjYj.ANuo4fu4aj850roMk85e1+6dAfss8ktcIXNFcEyxQpRSLyJDqDFUZ8Ne4s74J38eru2iv4a1YG9Wd.tuG3AqbhZAxOnB9rxwnqXVvkMXgwi88djRNs0SFeUBlSKcwiDlYlXbhGNTsPOff.JNbhcOdPwgqpp1jrZCGd8hpmlPTr5uGkJECtyMeKkL7xwnalIFioFZHBO8jDORzxdJmVnXSUEU2MQy8zCNapkpl1LawJQl1CNadFZq2UVRSKWoR4ZvsTjrFcwBGloFdP7OpOjUcPK8zBh0fQKpmNMQCNCS4aP.vrEaffPUQawhDhfSNI5oRijEqzbWUm0AWkvfaoTqcY8oDbxwIb.+H6vIpd7VSL3.PzjIT83EEmtH7zSRX+SV0zlrcG3os1Ij+oHr+IIcp4tJWWnTIagaoRqkYM5RDMBIiFAY05ivSn3zEIhFk3QBWU0ljEqX1pURFONIhVfc3TYP0vHYofgWV2qF55nqafIoxOzcekcuEdw9dOlJ3BuxSzjILzMP+r6qxEp1JDBhhXjNMF54YusBr2ez+471Gxr6EfygpowwE5tZWP0hdUkwiCEFKPXBGOA6+HGiYhDm1c6fIBFgdayCi5ODQRjYR8UkshWUENyDm+fmVrLz60GpM0Fiex2mVVwZwSmY1hgidh2inS6mtV+UfUE6Lz60GlsHidZM5XcWVIUFE0FPoAEMkcbBZ0kJ29N2Dp1rwe9MsSrYVh8rw0gK61352zEyct6Myp6rUtmu3tvjnHadUKi6XWWAWb2swe10ucjLUYBQwf8+aw2w5G2ctLN7deNLz0o+W5mR7vAQs4V3f+3mhjwhxPuyukYFaHrLOamvJIKEbAVMoraoSU1JRhhjTKEOxO6U4bc9r+ibBFw+LzpKUbpXkcu9Uwde62CszooYm1Y0c1Bevfis.kOf.rpssarXSF4eyAHkVR7Oz.bY23sA.SMz.3evOFCfKZSaCq1K89EVta.kpIWH6hsrM5N0nSwy+lGkMtht4124F4Yd4Cky8Sd1cbkgNHJHfISlP6rmGHG7DCv3SGdAH6bIm.6ZXfnISep6YBAgL22j4haUJetTta.kpMWnZ3U193txU2CabEcyK02GP+CLLdrW3041jACinfHmYho4pW+poIGUG2bBhhX2aqLvgeSF+TGC+CM.M0yR2sZ3EhtxKaiti9wCSRsTbCaZcLc337tmYD5efgIZhTbzOdHhjHSKc8OvvDIgF+3eYerrlcy0tgUy6O3nLv34eYLUpbIW6WDwyNp1Yudy25eDNZp0yd8chjUa4jt7gffPUcFIplbglg2mTKHH.BBXnqiPQLOjZoRyq9NeXNeW+CjYq7czA9jsz2m95Ws+bSegvPWOqlLIIgnjDZZIw743hzUqcj2qapmUNuo6bIsVJDkLcA8lxoZ5psRaTm05xprLVrYqhczArPIdjHXwlLVrZCYGNQV0AQ7OEFU3NzGM3L.FXU1NVUV5r7ppTTMZEM6ess61Kpd7RfwFACiLS5dsxcSzfyPjoCfm16.GM0LVUTIxzSyziNLSMzfXyt8JxokoVhDjNUR7zVW3t8NWTVoIUSpzs1Usbam0nyg2lHQrLyjP3.AH3jiWUJvhAKxJ3ts1wYKsgpGu.Pa8tbDMIRhHgIdzJypLQVUEqpNvaGchCuMsfedKknZ1Owb5DSycsLrJqfc29IYrJ67PVJHY0FtZtUT83I62YUwNcu1KgnglgjQiUQJGQSlPwkKjJyPoTORkn0tp8.SxZzokHISOtOhFL3hafPEDPwoKb2ZGX1pkr5XJeCxTCelpdwGXTe4UGWHS8d76j.HUxjL1.mjfiOFQBNCFF4ehuqFHHJgrcUhGNDM28xYJemtlqi1WwZVzJ2pEkqg2hQ3Wj.HvXivLiOJIiGml5ZYUsUyQ9HklFg8OIglbBhENHZwiWy0gMU0kDG67k5drXwJdeR.DOTPhFJDd6n6E0JZ.jLaFUuMi+QFFgPfATy0gZnPrPV4dCZt9Z+49.O9idd2RiG7MeCXQR2R.nqqigdJjLmohtaGVXnPy+YLhCYqr801Ku0IOCABmam5UksRatybXGpkRunVFSRlMigdJLLD.AiJhNJGxpi78tQnD3DG9vKXsToYVMctal6O8F8dwh71bxlZISPRyWEtWUYtycuUd824C4OcOame39eybpv25p6gVc4f.giR3DIWPqctEhNpkD8PucsVByKe6a42sVKg4uqKyWE9UrxkwKeziwGL3XXwrIVeOcxAd+OJ686tYOru99.D.Fc5E9VErb0QCpeofgfeSsnP2NxM7AdUsSnnYdq1DHbT75H2UWRmdcwk2amrqKckb663xqHhrbzQCpe471a8M0hBwRklohkI7E5F5HHlYJnDDElyawl+oex9yd8876rKbHakPwRrfEZopiFT+x4cxFGLTxrUz.LUnn3UMiKOup1IPnOYlKrZVha6bZcqRM+skhNZP8MEznavPI4HSjak4acxyv1W2x4F1z5XqqtGdqO7zztaG7UugcPBsTXRPfaaGWN+96bib5ICPvnK7WJakpNZP8Myq607UQCP3XI3G7hYNJX22gOFPlAL7usuLG8UO2u9HUTAVt5nA0uj2V5luJ5Eapo53rmh.ZIJb+QSc1yLYAS0WADtdlLFcBBHHXB8y9xCawthVOcJDDLUWoCydy7hu6XG70IkV9CPcpjI4XG5..fI2k2KJuKjv7YOZdWnHAfM61Q1gCB4eJbzTyKpmiI5oSQX+9wlc6XxrEzSmplqCa1UwVWchl+ww2IOF9N4wJXdEjrfx517hjRqcrhKeKXHHhfgNoRlDoB7N.YVO.jmEFqD.taschGIByLwnLwYNMvh3owog.JtbgilZAuczI9GwWMWGdZqcjjUvw1tQhc79Hk+Qm2k6kTychxZ1Dlb5cwSq0Htk+xuAlhOI5AFmS91+ZV0V1YdWKhoRljOpuCB.htl66wMIHyBjr8kuRrc1k1yhM1Tcf6VaCqJ1whM4ZtNrHmITLRtZBGacOkzy3UNvuhG9u6ayq+K9EYOGVtPmqaO6gWY+6mtW6khdP+jblWiwG3jL9.mrvYzjYjVwFlyWmczqVUrSa8thJtfKUpWzQ4x0sqOesVBUbdk8+IA7WzoWLuwcS5O9cIcfwl2PxK5scj58RQzgm4bukBKar5F9rxY1rImdwzkeUkc9uvd6O0fKHogQWCVz4+GZbKcFYHrcHN.....IUjSD4pPfIH" ],
									"embed" : 1,
									"id" : "obj-5",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 127.5, 296.5, 157.0, 61.0 ]
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
									"destination" : [ "obj-23", 0 ],
									"source" : [ "obj-24", 0 ]
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
									"destination" : [ "obj-43", 0 ],
									"source" : [ "obj-44", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-45", 0 ],
									"source" : [ "obj-46", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-47", 0 ],
									"source" : [ "obj-48", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-53", 0 ],
									"source" : [ "obj-55", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-57", 0 ],
									"source" : [ "obj-59", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-69", 0 ],
									"source" : [ "obj-70", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-71", 0 ],
									"source" : [ "obj-72", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-73", 0 ],
									"source" : [ "obj-74", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-75", 0 ],
									"source" : [ "obj-76", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-77", 0 ],
									"source" : [ "obj-78", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-79", 0 ],
									"source" : [ "obj-80", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-81", 0 ],
									"source" : [ "obj-82", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 360.0, 457.0, 29.0, 20.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p lfo"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-46",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 361.0, 435.0, 46.0, 20.0 ],
					"style" : "",
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-11",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 274.0, 265.0, 24.0, 22.0 ],
					"style" : "",
					"text" : "t 0"
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
					"patching_rect" : [ 274.0, 236.0, 37.0, 22.0 ],
					"style" : "",
					"text" : "r lfob"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-6",
					"linecount" : 2,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 339.0, 300.0, 92.0, 33.0 ],
					"presentation" : 1,
					"presentation_linecount" : 2,
					"presentation_rect" : [ 280.0, 12.0, 46.0, 33.0 ],
					"style" : "",
					"text" : "ctrl nr \noffset"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 284.0, 329.0, 72.0, 22.0 ],
					"style" : "",
					"text" : "s ctrl_offset"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "control number offset",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-194",
					"maxclass" : "number",
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"outputonclick" : 1,
					"parameter_enable" : 0,
					"patching_rect" : [ 284.0, 300.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 283.666016, 44.0, 35.0, 20.0 ],
					"prototypename" : "vpt_int2",
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"varname" : "ctrl_offset"
				}

			}
, 			{
				"box" : 				{
					"args" : [ 10 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-32",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomix-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 259.0, 123.5, 98.0, 103.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 172.0, 309.0, 100.0, 102.0 ],
					"varname" : "lfomix4",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 9 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-31",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomix-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 161.0, 123.5, 98.0, 103.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 172.0, 206.0, 100.0, 102.0 ],
					"varname" : "lfomix3",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 8 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-30",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomix-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 259.0, 21.0, 98.0, 103.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 172.0, 103.0, 100.0, 102.0 ],
					"varname" : "lfomix2",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 7 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-27",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomix-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 161.0, 21.0, 98.0, 103.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 172.0, 0.0, 100.0, 102.0 ],
					"varname" : "lfomix1",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 4 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-24",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomodule-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 0.0, 206.0, 155.0, 61.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 209.529556, 157.0, 64.0 ],
					"varname" : "lfo4",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 3 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-26",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomodule-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 0.0, 139.5, 155.0, 61.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 140.686371, 157.0, 64.0 ],
					"varname" : "lfo3",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 6 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-21",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomodule-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 0.0, 335.0, 155.0, 67.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 347.215942, 157.0, 64.0 ],
					"varname" : "lfo6",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 2 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-22",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomodule-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 0.0, 84.0, 155.0, 61.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 71.843185, 157.0, 64.0 ],
					"varname" : "lfo2",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 5 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-20",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomodule-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 0.0, 267.0, 155.0, 67.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 278.372742, 157.0, 64.0 ],
					"varname" : "lfo5",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ 1 ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-19",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "lfomodule-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 0.0, 21.0, 155.0, 61.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 3.0, 157.0, 64.0 ],
					"varname" : "lfo1",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-14",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 221.0, 600.0, 24.0, 22.0 ],
					"style" : "",
					"text" : "t 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 221.0, 574.0, 36.0, 22.0 ],
					"style" : "",
					"text" : "sel 8"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-9",
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 149.0, 590.0, 50.0, 22.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-15",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 149.0, 558.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "+ 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-16",
					"maxclass" : "newobj",
					"numinlets" : 5,
					"numoutlets" : 4,
					"outlettype" : [ "int", "", "", "int" ],
					"patching_rect" : [ 149.0, 533.0, 73.0, 22.0 ],
					"style" : "",
					"text" : "counter 7"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-28",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 149.0, 481.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-29",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 149.0, 507.0, 65.0, 22.0 ],
					"style" : "",
					"text" : "metro 100"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-17",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 45.0, 628.0, 220.0, 22.0 ],
					"style" : "",
					"text" : "sprintf script sendbox lfo%d replace %s"
				}

			}
, 			{
				"box" : 				{
					"border" : 1.0,
					"id" : "obj-44",
					"ignoreclick" : 1,
					"maxclass" : "dropfile",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 260.0, 467.0, 51.0, 35.0 ],
					"rounded" : 0.0
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-18",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 45.0, 664.0, 61.0, 19.0 ],
					"save" : [ "#N", "thispatcher", ";", "#Q", "end", ";" ],
					"style" : "",
					"text" : "thispatcher"
				}

			}
, 			{
				"box" : 				{
					"angle" : 0.0,
					"background" : 1,
					"bgcolor" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"id" : "obj-12",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 161.0, 246.0, 47.0, 37.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 0.0, 0.0, 328.0, 418.0 ],
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
					"id" : "obj-3",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 220.0, 246.0, 45.0, 39.0 ],
					"proportion" : 0.39,
					"rounded" : 0,
					"style" : ""
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-11", 0 ],
					"source" : [ "obj-10", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-13", 0 ],
					"source" : [ "obj-101", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-194", 0 ],
					"source" : [ "obj-11", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-46", 0 ],
					"source" : [ "obj-13", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-28", 0 ],
					"midpoints" : [ 230.5, 623.0, 249.0, 623.0, 249.0, 471.0, 158.5, 471.0 ],
					"source" : [ "obj-14", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-8", 0 ],
					"order" : 0,
					"source" : [ "obj-15", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"order" : 1,
					"source" : [ "obj-15", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-15", 0 ],
					"source" : [ "obj-16", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-18", 0 ],
					"source" : [ "obj-17", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-4", 0 ],
					"source" : [ "obj-194", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-25", 0 ],
					"source" : [ "obj-23", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"source" : [ "obj-28", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-16", 0 ],
					"source" : [ "obj-29", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-17", 1 ],
					"source" : [ "obj-44", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-45", 0 ],
					"source" : [ "obj-46", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-14", 0 ],
					"source" : [ "obj-8", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-17", 0 ],
					"source" : [ "obj-9", 0 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
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
				"name" : "o.route.mxo",
				"type" : "iLaX"
			}
 ],
		"autosave" : 0
	}

}
