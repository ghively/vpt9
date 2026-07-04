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
		"rect" : [ 384.0, 67.0, 361.0, 427.0 ],
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
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-46",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 382.0, 33.0, 24.0, 20.0 ],
					"style" : "",
					"text" : "t 1"
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
					"outlettype" : [ "" ],
					"patching_rect" : [ 1171.0, 215.0, 102.0, 20.0 ],
					"style" : "",
					"text" : "prepend /cliptime"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-37",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1171.0, 190.0, 59.0, 20.0 ],
					"style" : "",
					"text" : "r cliptime"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-13",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1141.0, 155.0, 115.0, 20.0 ],
					"style" : "",
					"text" : "prepend /loopreport"
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
					"patching_rect" : [ 537.0, 528.0, 93.0, 20.0 ],
					"style" : "",
					"text" : "print osc-extout"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-59",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 235.0, 545.0, 54.0, 20.0 ],
					"style" : "",
					"text" : "gate 1 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-75",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 5.0, 284.0, 33.0, 20.0 ],
					"style" : "",
					"text" : "t b s"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-80",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 93.0, 379.0, 65.0, 20.0 ],
					"style" : "",
					"text" : "s osc-textf"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-77",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 230.0, 232.0, 65.0, 20.0 ],
					"style" : "",
					"text" : "s osc-linef"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-55",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 13.0, 306.0, 74.0, 20.0 ],
					"style" : "",
					"text" : "prepend set"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-49",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 5.0, 241.0, 60.0, 20.0 ],
					"style" : "",
					"text" : "r osc-text"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-53",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 69.0, 173.0, 150.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 37.0, 154.0, 137.0, 20.0 ],
					"style" : "",
					"text" : "custom OSC messages"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-71",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 729.0, 275.0, 33.0, 16.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-72",
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
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-19",
									"linecount" : 3,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 354.0, 536.0, 295.0, 48.0 ],
									"style" : "",
									"text" : "A list of available OSC commands will be available online from the manual pages, but you can figure out most of them by looking at the menus in the router."
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-18",
									"linecount" : 5,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 355.0, 406.0, 292.0, 75.0 ],
									"style" : "",
									"text" : "To receive OSC from VPT the sender needs to know the ip adress of the computer VPT is running on. You can find the ip adress by clicking on the ip check button.\nThe port number is 6666."
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-11",
									"linecount" : 21,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 355.0, 85.0, 502.0, 296.0 ],
									"style" : "",
									"text" : "OSC (Open Sound Control) is a standard for formatting messages for cross-application and network communication.\nThere are many applications supporting this, enabling control of VPT from for instance maxmsp, PD, processing etc. It also gives the possibillity of remote controlling VPT from another computer.\nOSC is also the basis of internal messages in VPT, the control router is based on mapping different external or internal controllers to different OSC messages.\n\nTo send OSC from VPT to another application/computer you need to know the ip adress of the receiver (on the same computer this is usually 127.0.0.1) as well as give it a port number which the receiver end must be listening to.\n\nosc formatting:\n/destination/parameter value\n\nto set layer1 fade to 1.:\n/layer1/fade 1.\n\nto set the center y value of the avignette fx in layer5 to .7:\n\n/layer5/avig/y .7\n"
								}

							}
, 							{
								"box" : 								{
									"data" : [ 8249, "", "IBkSG0fBZn....PCIgDQRA...jN....dHX....vEMTcA....DLmPIQEBHf.B7g.YHB..e.eRDEDU3wY6ceFPTbs1.G++NK6RuifTTrGDUrKfEhFMZTzXIIZtFMIlD0zslpZhlpF0DS7MWShkzz30VHpQwRTvRDKXGUrAJRW5vtrrvt66GHtBRwBHNFO+9D6LmyLm4r6ydlYX1mihu9.wYBAAAYKo60M.AAgpmHHUPPlSDjJHHyYw85Fv0zEub5dcS3AZGL4btW2DDpBhQREDj4DAoBBxbhfTAAYNQPpffLmr4FGcizWTQ7e+7YUtkYoUVg+sui7v8KzZ88W5ojDgu1Uwy8FStJKyFV4uxC05.3gZSaq01uwetX4OW0JH4qj.VaqszyGafDR+Ff40qI+7Xc+xx3rwbbTJoj.5RPLjQ9bXgJUlKSxIbYBa4+HID2EwdGcjAOxmi1zwNWq0FEt2R1NRZwEqmUszuCeZTio492ZZt+sFmbwMl8aOQVyO9C056OCFLhlBxuZKSgZ0PwEquVaedvcGAieX8GqrwVFzSOJ5Xvcmu4imNexTdcykYpiYjD6INFORnClt229y19i0xGMoW07526esUdoA2WbvImYDu33wu.ZGS84eZ13pVdsV6T3dKY6HoWSed7ggSt3p4WqxR0rsvVCO0XFG.jSVYxINzAvJqslN1sPPoRklK6YN9QIizRkV111iadTeyK+DG5.jSVYRy8u03YCZH.3nyNSO6+.I2ryhTtRB3W.syb4O2oNIt6oWzot8v3ratglBxmjS3x3gWdywNPT3V8qO921NXt7FMZjicf8gtBKj11kf3Rm+rzp12oxcbUjNcLqI9JLs4++UtyLnG8s+7L8oa726XazhV0FNYzGfHuPJXgEk9VUW5QOYTOZ2QS94gEpTym+1Sf2aNKfdz29C.cH3ti602K9g48YLvg+LnPghZ76AB2aIaGIspbwybJb105A.m7vGhmseOLQE4eQXK+m3UepARQ5JDiFMxa+hOCKXVuOG6.6iwDZuIpH9KLYxDS+UeA91Oelb38sGd8mdvDwl2..jvEu.y7MeYLTRI7ZiXvnI+7.fhzUHu9HFLEqWOKZNeDQu2cwku34YZu7XXBOySvA2Sj7Nu3n4W91E..EqWOuwSOD9kucArqs7mL9g1elwq8RU333v6aOnRkpJbp6N3jyz+mXDrkeeU3jKthyt4N+eexGPBwcA.vIWbk+7vmAas2ANRT6EEJTXN.8ZBoeCfku88JBP+WBY+Hou9HFLRRk9cIZJHer0N64y99eB.l86LAlxmLGyePe5u5KvZ+4khuMoYjZhWgeJ7HQRRhN1sPHliDMEpUCIc4KwR1v1QoRkLzQ87L9gM.5wid8Oj6R8bmN10tSjg+mD5vGI6dqgSq6Pmnd02yx0tRK4jXCGJFbzYWnqOxixhl8Gwy9ZSjsu90gjRkrfkuV.Xi+ueke7aleENtxHsTwcO8pROlaPiaBGc++MpTqlE9+Biu4ilNOSe5F16fiDTO6MO6qOIZTyZAYjdp3oOMnF2GKHuI6CRm7GMar0dGX+QtCBecqhOYQKCeZTSnX85I9ycVB6W+Q17pWI.j3kiCkJsfB0ng11kfMGb20G4QKMPZNeL4jUl79i64Lu80jedjRhITt8YnCejrtedoD5vGIaMrUSnCejUnc4tmdgiN6B.3rqtQw5K8ZUO8wNBsOntZtbcH3dToAopTqF85q7qusPsZwJqsA.ZTyZAe4urZzpo.N6IONaMr0vK83OJqbm6GarwNzpQysbeov8mj8AoM4gZIN4hq7PsN.xK6r3cG6n4G2TDlu1ym80lH14filKu8N3Hg+6qBCFJw7xJRmNxHsTQRgDstCchQ+pSz75dwI+N3tmdS74Gq4k0sGouL22epb9SGCm93GkO66+4JztJ609BfISk9K9SkkpoHc5Lub8EoiJS6BrqL62YRjY5ogqt6Q4V2g16tnMcrKrqs7mbzCDES7C+TrwV6n8A0MZePci3O+Y4HQsWZePckqD+EIqLtJt3V8LW+rtZ5L9gM.9wMsSryAGp5NWg6Kbe00jN92d5XznIV1WOWrPkJZU66Hm6TmjVzp1PKZUaX4K5aXWacSz1NGDGXW6jB0V5nLa42WMy88mJsMvfHliDMd0.eoEspMnPgBd2wN5JrerPkJdzAOL9jo757HC3wQskVdK2F6Vu6G6Xi+A4jUlXxjIV2urrJsbd5SCnuC4I48F+yQd4T5yMqISl329gukScjn4odgwguMs4r9U7yr6stYy06xW77b4KbdZVKaEt6o2zi91e9ro9Fjet4B.5JTKy9cmD91zlIBP+WBY+HokkZKsj24ymOS3YdB58.GBSadKjoNlQxN2z5QS94iiN6Bg9TiD6czQ5Y+GDO2i0Sb0cOHqqlNyYoKmF0rVviD5fYz8qG3oOMjKewyyaNiOFKsxpJruF3veF9eKdQ7ty9qtsZicpagPnC++vHd3tf01XC92tNhjjxJsru8mMO9t47w7z8JPbycOH+7xE2b2CVvJVGN6pa3rqtw6M2ul47dSlY+NSDqrwFzje9L92ZZzT+7G.d2Yu.9h2exL3tzZZPiaBolThzttDLevBVzseGrfrjB4RlY3N8WAiQiFIsjSBkJkvcO8tbqK2ryBsZzfGd4s4qOEf7xIGzjed3nKtfM1ZWMpceitz4OKEjedz5NT5CSv9ibGrjubNrjMrsprNEpUC4jYln1RKqvo9BfACFHizREiFLfadTeToVcEJStYmEZKn.r0d6wAmb91tcK9UvHece0HoUFIIop7Nb5nytX9l6TVN3jS3fS2c9owUbwEy6Mtmim80lHpTaIqZoeGO8K8JUacr1FawZarsJWuRkJwCu7tJWOT0GqB2+699QRkiN+oig8r8vASlHfNGDcpagbutIcSIFIU9599QRkit1iwnfPsg6qt6tBBOHRDjJHHyIaNcWw0DIHT4DijJHHyIBREDj4DAoBBxbhfTAAYNQPpffLmHHUPPlSDjJHHyIBREDj4DAoBBxb2zm3nIDXSpKZG2080GHtJc4kjc5n6BmfhyH453VzcHERn1CePkWME0dT8Igr66N1pKcazOdu1sziE3jWZX2saG2U8ku3Pqzkq6hmjBO2QqiaM0PlLh9TS.8ol.F8qSXUi8uRK18kGa0ktE6GkCjMO6t00JNyTovyeLjjjnm8rmzktzEr71HWFcuhNc5Hpnhh8rm8PgwFMJs2YT4V4S2n2udrUW5VoeTt3A1qIU2EOIXxD8pW8hdzidH69P7t28tqzkakUVQu5UuHjPJ8GRdQW9LUnLx8is5R0j9Q4hGXCRMjaF.P6ae6uG2RpnMu4MyXG6XYSaZSUYYBJnf.fRxJsJrN47wVcoZZ+nbQsVPp0VpF+7w8aq5ztFW84smJS6apO210oxXpjhA.asspysPUmkrjkve7G+QsRaorRHgDXZSaZ.vzm9z4xW9xUZ4r5exvgW63nrppisu+6+d13F2n4Wu3EuXdpm5oXxSdxXznwxU1KdwKxDm3DYPCZPDUTQUg8wRVxRXDiXDLwINQLXvPEVeFYjAO+y+7lecbwEGSZRShAMnAwd26dqzioZS0F8ixE0ZAoEWRIjQd2dYS812rFvs6rURGZRsSPZko3hKlCbfCPwEW5aXomd5jc1YSLwDS4dSd1yd1DVX092LM850ya7FuAZ0pE.zpUKu4a9lTTQEUi1tFMZjO+y+b1vF1f4kEd3giJUpXMqYM3t6tSDQDQ4pyG9geHyctykEu3EyhVT4SOnaaaaCIIIV0pVEd6s2ryctyxs9CdvCxrl0rH8zS27xl4LmIyd1ylktzkx28ceWM534l4tU+38J0Z23Hmr0J5VKaLIlYtzol1PRLqbwBIX8GHFyko8M0GdHubGKTJw9hMd.n2ssE3kKNwotRJbr3Rh90A+PRRBiFMwli9TzC+aJ02Y6wZKUy1NRoW2fEJk3+ziNxec7yRJYmWsR6+rm8r7ge3GR26d24G9gefoMsowgNzgX0qd0zyd1S17l2Le0W8U3me9QHgDB93Ss+WVnQiFd+2+8qvx0pUaM95J6YO6Id400m6YhN5nY.Cnz4A0PBID1+92O8t28F.xKu7vBKr.UpTQ8qe8wfACnSmNyi5DczQyi9nOJ.zidzC1yd1i4WCfCN3.yZVyhwMtwY93xfACXokVh6t6NRRRnQil63yh4l4tY+38B2Ut6tGNtqPzmOAFVvsE2bvVyiv1ol1.Vx1iBIER3hckNWmrmSGGlLYhmNjNfBEfIfybkTn8M1GZrGtf+MvC99stOrRkEXskpPojDipmchvO7YHsbp94SzaGqYMqgd26dS.AD.Vas0rt0sNZXCaHCbfCjwLlwfat4FwDSL3me9QW6ZWIt3p7+uq0DN6ryDXfAVquckjjH3fClyctyYdYEUTQl+.qZ0pQSYlSYzoSGpKSt8UkJUTXgEZNHUmNcUYcAvO+7qbutr6qqUGsZ0dWKH8tU+38J2UBR0VXoSDQZKROVUlYjZIERXxDXvjQrPYomos9hKAIIEHoPA1akUTntROkjiFWhb0bu9a9EavH1KoDkRRjR14SK8w8Z0fzrxJKZYKaI.z5V2ZpW8pGG5PGx7GjTpTYEttsZaIkTRjXhIVgk6s2dWqOxsc1Ym4fqabTMas01xE3ciq+Fqqc1U8IXbqs1ZJrvBqxsWss5x9w5B2UBR6TKZ.Eaz.MvMmXaG852Z6Lxq.5Tya.1nRckN2YFahow.6bqHwrxkP6TqXE6JZJr3RH.e8Bub0QRI67PeIkvVOxYXr8MXNwkRlrJnvJrctSzl1zFRHgD3Idhmfu8a+VTpTIN67selfulvBKrfILgIP1Yms4k4ryNeW4FT08t2chHhHHv.CjHiLR5e+6OYkUVr6cuaFxPFBpUqlzSOcLZzHN3fCnVsZ1xV1BADP.zidzChHhHH3fClHiLR5Se5CYmc1DYjQxPGZEevQr1ZqwVaskzRKMTnPAVYkUXiM1TqeLcM0k8i0Ep0BRyQiN96yDO95tKDahoiQSFYIaOJLUlTu85h53zTOckTzmOIkYNb1jRCS.FLZx7ouF19ONNZq0rz+Z+TPgEwJhLZZjGNywhKQRMm7I8+Yzy+2dNh4QiqML5QOZVyZVCKbgKD0pUynF0nH93i27WlzpV0pxU9.BHfxcJg0F7vCOXtyct7Ruz0mzg+hu3Kn90u9USst00t10NymxZ26d2I4jSlEtvEhe94GcoKcgrxJKykcVyZVrpUsJfRu6nkUvAGLIlXhrvEtPZdyaNAGbvkKf3ZF9vGt4+dlyblr5UuZ.XFyXF0JGOUk618i00toYv9IDXStsdr.ag2tiAiF3hojYMtwUa4KewgVgmc2b11JvjACLsoMMyS08xEye9yme3G9AF6XGKScpSsRKSIkTBe5m9ofBIb9wFU4Vmb9XqtTMseTtnV+cvykT527BICnzAWojrSmXiMVZcqkWYa9INwRm+TmvDlPUVlScpSA.JsuhSOGx4is5R0z9Q4hGXehiT6Sy.fMrgMvINwItqeSgtcnToRlxTlRUNJ3QNxQH7vCG.rpQsrBqWNerUWpl1OJW7.64BYoOMiRxJMzmzEIrvB6txCmvcap8pwn16lVgk+ugis5RUU+nbwsTPZU8S859c1FP2vBmpGEk34wPtxmqg9lQxNmvplzZrz6p92568qGa0ktU5GkCjMS8gBBBUtGXulTAg6WHBREDj4DAoBBxbhfTAAYNQPpffLmHHUPPlSDjJHHyIBREDj4DAoBBxbhfTAAYNQPpffLmHHUPPlSDjJHHycK8SUa6+zhnEcoa3q+ATtkm34NMm6f+Mc+IGE+4+cdkacN3V8nc8d.3l2Mj8E1JI03uPktsC8kmLVZycuLGWcgnV+pvmGpUz.+jOYAgbyHcbzsa9LJPJW7rbvM86nPoR5T+db7pY9cSWmgRJl8E1+iLR7R3tuMgfd7Qfx+4GVc0s8DtybKMRp17ykH+skVgkG4usTzoUCEWTQrqU8i3fqtgKd4Mt3k2jZ7Wf4+7ClbROEryEWMu7Ct40gQiFL+ZER2+OXt9B0hAYzzTPD+1RYWq5mtokKwycZ9tI8h3UyaIt2vFy+2qMJt5UtzMccq3idKh63Qi+c6Q3j69uXsy8Cuo0Q3N2szHoA83Cm48rCBcZJ.qrszbrpNMEvI1014c+svMWttNrmAar2AyudAia3brcFN87oeAyKKhUrTZ2izeZVGp7jWrISl3Rm7HTP1YgWM2Ob0qqOAupI2b37Gd+XoM1Py6XPXgpqms9R3LmfbuZ5zP+CnBifnSSAjYxIhRKrf7xLcZdGCFEJTPbGOZzjS13UyaIt5U4yGqU01qxpSK5bWwNmckqblShKd4C15XooBTs4mGYj3kngsLfprt2X6LijR.GbsdjvoOAd3aSndMrw2z9ljuPr3X87f3OwQvEuZ.IctSiQiFH8DhG2aXiI9SbXb22lhsNV973yl+t4y.ekoRm6+P.fRzWD4m4UodMnQU45Jrf73Jm4j7dqZ6HIIQ8abyHxUtra51S3Nmx9O1ILyaVgryIm4LQsKTYok3SKJcxVM5stdzoo.B4odVJtHcrie86oOO6Kipxjox2WX+F97PsobmlbjqbYz1d0ObwyJ9gzRzWDK9sFGmIpcQwEoiM7+MGryYWw6l6GomP7rfw9TXss1xkO0wYie6WPfC7IQxBKXIu834DQtMLYz.+97mEdznlUtOXj34NM+xLdSN712HwerCQGergvxm4j43QtMJoX8roEMObzcOo9MtYXznwJc64lO9xOO82rRqyJ+z2EKs1ZN0eGAWI1XnEctq.PD+1R3hG8f3eW6UUV2xJoKDKK6cdYN0d2IprxZ1zhlGprzJZfestZ6aVwG8Vr209qD+IOBZyOWtzIOB4mUF3rGdh2svel+yOXZXKCnBAKqZ1yf9O1IvA9y0vEN79oMObew6+482pZcGY6+I13fiXgZKY+aX0nuvBoWi7EQgBEU61S3N2sbNNJnGe3D8V9CBbfOI.bv+bsDxHFS4JyN90uCKTUZP5kO0wH2qlNc3QC8Vtwbnsrdzla1LwEuVjTpjfG7H3KeggQaBoOD692M95e.L3278QgBEruvVIEVPdbgib.xNkjXp+xFQRRhVzwf4RwbL7uq8rba6rRMY93Mser0Qm3X6LbxHwDXxK62QRoR51PGIe83FNsIjdyYhZ2U51SutBqx5bMANvmjk9NuBg9xSAEJTPza4O3Y9f4wwiXKUYcUZgpx0N0jS1Lke7OvdWbiN8XClubLCgN2+gTs8M.zhtzMFxaV57exl99uDCkTBcIzm..9jvOTE5qMTRITj1B329n2hN1uGGcZJfubLCkIsz0gKd5SUtNs4kCmNpcglbygGJvtSjqbYboSdDF5jlQUVGwHo0L2xAosuOgRXK3SHmzSkRzWDomP7k6Cn2H+6Vu3Y9f4Z9T+tUj7EhE+BLDjTpD.7pY9g8t3JWMg3oMgzGhbkKiOZnOLsL3Gl1DRevYO7h8ug0PSZWmQ5et1V+6Vuv+t0qJrsc0SuMe5dIFaLnI2rXYu6qZd85zjOYkbhbkXioR2d+4+ctUYctFednVg01YOwehCiEpUiBER3aqZKmbWaqJqaYOc1qeL6F.3dCaLprxZtZhWtZ6a.tCtoUkl0b58yNdB3g6K.TP1YQTaX0D53mTUtNIIIrxV63Y+3EfBEJnkAEByZHgv.pl573u1aea11DJqa4fT0VYMsu2gxg21FnHsZoyCXXUXTfdO5WtbWS5sKIIILXn72.lRJtXTnTINWeuY5qcmbwicHN2g9a9kOXRLrI+AkNCrUl4GyhKpHxMizvMuaX41NJjTVl+VBeac6oOO6KadYO1Xm.N4gWU41q5pSYE3.eRN7VWORVnhtLvm3lt+tQlLU9TNUI50iEpTWs8Mk12ojaGJsPEVauC3R8u9bDqqd58+bs6U85peiaFNWeuLmY+crddfBIETrd8UYcDpYtst0pAM3Qvw1wl4naeiD7fGQsdioosqybxc8WTj1RmLfNezQgQCFn9Mporie86Y8eymQy6XPD5KOEZcH8grR9Jzj11Ihc+6lhJrz4hxCEdXrl4T8SiAMocclKGyQwUu7AeZg+nPgBV5aWZ.TUs8pt5TVc7wFLwr2H3DQtM5b+G5Mc+ciR57m17cDM1CrWr1N6wUuaX012biTnPBC5u9bwYJwcNzoofJTtV28dSzaoz4GEiFLvY1+toIsqyU65ZYW6IwcrnImzSE.N2g9abxCuvAWqW0t8Dtycak2c80+.nD85wdWqGteCmlVsg.5Y+3bQGEydj8GW7zaxJkDYTyb9XgZKoyCXX7su9nY9iYHHIoDiFJgA8puMN3paz1d8XL2QOPbvM2I+LuJuzb+gpc+zxfBg18HCfuXTghKd5CocoKxPlvzPkkVRy6TvU51yiF0zprNkkcN4B95eanD85wAWq2Mc+cirxV64W9fIhZqsgLRLAF8LmORRRUaeyMpgsrM7SS60QuNcLh26S4aesmgQNi4VgqSeHS3846m7Kx7e9Aidc5nA90Z5X+d7pccRRRLvWYJ7Uu3SfaMvWxNkjXTe37PgBEU61S3NmrLkdpI2rQmFM3na0qbeHznQija5ofISTtS45Z0oHsZwIO7z70SdynMubovBxG6bx4J7.UTUaupqN0j8G.W9zmfkOyIy6r7MQtYbUr2E2P8+LAKU11Uk02bit1YBXo027YurrSMITpRs4uT4VYcEVPdnMu7vAWqWE9xlpa6Ib6SVFj9fpqEjNsU+W2qaJBxH2++397uHt4cCXPu5acutYHHyHFIUPPlSLRpffLmHHUPPlSDjJHHyIBREDj4DAoBBxbOvNSeKT2ZBAJumndqK8oaMZryIWtkKuHHUnNyjWZX2qaB2y8cS54usqi3zcEDj4DAoBBxbhfTg+0SmlBHmzRoFsMxNkjP2+7yDrtlHHU3e8xJ0jItSbX.XWq4mui1FW3nGf7xH8Zyl0srZbP5NWwRH4KDK4mUFXznw63sS0UecZJf+5mWDqYte.wr2cdGuODt+Q5IDOZyOWN5N2L4d0RGELoyeZy+M.4m0UIwyFCZyKGyKKsKGGFJoDN+gih7yNS.vk56EMIfNRtWMENy9hjTuTo4.Zs4mKId1XHuLudvW5W4Rje1YvEOV4yKTMq8AhCt4NEjS1nI2rIqTRj3NVz2sN7KmZbPZza4OvUu8kOc38ACEemk6YMZzX0V+EO0wRtYjNMq8AxFV3mygB+OpIMYg6CD4JWJ6X4eOZyKWVy7lEgu3uhTi6br14+QjWFoQ1olLa7+NWzoQCQrxkwA275.fstzulsrjulLRJA9sO4sImzSgTtPrb3suQxN8TwPIESpwcdzletr9u4yofbxlCus0yNV9OXd+t6U8yjvYNNFMTh41yAC+24pWINt3wN.gsfOlX96H3D6YaDwJWxc89hZz+BlLS9J3fatSZW57TX94wEO1gnYcnKXgJ0TPNYQ7G+vnxJqoEcJXyIPqJK24l3YioB0+ZtTLGibuZZ75+2eCEJTfCt4Nqctef4b6pv+d0g9LP7t49SFIdI7uq8BeaU6HyjShrSOUh8.6g.C8IoosuKz3.5HK4cFOc3QebJVud54+4EvVGcFcZxmTi+BXoUVC.MpUsGKs1VZ2izehZCqhGpKcG+BrG3Wf8fedFuo4QTaWu6Od27pNUj1fVF.g7jil7yNS1vB+r658C0nQRic+6lVFTHb58EI.Dc3gQwEoi3O4Q3KF0.4zQsK1WXqfu4U9OnWmNROg34KF8.4Rm7vb3stA97mtenSSAUn9kUBm933aqZq4rvPC7qMjxEOG50U9xI7uO16rq.fjRkX4+jT1kTJAlLQ9YVZdEF.kVXA15finuvRuwNVam8.fJKsBST4+RLKHqLvEOudhfyIO7DM4lS41uUEyae0VVgDG2cC0nfzyD0twufBg997uF.Lh26yvZ6bf+2m897ju0LYDu6mvKL6EgS0yC16Z+0xk6bG0GNO58nFGEVPdUn9kUg4mGps95oZD0VYEnPQklXsDdvgCtVOROwKCT5z7gNMZLO6JbqV+qlvk.JMGDmWFoi8tHOS2K2wmtqgRJlLSNA7v2lTtTfYIEqmzh+772+9uwA+yRuNgql3kQRoRFzq9VUZtysr0uBMP0pwjwqudSlLAlLU52nJ7.qt+jih07EyfSDwVH+ryrzYy.k27ON6rGdxZl2GxPmvzX0yY5D+IOBEjWNzx.6A14zsdNhttzcblY37Gd+bz+ZSL724iwnACLot1bl2tOCRJkXJc2OdsucEXcYxAuVamC3pW9fQCFLm6b265VACaxe.cruCxb8uwjZ0A27uyw2Y3L14sX.HuLuJe7v5IyIhSdKmvwDt2aBA1DwiEHk9XANs0ri5lmc2yr+cieA0CfRS9yJTnfRJtHr1RGv2V0NR57m17D0zOOiIhusJ.LTbwjWFoyPmzLn4cLHx4poQVIekxU+aLHsEcJX9iE7oj6USCGqmGD8VVOsL3PDAnBOv3NNH87G5uouOeoSaBJTnfF5e.7wCqWLgEuF9OSeNr3oNVN1NBGcZJ.aczI5RnOIknunJM24di02Ceu9uXBmb2SB8UlBe83FNN4gmTP1Yx3+perlejKHbeh63S2MmzSEmbu9lesQCFPmVMXkM1hjRkXznQxIsTPRoDN4tmWubUQty8Fq+M5Z4rVmb2iJL8VHH+INc2RUmd5tkM.EJ81jW14AFIIIbwSuuwpgjjDNW+JY42P8uQ13fiXiCNdm1bEjAV67mITE+KQdPg17x81tNheOoB0IdiEsx5j+mh2O3Z+eVuUIBREpSTUyr6B2bhaQpffLmHHUPPlSDjJHHyIBREDj4DAoBBxbhfTAAYNQPpffLmHHUPPlSDjJHHyIBREDj4DAoBBxbhfTAAYNQPpffLmHHUPPlSDjJHHyIBREDj4DAoBBxbhfTAAYt+e.p96lGgh2WyB.....IUjSD4pPfIH" ],
									"embed" : 1,
									"id" : "obj-8",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 94.5, 405.0, 233.0, 120.0 ]
								}

							}
, 							{
								"box" : 								{
									"data" : [ 20112, "", "IBkSG0fBZn....PCIgDQRA..AP...DPHHX....Plo48i....DLmPIQEBHf.B7g.YHB..f.PRDEDU3wI6ceGeSU0F.G+WR5duWzVVsk1RKT1kYQlJHxREjgBhfJJN.EEEQFhJnnnutUPAYKJaYuAYugxn.cS26jzz1Ld+i.WHzAEnkVzy2O5GZO268betIoO4NeNxLXvfgu9vwhffPsOFLX3F+fw+ga76WeZFLfACFL1tACXPudi+tzOqGC5MfdC5M9650Y720qCC50iNcF+W85zgd85PdMz1offPsPhDBBBBRDIDDDDjXVMc.TVZsONUSGBBOD4vWK2Z5P3eMD6gffffDQBAAAAIhDBBBBRDIDDDDjTq7jJVVTUP97mKb9bwydJTHWAMo0QR+FxygYladUR+mb7wwt27FXHi4UH8TRlMtxkyyMtwWkz2.D6kt.qe4KlqkXBXss1RmezGmN0ydYx7bhCte1zesBxM6rwCu8g9MzmiFFbnRSWud8rs09Wr+suEzTXgDdKZEO4HdArxZaJ05SSgp4Gl8LI43ikwOsOEu8y+prska2B9lujV0wnHzl1bSZ+Rm6Lbj8saF3y977Cy5iLYZt5gmzkd2WpScqGqdwKf3h4hkYeOl298vFasqZK1EL0CM6gvaMxgvEN8IoK8tuzgd7XrkUuRl9aN1pr9OiTSgMup+..zoSOpTVPUVee38rSdwA7XXkM1ReF7vnEssC70yXx7QS3Uklmirucy6+Rij.Bowz6m5YvY2biWZf8hXh9r.PIEWLu9PF.qeEKgt0m9S+G9H3jG9.Lp9zcTqRYoVmacM+Im7P+CO8HGCt3t6UYaKkkBxKWV1O8ckp8k8yeGpUpjhKpHV979AbwcOvKe8Cu70OhMlKxH6cWH8TRFmcyMo1+6UtTzoSmzuKW9CMeD8eEdnXODxH0T3LG8PrqKmBlYlwPt0cryLrt2ATUP9Xq8N..m9HGhbyNKBLzvj9FwqbgnwSe7kDh8xjQpoPyirCXuiNBX7abO4g9G.PlLYRqOGc1Y57i83U5kWSgERSacjDWLWjF2rVZRrWjFMLs23k48my2PT8r2Rs2wd7XLzt0d1+12Bsuq8fsutUw.d1QwSMxw..cpm8BUET.6Yyaf.CML9yE7KnRoR940rYTnPA.zlN0EFce6I6aaaldz2AJ02YkdZbgSeJ7vaevdGcBsZ0Rhm+bXlYlQlomFsnccD.NywNB4lUlDPHMFe7utlr8F2kuHJKHeZdjc.CFzyIN3+fCN4DgFQKJ06O8YvCiQ7XOBpTV.1Zm8.fJkEvt27eyh159jlu9OrQJ8ZG.u3.dL1wFVKC9EdYo1V5O8szkd+DzrHae4+ABgpMOTjPvIWbEmcyC9lOZJLfm84w+FD.N4hqr9icd.i2S2evqLJxH0TH3vifuZ5uOu56OMdjd8D7cexzH+byAu70OJRiF972ehr3ssOrwV63UGbewZarEO71GN0QNDVZkU.PBW4xL0W6kXE64Hk6xasM1xaLrmDysvB7zm5v28ISC0pTxe8OmzjX+X+ydwbyM2jjA.3fSNyiMvAwl9qkS66ZOHfPCik8yeOMJrlPK6PmvZarkwM4oKM+acsqh9LngJkL.LlD6WV6VJ0qWIF6U47m9jnVYArussYZ6izUl1q+xXvfAr2AG4qV5exG9pigBUql.CMLlyGLQd42cJ7nC3ok1d8w+5QFolBK3+8k.PCaTHr6MuAFwqMAF3yNJSVe0sgARiBuIrq+dcz6mdH.vN1vZH7VzJ71W+H+byoLeeUaIZwbKrnR8Y.gGLdnHgf4VXA+uksJ95oOYFZ2ZO16fiDYm6JO6q9lTu.Bhc92qkjiON9k0tUTnPA8eXifWb.8hN18GC.ZZqaKu56OM.34e7twIN39QSgEhb4J3K+ciGlvR9ouU5PFtck0xqpfBPtBEL2EsR.XcK624W+54TpkMyzREO71mxre8q9MfSbv8C.CX3OuwDNS9sIqLRm.CML5yfFF8cnOGJTnfrROU71+J24AHh1zV5Ze5GIE2U4EF+6v4NwQI0jSj0eryiCN4LqaY+N4kSN7SqdSnPgB56PdVFUe5NcrGFe8pIsrMLtOXFjet4ROCuALu0sUBMhVPHMsYryMttRkP.f9LngwlV0eHkP3uWwR4oG0KZx7rnu+qvbKrD.N2INJYlVJzs9z+J01jvCFOzb.Z0Kff3KV3JXym4JLye3WwBKsjW3I5NYjZJbwydZxM6r38Fyyw6Lpgw2+oy.UEjOojTB.PfgFlT+3hatQwEULm+zmjl1pHkZu0cryk65trV9nO4woYQ1No1ada6XYtrlagETbwEWlSqP0pkNgfxkKmg9huJq4vmkkuqCSeGxywR9oukucleH.Xss1QgpTcGdUp74su9iCN4L.b4yGMsIptHs2FML3PwY2biDu5U.ffBqI.fcNX7PwpWfMB.rwN6PawkTl8eW6S+3hm4jjQpWijhKVRH1qHkPtrz9t1C90+dm3nytbOuMIT06gh8PX2aZ8bhCc.diOblXis1Qyhr8zrHaOwFyE43GXeHWlbBq4sjgO12PZYF03eG7v65..xkqvj9y.FvLyLiRJ4l+gpziYZYnrVdyszBJRiFo1JtHM29hA.Qzl1wm9NuIYkdZ3pGdZxzNx91Mg2hVC.u4veJd8OblTu.Bh5T25Y7+8utL626s30lxGQSZYq4DG7e3Q50SXRe7+lwGfSt5FCerud4F+.H+VNTC4JjiNsl9G1ZKoDo4412du0yuR4wJqsgt938isr5+D0pTwiMvAUpq.zvd4W2jygfPsOOTrGB0sgAxZV7BXOa9ukZK9qDCwe4XHfPZLMsMQxYO9QwG+pKA03vQlLY7tid3UXe15N1Y1211LEp1325tqMt96pXp8csmr80sZxM6rvfAC7mKb9k474su9QO52Sxjdwmi7y038buACFXI+z2x4N9Q4oddimDQ6czI95oOYoi2VmNcrussYBpwgC.O0HGCa3OVJ6aqaRpuOx91M+0u+qzh10g6pXOhV2V1yV1nzUm3X+ydQmVsTu.B5tpetc84YFNae8qgss1+hm3Yp3W+Epc5gh8PndA1Hlzm8ULqIMd9z24MvJarAUET.u3a+9zvfCkFFbnzkd2WFdO6Hd6q+D+UhgW6ClgzIIrrz5N8HzpNDECq6c.27zKr1ZauqhoV19NQue5mgAEUqwZargPinEk5aVugI9weN+vrlAC9QZCt4gmTP94gad3Iycw+IN6pa.va8QeFyX7ik9zxPwE28.0JUR.gzXl1+6m.f.BowLk49c7ou6ahUS68wLyMGk4mGS5y9px7L+WQh5QebN592KCq6c.upiejRRIvT9puGKrzx6p941EZSaNkTbQ3h6df+MHf6q9RnlgrZiULox6ocTmNcjYZohdc5vMO8pTmg57yMWTUP93nKtTouYVxNizQmNs3tWk8I9q7DWLFurbg07VA.GbWame4KlUYdV+ugBUqhbyJKrvRKK0gObCEjWdnL+7vRqsFWbqz2+.5zoizS4Z.fm9Tm6qqSed4jMpUpDW8vy66jA0j927S63C5JlzCE6gvMnPgB7zm5TtS2AmbBGb5t6Qm1E283dJVJojRXRi443Yek2.ysvRV979AStd5kEqswVr1lJdOQr2QGqviyVgBE3su9cOEy2NGc1EwI0SvDOTbNDpMJvPCiuXgqfBxOOxNizXByXVz2g7r0zgkfv8kGp1CgZaBLzvL4RRJH7vNwdHHHHHQjPPPPPRsxCY3eym0XAgZyD6gffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAI0ZRHja5ovV9sRWJuqJjYxIvNV7uTsz2UjBxNSzqW+C70a4YuqbQjxUuTYNs7xL8GvQSsa01du6AkZMIDzqSOZJiwWfpB4kQZbrMulpk9t7nWudl4S2MzURYWCBqIbpctIx750Yxa0NWx7X2K+2dvGP0RUa78tGTp0bqKaqiNQS6bOAfqc4KfSd3Mod0KQwEUDAz7ViYlW1kq67yJCtxINLxjKm.aQawVGMVODzqWOW4DGFvzZBnFUJIqqkDJLyLxOqzIvVzVjISFW8TGEU4lC9DXH3pO9BXr.TjPzmlzSHVZPSaAt5ieUX62pjt3YovBxmqbxiP.Mu0nvLyItybbTlS13SfAWlKC.pxKWh4XGDKswFBrEQZx1cYEiF2dRDm7vat5IOBN3tmT2Pahzxja5oPRWLZ7sQgVp00MVeIeonQudcjdBwhG9WeLXvPkJVqMRiJkjYxIfCt5NID8owy51.b2+5KMck4lMwd5ii4VZEA0x1hbEJJ0mIrzF6L48tx6yd+ajhoN0oN0CkbM+yNPJW9hrvo7Fzom94XIy3cXOq32PU94x0h47roe4qoE8rORkv6a3Hab0rnOb7Xl4lSrm43r1uYVzpGq+XlEVv27xCgDN+oImTSl88mKBElYFsu+CgjtTzrvO303XaccD6IOBs3Q6GKZpimSsqsf1RJlM78eNN5g23U8Cf+X1Sgiu00gEVaMq8alExkqf513lVtseqNvZWNW9XGDY.MrYsle88GGm+.6lRJRCq8alE14rqTm.C1jkI8Dhk4N5mBqs0Vh+bmh08syl173OIJL2bVvjesxLFS9xWfEL4WiSt8+FckTLa5W9JzURIzfHZEmdWal4+tuBJLyL1ye76jQhwRi6PWvy51.o0YlIEG6+uVBEjcl3rmdim0qg7yu8XtiwZsUIe4Kv7emWhysucf4VYMa36+bL2RqvufCin2+N4GG+nPtbEbwCuO1yJVHMqa8hTi8Jl7Yha7kIx.ZTa5Po9bWsZ2ZwB1fALVZkPphJY7+MsZKIU0kLXn1ydHb6ZTa5.860dO.XgS4MXeqbwz8QXZEIJ0XuDi7i+F7KDiEhz4N5mh3N6In3BKD4JTvKM2eE.1wh+ESNjgrS8ZLiMbPr0Qm3j6XijYRIv3m+egbEJn88eH7Ui4oI7N0UNw11.i66WB9DPvzhd7DjbLQCP419spGi3UXi+zbYPS5i4nadMnNub3M94UhbEJns8cP7EO+.H7N0Mr5VJ0aW3f6g5FZSnuu16gLYx3eV0RoPk4yENzdK2XDLtW.Sac+I15nyDZ65Lq669L51y8xrluYVLroNGBrEQRQpUwG8TcsTwoOADLMticEcZ0Rq68.4.qcEUpXs1LU4lCS3WWM16hazxGsu7EirezxGsur7Y8A7zu6LIrNzE.3Wmzqv1V3ORXcral7YB85zwVl+2vflzGi4ODWZ4tWT6MgPquYkDNfl0Ft3g2WolmdLhWgisk0wg+6+hLRLNt1kuH50oiDO+ooAMsklzW2ZBAW8tNRGZQRW3rnJurY9u6MGmH0np.x9ZIQTC543Kd99SCin0DTqaOso2FGtzJu1KOW6xWffaSmjJy49DPvXuKtRFIDqTxL.BuScicsz4yz6eTDRaihv6T2vYO8g8+mKtbiQ.bzCuwVGMNlKXmKth1RJlBUlOYkT7RuNXoM1R8BqYUXbd2Dq0lYLlMV7Z8v+5i4VYMIcwyQdomBg11njluPa+ivo14lHrN1MS9Lw+kUqMgvstqOZKoXLqLFxu91Wc33lu9SK6YeIpAORV1LmD.H2LyQqImPHSGyEjcKUGYYxkScCqYzsm8kjZ6QG8qiSd5CO5K75z19NXN+A2CmXaaf+Y0KiOXk6nbau7HWtbzoqziCBxTXZUZ1YupCSdk6fqbxivkNx9YgS4MY.ieJUXLpV4EKcgV0fAjqv3as5zVBJt93gYEM1Sb2Fq0lc6amZKtXL2RiUfacZ0JkrSWIkHUorkUNUL6+qoVyUY31cxsabLXPmVsbpctIBpUlN3eVrlBIgnOE84UlHg19GAKs1FRNlnQuVsznV2AN291NEUnZ.3T6byk65oAQzJh+rm.W8wW7MnPQlLYLuI9RTRQZXZ8qiXvfAhrOOEC5cmI4l10PiZUkY650oyj9Ulb4HSlLzVRQzvHZEmY2aiht9X.QLG8.nWmN7pdMzjkY6+9OxZ95Ol.aQjz6WZBDVm5FYesDK2XrhXo01P8Bu4b7sZb7lPYNYQrm9Xk47JSlbzUbQ.Toi0ZyRNlnIiDiC.tvg1GVam83Sfgf2MrQbzqumh5zpkSr8MPCaVqK0xequ28eM0Z2Cgqc4KvW77C.MpJ.eaTiokOZ+LY5VXk0z5dOP9tw8r3Qca.EoRE91nFS1olLMuG8gfZU6YVC4wvA28DKsx5xc8DRjchH5RuX1Cq23h29RZwcE52q+9XiCNRmFzHYNire3g+0mbR8Zz2wMIrxFaKy1kqnzi1Q9GZSXFC3Q30+4+ffZU63SGxigKdWGxNkjXXScNX1scxpZUuF.e6qNblyH6Gxkq.85zReF6DwAWcqLiw6zw29TSb57Ku8X3vqeknQsJbz8xtzu6eHgyu89uJEqQCCZRyjKczCbGi0ZyrxV6YgS4MvBqsgLSJAF9TmCxkKmgM0ufe4sGMGZ8qDU4lM0InPoiO4vHoKcdSV9a+8ta8jv9uc0JGWF9w2bTzpGqeDPKZKFLnGGcq7KU54kQZnWuNb1yROtJjeVYhdcZwIO75NtNUmedTnxBvNmbFKukRk9MZ2Z6c.at9vNeE09sRuNcnQsJrxFaQtBEnJubPiJU3natWt+Ald85IuzSACF.m8xGStjokWLVQzVbQjWlYfcN6BVd8wQxxxM1apaLOUlXs1n3i9zrnoNddmEsAxKyLvdWbCKtkArG85zQNokBlaoU3v0GjbJK296c0TDiKC2hJ5Mran79VuJ6xeC13fiXiCkd7P3ts8akbEJLIYgsN5rzI+qbWF4xwYuJ6wdhJy571YlEVJcOKTQt8jEUlXs1rxa6VtBEUpWOt8269uhZkIDdjg773ZcpbC84BB2J2piezmw910zgwCstiIDJonhI2zuFpyOeSuoGpFYo01gxryFkYmswFjICabvQbxCuwbKu4UanlH1JEQrUqK1bzMuH9ydpppHsxqb1ldXRElPPawESZwcYxO8zPU94gAC5pnYuZiL4lg01ZGZTV.d0ffvbKsPDahXqVmxZa5Fd81TychI+3MW1WcoxRElPHmzRg7ROUJViFbsN9Ic8rePSaIkfxryjBxLCrxN6vc+pmH1DwVsNk01zsZ7yaU28cpzIS71+8a4VPFCW+tT1fwSh3sbxF+1wMr6pUWEdeHnof7QcAEfCt4YM5aNlYt4XmKtgpBxmBKn.QrIhsZkJqsoG1TgIDzqWOFzqEyLul+MGyL2bLnWKFt9yntH1pbDw1CV291zCap1dkO4XhlhJTMMnI27YJHlic.RNlyiYVXIMtcOBN6kOjxUig3NSoOFml089fUUxq0dkUwZJjSti+lBxNKpe3M2jm2gZZ0lisanrdOsllNsZ4L6YKja5ohyd4Cg2wtKceCjYxwSz6emHStBBNxNg69V2JbYdP9YwZqpVt0kS4pwv59tYSlIEuTaGcSqlCsgUh2MHHrwdGXYexjH6TRBcZKAMpUI8+W6xWfSu6sXxMjSUkU+0yDk4lC91nFyd9iEv4OvtqxWG2qpMGaPY+dZsAad9+ORNlyS8aRK3Jm3vr8E+S.FeTxW0b+Hb2u5iyd5Cq7ylB4jVJU3x7f7yh0VUkuGBmZmahCuw+BGc2z6Nvys+cR2GwXwmF1H.HqqkHW7H6m19DCBeCxXw6nnBUyhl53oWi4Mqv6pt6Eob0Kgxbylm5smAxjICaczY1wh+IB4Vd52poTaN1fx+8zZZoF2kIs3tLi3i9eHStbb0G+33aYs.v9W0hoCCXXRuFpSaInN+bnnBUUtKiuAE5CjOKVaVU9dHXqiNyv+vu.O72zKyxyMiuRJY..4ldpk5tt6PqaETmfBA+Btp+wrM0XiAupefRY68rdMjLSNAJo3Z9GfkZywFT9umVSK4KEM0swMkDtvYXe+0hIwKbF53S8bRSyy5G.GYSqlCs9+f5FVDTm.CsBWlaU04mEKOcLzFRf93N.LptGIJjKiQ18H4QaYnLznZA.ztPa.cOhfXvcr4XmUU82qCU4IDBn4s4NVHMN1VVKpxKGBsscVpMk4lMmYOak12+gVUGR.PQpUgEVdyGxIysvRjgLJtvBqVVe2MpMGaPk68zZBZTU.wdliyY261vI28hiuk0wNWxOidc5nXMExlm2WiYla7QgeIezDImzRobWlaU08mEqrrxbywVKsjDRKGNTLwgi1ZEg5qmbkzxhqlZVztPp5SP+.8z4ZvfANvZVFW3P6kANgoJ8LpCv4121o9MoERE1hpZJLybSpht23ABoT0RfZ.0lisZyLX.rvZanWiY7HSlLpW3MieYhuHsseOC.zpGa.DPyaC.TXA4yY261Plb4k4xzgANbr35OUrU2eVrxPtLYnpnhYI69HzrF3KA4iGroSDMZJxXspHq7URrolYU+5sJuGKG50qiM9KykjtTz7Lu+rJ0Sv3kOwgInV19xYou+YqiNg57uYsiTc94hYlaQshu4q1brUalM16HN3h6RGpkcN4BxjICckTBVZis3fqtKMuN3l6nQsxxcYJVyM2arp6OKVdxQoZZav0inZb.3pC1gi1ZMCtisfXSOKzpSGYleg3nc1fElYFQz.eogdW0mv5AVBgcu7eC04mGC3MmBVam8lLsh0THYjXr3WvgUss98K3v4ZW4BnLWiOeDm+f6g5EVyPVsfuEt1brUaV8Cu4jbLQSA4jE.jPzmF6cwMr0QmoAMsUb9CZ7J0nWuNh6rm.eCLzJbYfGLeVr7b1DRgsb7KPBYlMyeqGf7TUH+9tNB.rr8cBxWcg7qa6fTrVsr2ycEN3Eq5uhOOPNjAMpTxo14FQuNc70uzSK0dKez9QmdpmibSOUr1NGpzOi+2Kr2E2nC8enr7O48vdWbC0EjG8+M9fps02ciZywVsYN6kOz9ALTV5LeGbxCuofrxfG8EdMjISFQMnQvp+pOhEOi2FsEWDdT2FRvsoiHSt7xcY.df7YwJRp4Z5c3XAp0PAp0HcqKqtnh4poj0MqKBUwp1RHz0gMFoe1Jasi23mVY4Nud3e84E+h4WcEJRZRm6IA0p1SQEpF6bxkZU2dr0lisa3VeOs1hl14GkfacGQiZUXqiNIMFJXi8NxPl7mQ9YkAJLyLSpsCk2x.O39rXsU099TW0Lqr0tZsGads4Xq1LKsw1x8azu0yiPkcY9urJ9fTkICYxLVa+pooWmVjISAbi6ZLQrUoHhsGrJ01zCYpv8PvJasEqs2dJH6rvdWcSpjU+fldcZQY1YiU1Zqz2fJhMQrUaSYsMcq9hQ0+Zfn5tSElPvIO7BMpTQdYjJYjP7.0POAWFjgMN5H16p63rmdIhMQrU6TYrMcCe0gt58VWVEUjUqrpvDBVZis3U8aHVc8p.SMIqrydbxCOwhqeekKhMQrUazsuM8vlZkkgcAAAidPWF1E24KBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffj+yUfTDDdPolbHf+VUkMbvKHHb+4dZHf+V8.d3fuJMgvUO4QnPUEPiaeWjZ6j6XSD6oOJlaoUz5dOP7v+5S7m6TD8+rqRs7QM3QhM16fIsoQkR12J+cxI8THj11YBqCcoTK2cy7UQw5sRm1R3eV0xHyjhCOpaCHxmXPR04vJZZobkKxg2vegLEJnk87Ivm.B9tZ6UPnlTU14PH9ycJl+jFKob4KJ01NVzOyVWv2QcabDXmytvbG8SQZwcEzVRwTXA4K8+wd5iw+r5khb4ktrS8yu0nIuLSm.ZVaXs+uOgirwUWlq+J67Udw5sawS+s4pm5nDZ66BmYOaiU9Ye3cbZIcon4GdyQgOAFBd3e84adkgQFIF2c01qfPMopj8PXe+4hXaK7Gv05TWSZ+Pa3OYvu2GS8Cu4.PpwdYNw12.O5ndMZXDsBv3vw0rG1iyyNsuDqr0zwqg3N6IIuLRiW86VBxjICGbyCV4mMEZ0i0u6o4qhh0aUBm+zj34OCSZ4aE4xkiW0O.10Rm+cbZ+8OLGd7W9sjVuZKtHJHqLngQzpJ01qfPMspj8PvA27fI96a.eaTnlz9jV5ljRF.PlIFO16rqlLOaddeCMHhVQfsrskpeSH5SQcabSkpY99Eb3jxUtDEqQy8z7UQw5s5Jm3HznV2Ah4nGf0+8eNwbrCxSLt28NNsKehif+g1D19h9I1xu9sDbjchFb8DAUlsWg+aoYMv2xrcGrwJFRmZA96tK2w9n9d5LNXi0Xo4Jvbyt+qAkUIIDZRT8nTijy2tctz4S9YkAs7wtYglLuLSmCrlkQueowWlKSgEjOVX8MKU1VXkUfLYnQkx6o4qxFqpyOWh9.6lCt1Ufa9VW10RmO+4mO0JbZ5zpkhTqjkL82FysvRJo3h3KFY+IiDiqRu8J7eKMqgkcBgF6uWbtDRgDxH66XeTeOcCmr0Z5dDAiC1X48cLUseUFLXv.a7m+JN1VVKi8qWHVdK0ZtCst+fPZ2ifyd5SYGbVXAFzqyj9BCFPtB42Sy2cSLaks1wyNi4hLYxHjH6DSqech97JSrbmVudw2D.55y9hzjn5A.nLmr4.qcE7DuxDqTauB+6mut5DcMhfPuNCXuUF+C3NGV.XgYJvUGriUenSSn94EEVTIjRN4SOadvjY9pvSmrmecaGhQ1s1vutsCQfd6Nd4nwC4zLExwe2cAMEWLa8DW39J9pVuwjzqSGKZpimqbxCy3m2egq9XZFwyr6sPy5VuJ2k2dWcmBx9livsEjclXtkVgMN3z8z7UYYuythyd4izgf3n6dhL4xPiZUk6zJo3hwZ6c.W7pNR8iqdWGJL+7pzauB+6WTg0P9y8eJVxdNFEoUGd3ncTOOcgqjVljTl4RaBzeNeRowwuZhnoDsrqybEtXxogGNV9muIs5zSBYjMm3pIceGeUqIDV8W8wTP1YxKO2eEaczz+3rH0pHoKcdBrEQVpkKkqdIznRIA0x1Rrm93jWFoA.GcSqgPZamjFF8Ts+2...H.jDQAQkzuamuJqPZWm4pm7nja5oB.W5H6Gm7zGbvU2qvoEVG5JGcSFu5F50oiyev8HcNDpnsWg+6vRKLmBKtXzoWOpKpHryZKovhLNvzbsrykylPJRyaP0wcZcf9A.ZJtXS5mpqqPU01gLnN+7Xuq72QuNsLgNFhT6cYXig9Nt2kLRJdryImwZ6J80g+aekgwPl7rHz1+Hz6WdB7Ui4owIO8Fk4jEu3W9q2WyWkgG9Wed7WdB7kiZf3le0kbRIYF1G94HSlrJbZ860eO9wwOJlyH5KEqQC9EbXzhd9D.TgauB+2wYiOE5ZSaDYjuRbydaIoLykd2xvPgbEzp.7inSLMo40amcjbUUHNamsXikVhB4xwRyLi1zn5QH95AWN4Ljl2Rzoil2P+XKG+72Ww2CEkgc04mGEpr.bxCOQgYleeOeUVEpLeTme93fqti4VZYkdZ4jZxnvbKJ2wUPg+a30aSCJy6TQ2bvVryJKovhKgzxs.ryZKwSmri7TogLyWENXi0nUmNTWTwTeOcgBTWDFv.4oVCxLX.ec2ITptHJrjRPNPgEULZ0qGeb1AhKsrJ0cp3Gu4iUoKC6OTbqKaiCNdGux.2MyWkk014P49M5Uzzb9VNOBBB2tLyWEYluJoeWYgEgxBKR52yWcgR+brolEfo25xRCG721stb7omy8crIdZGEDDjHRHHHHHQjPPPPPxCEmCAAgGV8vvP.+sRjPPPnZx85P.+s5A8vAu3PFDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRtqtri0Vpy7OLYla9nXmSlVJrps75XUwkES3eWD2GBUiL2hxujVceWu9uO8v1MLivCFhCYPPPPhHgffffj+SkPnMsoMk6zBJnfHpnhh.CLPo1jISFcriczj4yEWbgF0nFUsEiBB0j9OUBgksrkUp1rzRKYG6XG7ke4Wxi7HOBKbgKjoN0oB.JTnf8rm8vHG4Hkl+1zl1v69tu6CpPF6rtxWZsualWAgxR0VBgHhHBhJpnvbyuYoLKnfBhwN1wRvAGrIyaaaaaK02DeCsrksjwN1whO9XZoKucsqcTm5byJSTyadyQtb4LvANPpW8pmT61XiMLvANP72e+Ky9egKbgrxUtR5cu6MScpSk1111R26d2oacqa.P94mOe3G9gk6xWc6o6PypTymS1YMcuoh8bQ39S0RBgAO3Ayrl0rvN6risrksPW5RWHv.CjktzkRpolJe228cL7gObrxJqXUqZUDYjQRO5QOXEqXElzOOyy7LLsoMMRKszXaaaaDRHgPCaXC43G+3T+5Wed+2+8YJSYJ.vO9i+HKYIKgvBKL18t2MQDQD3pqtx1111PgBEL6YOaryN6LciWtb5cu6M+1u8alz9rm8rYLiYL.PAET.e3G9gkZddPvcGrC2bvNByeuo9d5BOdqBim45inOd6rCLht1Zdx10T5PiaHA3sa3u6Ni6NX2ctiEDJGUKW1wO4S9DhHhHHu7xibyMW9fO3CXNyYNTbwES7wGOO4S9j3t6tSO5QOPsZ07ke4WB.QFookn7.CLPxJqr3XG6Xz6d2aznQCie7im8u+8SxImLqXEqfUrhUvm+4Fq5wScpSkKbgKfLYxnMsoMz4N2Y13F2HqXEqfMrgMvku7kMo+syN6PsZ0nVsZSZO0TSEO8zSoeeAKXA7LOyyvq8ZuFwDSLUGujUlxHekjY9J4rIjBuRu5Ha5DQC.OZyClCdg3PqNCbhXSBMEqCUEUD94pyjQ9U9xMufvsqJeODjKWNlYlYjWdFGfRtzktDd4kWr0stUl+7mOSe5SmSdxSRKaYKwCO7vj+H8fG7flzWyctykyctywBVvBXm6bm3kWdgWd4EN3fCz4N2Y5bm6Le228cX10GJ1yLSiCVKEVXgnPgBpScpCW8pFu4aToREolZplz+JUpDyM2br1ZqMocu816RMuidzilIO4ISPAETUvqR28twXLA.a9DWfSG+03.W7pDfWtSOadvUvRJHT4UkmPPud8TbwEK8MrMoIMgXiMV5e+6OJUpjd26dSO6YOY7ie7jPBIPngdyAc0niNZS1s9W60dM1zl1DQEUTL8oOcF0nFEwGe7boKcIl5TmJe5m9oz3F2XzTFCpq.b9yedBKrv.Ld0At0u0+Fw5hVzhL4jDZs0Vya8VuEey27MlLuIlXh7ge3GxLm4Lu+dA5tjBYxH755CokSd3ti1i6NXOcN7.nUAUWByeuIoLMl3UqV8TOObFODGxfv8gpkCY3EdgWfCbfCPBIj.94meLfAL.RKszXYKaY7hu3Khc1YG+7O+yrksrEF5PGJG9vGFCFLvxV1xPoxatKuacqak4Mu4gRkJwN6ri27MeSN9wON6cu6kd1ydhc1YGKXAKfhusQ0laXAKXAbvCdP5PG5.1Ymck478Nuy6vbm6bYm6bmHSlLJt3h4m9oeh8t28JsmG2v2+8eOCdvCtp8Eq6fkuuSf0VXNmI9qQC81Uzpy.G7hwA.d4j8Xq0VvB19gQmd8rr8cRTWRIOPiOg+c4tZfZo1x8f+CKL2BKYpqa+k4yxPsgacYwyxPseUUkPsJ6.0x+otODDDDpXhDBBBBRDIDDDDjbWeREs1txebpWvTEprfxcZhG+XgZitqRHLtueo27jbHToTVIPEmLOgZqtqRHDPyK+mVPAAgG9INGBBBBRD0Tw6QkUsRTP3gch8P3dPEUqDEDdXlHgffffDQBAAAAI05JC6QFYjk5wf9dUTQEExjIiidziJ8PS4kWdgs1ZKW4JWQZ9BO7vIgDR.+82eb0UWMoOzoSG6cu6sJIdDDpsqV2dH7Fuwa..CbfCrTELkJqV25VShIlHO4S9j7XO1iwYNyYjdLn6cu6Mu5q9plL+exm7Izzl1TZRSZBctyclwMtwwrm8royctykaocSP3eitu2CAe7wGzoSGctycFUpTw5W+5oQMpQ3ryNK8M8Vas0zl1zFxLyL4rm8r.P8qe8I2byk.BH.r0VaYW6ZW.FKJJN3fCROVzm4LmA0pUSTQEEJUpjidziJsdkKWNcsqckktzkJ8nM6qu9xJW4JoYMqYRELkksrkwRW5Ro4Mu4U31xhW7hAfgNzgR6ae6kJ1pUU1wh+EBtMc.eBnloflTP1YhsN4hIEaka2UO4QnPUEPiaeWd.FYB0VbeuGB8qe8ist0sRXgEFSdxSl0u90yfFzfX5Se5LtwMNL2byYoKcozxV1R5V25FaYKaAarwFF8nGM+8e+2zm9zGl1zlFSXBS..V9xWNN3fCTm5TGBO7vwVaske7G+Q5YO6IgGd3r28tW7zSOou8surl0rFBO7voksrkRwS26d2Y6ae6RIC.3Dm3DDe7wSm6bmue2buubzMsZb2u5Wirt0qWOy7o6F5pf5kP7m6TL+IMVR4xW7AXjITaRUx4PX26d27AevGPzQGMcqacioO8oSO5QO3Iexmjt10thJUp3y+7OGv3wq+3O9iCX7at+pu5qnssss71u8ayblyb.fjRJINxQNBabiaDWc0UZbiaLsu8sGv3d.7rO6yhRkJ4e9m+g25sdKShEWbwEt10tVohwauNI9fVVWKQbvMOPm1RHs3uBN3p6jPzmFOqaCvc+MljPiJkj00RBElYF4mU5DXKZKxjIiqdpihpbyAeBLDb0GeAL9rvmPzmlzSHVZPSaAt5ieRqKk4lMwdpig4VYMA0x1hbEJHoKdVJrf74Jm7HDPyaMlYtElDe66OWDaag+.tVm59f6EEgZcpRNGBIlXh.fVsZI6ryFv3IiStb43me9YRgIMlXhAu7xK.HiLx.vXMPr71MVe802xc4SJojJ07md5oi2d6coZ+F0IwhKt3RUIjLyLyJ2ptTUkKbv8PHQ1IRK9qxu71ige4sGCIb9yvOMgWfCrlkC.oF6k4WmzX4me6wv59lYQwZzvu89ii09sylKcrCv29JCkStiMA.+wrmBq8amEomvU46F2yxd+ieG.h8LGmYOrGmnOvt4eV0h4qe4mgh0ngn+mcA.GciqhRJpzkbNGbyCl3uuA7sQgVpoI7eGU6mTw3iOdBO7vk98vCObhM16bEZxfACHSlLhO93IzPCEEJTToV90rl0Pm5TmHjPBQps10t1gWd4E6ZW6hXhIFZe6auTRAarwFZRSZR0d0T97GXODbjcB.TkaNL5O+moWi4MXzy4WXMe8Gi1hKB.xN0qw3m2ewD9s0v4OvtHyjRfW66WJCb7Sgw7Eyik+IuG5zVBmXaafAN9oPuewwyn+7eFabzQ.XYe76wS91SkA8teDO+m983j6dx9V4uSOFwq..CZReLVamCkJ9ZRT8.abvwp0WCDp8qZ+xNtksrEdpm5o33G+3nWudRM0TYCaXCz1111Jb4N0oNEe+2+8zqd0KV6ZWKm4LmgryNaLyLynacqaL7gO7xb4xO+7Y3Ce3Lm4LGrwFa.fTRIEdlm4YPqVsbvCdPN9wONIlXhbwKdQr1ZqYZSaZjUVYUkuseC5zVBYcsDvy51.hO5SiOADL16ha.fG9WeL2JqIijhG.b065fsN5D.jzENKpxKal+6NVo9RipBH6qkDQMnmiu346OMLhVSPst8zldOPzVRwjVrwv9+qkvgW+eB.YjT7H+5ISEDtSD0Tw6AkWsRr7DywNHmXaafm9clAwG8o4O+7ox3m+eIM8I08ly3m+egp7xkkLiIx6s7s..a3GlCYjT7zsm8kLo+7rtMDyszRxKiz37GbObhssAxL4D38V1lYBcHXdkucwXs82bu.r1NGvYO8l2rcAxmumyi4VV9250+wmMEb1CuoaO2Ke27RhP0DQMU7egN+A2CAG4MueFRNlnIiDiC.tvg1GVam83ZcJ8PEWChnUD+YOAt5iu3aPghLYxXdS7knjhzvz5WGwfACDYedJFz6NSxMsqgLYxotMNBRNlnw2fBEeCJT19u+Sbl8rEjIWNxjICskTzcUrqJubHiDpbeggvC+p0cmJ9uQwbj8SOFwM2seqr0dV3TdCrvZaHyjRfgO04TlmT0PhrSDQW5EydX8FW71WRKtqP+d82GabvQ5zfFIyYj8CO7u9jSpWi9NtIgbEJ3Yl7r3meqQyI29FQiJkXqiNQq68ShLYxv+PaByX.OBu9O+G3Ycqb6s2I29eyAW2evD90UWk85gPsWhCY3dvc6gLja5ohSdX7JiDezmlEM0wy6rnMPdYlA16haXgUVUgKu57yiBUV.14jyXoM1Vp1s1dGvla4PDzqWO4lVJHWgbbxiadEWzqSGZTqBqrwVw4U3gDOnOjAQMU7dPEUqDKK2HYvsxLKrT5dJ3NwFGbrLuB.kW6xkKGW7tNktcEJLIwgfvsSTSEuGculXzs53G8YrucUbzHHT03t5PFDDDdvRbUFDDDpwHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffDQBAAAAIhDBBBBRDIDDDDjXVMc.TaRdYlNN5lGUa8epwFCGbc+AYesDwBqskl14dR3Q0cooqQUAruUtHR7hmC4xUPCZZKoc8evnvLyklmrtVhr++ZIjdBwh016.sqeCl5Gdyq1hYg+aQrGBW2NWx7X2K+2p15+Kbn8wbG8SgEVYCQ1mml.aQjrpuZlr3YLQo44mlvnIgyeFhnq8hv5TW4XaYsrno81RS+r6aG7kiZ.XiCNRTCZD3evgyOM9WfCtt+nZKtE9uk+UrGBIb9SSdYjN9GZSvQ27.MpJfzSHV7Ojl..EpLexHw3v+PZBFLXfDh9zjdBwRCZZKvUe7CU4kKIeonQudcjdBwhG9WeLXv.wcliixbxFeBLXb0G+.fqc4Kfyd4CoE2UnPkEPfMuMnWuAtxIND13fST2F2zREekTTQrnoNdFxGLaZRT8Pp8v5X23SGxix41+Nv2fZLwd5iwmumyiByL91RiZcGXVC4wPipBPgYVvxl46xflzmP3cpa.PfsHRbxCu3u+ouf173OIxjISpu0nRIYcsDwQ28j3N6Iwc+pGdV2FPpwFCYlTBzfHZE1XuCRy+UO0QQUt4fOAFBt5iuRsqJubIlicPrzFaHvVDIlYtEUX650qm3NywIyjS.O7uATuvhPpuxM8THwKbNb2u5hbElgU1ZON3pa2SqegpGJl5Tm5TOTx4VSGG2SzqWO+xDeQN8t1BFzqi+ZNSCOqW.TnxBX4ex6QGF3v.fDh9z7Gy5Cn8CXn7GydJb7stNrvZqYseyrPtbEXiCNx9+qkPAYmIN6o23Y8ZH+7aOFN+A1MkTjFV62LKryYWoNAFLKYFuCGXMKmLRLVN++rKNxFWEGcSqlBUlOa7m+JL2Rqntg1DShyKdn8RzGXOL3IMSSZ2BqrBk4lMW4DGlV9n8kCt1UPdomFtVG+wVGcFKrxZ5xPGMlYgkbwCuON6d2FC989DS5COqWCoCCbXljL.fju7E3WeuWkysucPQpUxe8kyfLRLNNyt2JIconYS+7bo8CXnHWgBVvjeMN0t1BZKoX1v2+43nGdiW0O.ROgXYti9ovZask3O2oXce6roMO9SR1olbY1tNcZYtuv.I83uBZTohMO+uA04kCA0x1wY2614Wl3KgYlaN66OWLGXMKGmb2S7IvPtqW+lYgHoP4xfga6mMb8+yfwe2v0+8q+y25+ZvfgGt2Cgn2+NImTRl2ZgqC4xkSPsnsD2YOIA2lNTtKyI11FXbe+Rvm.BlVzimfjiIZ7IffowcrqnSqVZcuGHGXsq.04kCuwOuRjqPAssuChu34Gfz2LW+l1B52q8dnN+7XRcuYL94uJpaiaJ9GRS3T6bSzwmbXlrNyKyzwIO7pLiG28qdbkieHLybK3U9lEwp9pYxm9LOJVauCDRjchtOhwhm0qgjeVYfKd6aY1Gkm7xHUlvutJr0QmQtYlSFIFGuzWNe.XZ8qij5UuDYkRRjYRIv3m+egbEJn88eH7Ui4oI7N0UtvA2C0MzlPees2CYxjw+rpkRgJyubaWUt4PiZcG3Id02Av3d.s1+2mPueoIveNmowH9nuhFDQqPaIEymL3dB.mZma5td8aks1cW85fPk2C0IDR7BmkFDQqPtbimJjPa+iPns+Q3pm5nk6xD0fdN9hmu+zvHZMA051Sa58.K07bsKeABtMcB4JT..9DPvXuKtRFIDK.3aPMF.rxN6A.upe..fk1XG5JojR0elYtEnsjhKy3o3BUi4VYMfwus+k9x4SQpUQhW3rbzMuF9hme.7dKeKXo01PQEptR85xM3jm9fsN5L.Xss1KEm2HV0psDR5BmEU4kMy+cGqzzznp.x9ZIQ3cparqkNeld+ihPZaTDdm5FN6oOka6N6oOnSmN1vOLGxM8TIgnOMHSFJyIKxM8TnAQzJoWOtwIB8dY8KT84g5Spnb4xQuNcR+dIEUDYlbBHSlLS1yI8Z0J8yO5K757A+4tnYc+w4RG4e3KG8SUl8qNcl9G1ZKoDjc8DD2HAjjaa20ucMrYslzhMFxOqLJ0ztzQ1O0uIMmSuqMyp9xY..VZisDPyaCCdReLdGPiHlicPpeSZNomPrTP1YZxxmeVYxLdxtPgJyuL2NLILozwoL4xotg0LdzQ+5R++D9s0fSd5CN6UcXxqbGLjOX1XqiNwBmxaxQ13pK21id+6j4MwWDm7vKZaeGD8+MmL.nvbywfd8ns3hjVukb8e9dY8KT84g5DBMnosjKbv8H8MmGYiqh+XVe.VYqcjWFoQwZz..m+f6A.JViFlV+5HFLXfH6ySwfd2YRtocMzqSGxjIGcW+CoMLhVwY181nH0p.fXN5APuNc3U8Z38Tb5h20gVzimf4+tiE04mGfwigaGK9WHtydRh5oeN7ntMj+Y0Kiyr6sJsboE+UI83tB9DPivIO7lv6T2Xoez6f5Bx+5aOExx+z2CO8u9XscNTlq66jFDQqH9ydBb0Gew2fBEYxjw7l3KA.a+2+QVyW+wDXKhjd+RSfv5T2H6qkX41dLG+PDRjch1OfgRCZZK4xG+PnWmVr1NGnAMskr2+bw.PFIDKW7P68dd8KT84g5CYHvV1VZ5i7n7YC+wwA27fBxJCdgO6mvi51.peSZNexf6N13ny3S.ACX7j30oAMRlyH6Gd3e8ImTuF8cbSB4JTf+gDN+16+pTrFMLnIMStzQO.e5PdLbw65P1ojDCapyAyrvx64X8odmYv5+9OmOdPcCGb0CJTY93fqdvK+0K.6b1UryYWYvu+mvx+z2mk8IuGVXk0nQkR58KMdo3ePS5iYEyZx7g8oc3te0ibR8ZzvHZEC4Cmy8bbERjchH5RuX1Cq23h29RZwcE52q+9XtkVRq50.3ae0gybFY+PtbEnWmV5yXmHfgxr87yLM9g2Xj7iu4nnjhzfG0sATPVYfNskvP+vOmeZBilcsj4gsN4Lt3ieHSth6w0uP0EYFLXvvWe3Xqoii6KpxKGJRsZbxSuMY2jyM8TPtByktzV2f57yiBUV.VauClbo2twdZXo01H0uZToBGcy86qjA2phJTMJyIaL2RKwAWcuTSWuNcjWlogdc5wQ28nLuLa2HtrxV6vVGcpJIttwqI14jyXoM1dy3QudxK8TvfAvYu7Q5pYTdsWrlBofryBaczQrxV6k5mSrsMPnsqyR88W77CfGazuNgz1ntmV++WggabruW+eMvM9cSuRA23pHXPudoqXfweVOFza.8Fza720qy3uqWGFzqGc5L9u50oC8508uiDBB098au+3.fPZaTjxUuDmdWagIszMi4VV0jn8eqDIDD9WIskTLGd8+I4kY5XiCNRKez9Uks2M+a1C5DBOTeNDDd3gYlaAsq+OSMcXHbG7P8UYPPPnpkHgffffDQBAAAAIhDBBBBRDIDDDDjHRHHHHHQjPPPPPhHgffffjZk2XRudaZPM159qNzUKUa0jwSEYla9nXmStH86ZToj7xHcznrfZvn5NPlLrwdGvVmcFar2wZ5nQ31TqLg..iedq5A957KFU+K2oUSDOUje3MGgI+ddYjF4lVp0LAycCCFPc94g57yCm81mx7A7RnlSs1DBBUdEpTowjAxjgit6IN3paRU6oZazoUKEjUljWFoQNobML2BqvZ6s+NufBOPHNGB+KP9YlN.3jGdhSd3YshjAm+.6tLaWgYlgSd5EN5tm.fxaqBPITy5AVBgbSOkGTqp+y4FU1I6b1k6vb9fww2554GdiQxw2x5J24w9qWiJznR4cr+LXv.YlT7TrlBMo8hJTMYIpfRUodfjP3XaYsrzYNoGDqpxk4lo.KLql+aNugis4Uip7xoJouLnWO.lLBOUSIyjhmk8wFeudYex6QFIFWYNe2XrmP+0i8xi57yi49BOIa+2+I9eu7yvkNx9ALNv278u9HXyy6+w2+5i.c2RcyT3dW0dBg070eB6ZIyS5Cs0T5RSBB2cr5+XUu7wODmYOak7yx3twmeVoK8G9kTbQjYRwip7xgnO3dHwKdNisWjFR5hmkrSIop83KwKb1R8yIGyEH+rxfXO8wtu5asEWDyeRuhzdrTjZU7qu2qRIEUzcXIKeW8TGkVzymfAMoYxfd2YxNV7u..q66lMi7i+FFxGLabqN9wY1y1tuhcAip1Oohgztnns8avrxO6Cqx5yd0xPwZyMGYxf7KrH1xIt.cqoAgb4xwYasg+7.mjmsKsl0enyRP94I50qmF5oqXgYJH4rpdFTZzqSKKdFuMMtccA.VwrmBO2zmKm+e1E13jKDdG6FEjUFrmUtPZe+GJEoREod0KRCin0r9e3yotgFA5zVB69OV.84kmHlYd0y21uhYMYlvuZrxEuhO88YB+1ZXwSaBDPyiDGb0MN9VWOCbB2auWUTgpo+uwjKi1UcOWYjBqicEv3gbdzMsZZPSaIkTTQnQYARiCm0K7VPBm+zDQWdz6o0gvMUsmPHnV1NROgp9JxzwtZhDWZYyn6QawO2cFub1ANvEik54gqzx.8mUt+Sxv6bqPYQEwB19gwdqshyFe024wPud8ziQNN7rtMfrSIIN+g1coJY52fm0sA3fadPy61iSbm4XXmStPy69iC.oG+UIwyeZpeSZQ0Vrd6LXv.880dWTXl47Cu4yi5Bx2jZMYkksN5LA1hHqFhP33acCjzkNOMtCcgh0THlaoURSybKshhuKGyJDJaOzdYG0TjwwMA8FLf8VZApzXbfPItzxhbTpFUZJBs50SxY9faXpa++0hnXMZvUuqCZToxzgUqxQAYkoIC9HN4o2nJ+GLw7MBO6cwMoy+fEVZIZTVv8TBgrSI4x7j74h29Zx3038htLzWfnFzHX58OJZQO6CkTjFooURQZvhqWXbEt+7PaBgaUrYjCcMhf4LIjBcHz5yguXBzpfpG68rWl.piG3qqNQIZ0RKCv2psCYHgycZr1N6Y.u4T.fecxuJ50qG4JLiRJz3YGO+ru4.0xMpdvN3lGb4iePo1yH43w+PCuZIFAPWIkPNolLoEernQkw6nwLSJdROgXwF6cf7xHcbxSuum5a4JTvu9duJpxMao1r0IWXh+d4e0FtS18x9ULfA57fedLn23fxiU1XGVZsMjWloiit4AwcliQiZc4O78IT48PYBgCcw3nfBMdhp96iFMEVTwrfcbHb2QaYcG9rjUApofhJhDyHGtZZYgCVaE69rWg55gyUawjG0qAr+UuXVwrlLlYokXgkVQgpxmFFQqXse+r4xm3PnsjhkF92b2u5xJ+xYvv9fOiKdj8yhmwagA85wQO7B+ZT0WBgA9VSkCttUhsN4LO1nec.iiTTmae6.MpTxv9vOuziLUURN4gWL7o8E7Cu9HjZ+KNbkI..3vKIQTPTY3ScN3jG2aIX.nYcuOLuI9hj34OCYcsjnGibrXgUVySLtIw7l3KhK93GEqVEMtCc8ddcHbSOPRH3g+0mw9+VXUV+kUA273ESIGiihQ4qVC4q9l6FYhYX7L6qoDsnoDiWq6qlZVUYwvsyNmbggO0urLm1Hlw+qTs04AOJ57fM9y89EG+82JWlLvfAi6Qxc3OlaXDshFd8wXwavLKrfGYHi59KFttPhrSzsm6kXaK3GnqO6KIMtKb6jtbi2gwYAGb0MdieYkjaZWCqs2Aow5gfaSGndg0TznRU4NP5Jb26gx8PPvTVZs0TjZ0TX94gsNc2uWPO867QUowSuewI..8ZLkehN04YbHsyha4jCVdjISFN6UcJU6VYq8lLXvHb+SbqK+u.1d8m3wrtVRnLmbtYs7uRxufCqJMdjqPA8YrST5lO51UP1YQNW+dtv9aaT0RnlkXOD9W.6cwUJpP0nJmrIqjSfrRNgZ5PpRwFG++s28dLQ4c9db72LCLC2lAPtICCJBHdCjhaEpwKEpwCrYSWs0jSRujS0XSaSZRM1+q0z3wz+rWLmjMaLmywlSMoM8Ba1Vqtnnbw0EAbsJBJfhnEjKC2YFFFXFFFN+wnO5HyZKN.CheekPhLyy77827P7yy0e+9E47lG2ZgayaCDdTcEY+gh9r+Sfo2ddmMcuYQ56IlDSBsgDJVGbf482S9.0FLQDSbDdTydWjWwiGYpb62fadoZl1GF9bgTx52Mun+KHl8HSkayCk15x0e2DDh4DxEUTHDJj.AgPnPBDDBgBIPPHDJj.AgPnPBDDBghYja6nyA6gwtYcLdecNSr5DyWDfJzDuQBxPpnI9j72sFwb.eNPXrVpmQuwkmIZKh4alzENL0FNL0FtV4yRvKa096VjXVlOEHLd+lXzlqEUpTQd4kG4jSNn8wbrySL+yXiMFUUUUbtycNFsoKhZcQQPw73O1FHl+ymtFBi0R8vjSR94mOadyaVBCVfI3fCl7yOe1xV1B.Xu0F8ysHwrMeJPXBytGDQyN6r830O0oNECLv.d6i7q5A6y.tb4hyd1yRokVJ82+idvMo5pqlhKtXFYjQ7566xkKps1Z83GmOvX4+0u90o3hKl1Z6IidJ3bom64bOvo5bft8ysDwrMeJPXRmtGnSCKrv730+nO5iP2iw70mCGNT1ajCGNHu7xiO4S9DJpnhXsqcsTZok50O2a8VuEe3G9gJKWWcM0QW4latY1zl1D6ZW6R4Gy2cP53i+3OlW8UeUJojRXCaXCTd4kOsa6KjEbvtGDSt2euEKbMi24l9ke4WHwDSjft67JvXiMF1samHh3Wep+1gCGbwKdQ.3G9ge.MZzvwO9wAf7xKON3AOHacqdN140PCMPYkUFM1XiDTPAwANvA3y9rOiO8S+TOVtZqsV1912Ne0W8US4y+EewWvUu5UIrvBi7xKON1wNF4me9O1aCDhmTMi+bHbxSdRJnfBXxImj8t28RVYkEEVXgrt0sNkCG+4e9m2i81avfAZqs1Xe6ae3vgC15V2JEVXg7ke4Wd+FpJUJiTwOnxKubxKu7TBfJnfBnhJpXJK2ku7kI93imCe3CyQNxQvhE2iEim9zmlcricPWc0Ee+2+8jUVYwgNj2GaDEhE5lUBDJrvB4a9lugpppJpqt5nppph27MeSdi23Mdje1CcnCgFMZnzRKE850ShI5dbzq6t6lO3C9.d+2epiQe81auD0CLPaDYjQRO8zyTVtZqsVN6YOKVsZkyblyvF1vFX3gGFSlLQ0UWM6YO6gxJqLxM2b4jm7j93VAg3ISynmxv3iONczQGjbxIym+4eNu7K+xJ24gW60dM16d26zdcd6aeadwW7E4ce22ksu8sOk2WsWl5y81HO7gO7gI1XiU45cje94y28ceGSLwDL93iSkUVIpTohBJn.1+92OEVnLsfId5yL5QHTYkUxF23FAl5r56Cd2Cd3C8ehIlvqqupqtZ1xV1B6e+6m8su840kI1Xikd689S.J81aujPBS8dka1rYkKNF.ojRJLv.CPLwDCqYMqQIDIyLyDSlL8n9ZJDKXMiFHbuqe..4latb7iebk+y9O9i+H4jSN.tuqDs1Zq.PSM0D80m6aeoJUpv0cGBnZqs1Xm6bm70e8Wyq7Jux+xZ9BuvKPYkUlx0DnnhJRYu60We8Xyl6wWvW5kdIkSEvhEKTQEUvl27lYaaaaTd4kiUqtm6FNyYNCqe8q2KURHV3aF8TFpnhJ3.Gv8LG7q+5uNUTQEjc1YShIlHs2d67se62B.u8a+1r6cuaN5QOJpUqlzRKM.HzPCkzSOcRJojXG6XGzYmcpbaHAXUqZUzPCM3QMSO8z4cdm2gbxIGLZzH1rYihKtX.XSaZSTRIkPt4lKG4HGgcsqcQlYlIM0TSr6cuak6u968duGqacqizRKMZokV3Dm3DyjaVDhmX3SCxpCVr6Yio6EBzYmchACF7XY5s2dwlMaXznQONeeKVrv.CL.IkTRd75Nc5DqVshd85mVSoX80WeXylMRJoj75ci.t+03Pud8rnE44v+8fCNHlMaFiFMRf+KlOAdZ1AO3AAfn98+G94VxSWdhdPV8gCC.2miu2nWudzqepyvvAFXfDYjQNsqcLw7qOgeDTPAQxImrWeunhJJOtaEBwSijwCAgPnPBDDBgBIPPHDJj.AgPnPBDDBgBIPPHDJj.AgPnPBDDBgBIPPHDJj.AgPnPBDDBgBIPPHDJj.AgPnPBDDBgBIPPHDJj.AgPnPBDDBgBIPPHDJj.AgPnPBDDBgBIPPHDJ7o.g.t6vmtSmNmQZLh4mT96a.x9OVnym9KrZ8QC3d1WRrv00t10..05l9CO9hmr3SABZL5dFW5XG6XTWc0Mk4yQwS9tzktjxLgUvIuJ+bqQLayml4l.Xj5pDGczxLXSRLejFCKivxZy96lwScdhalaJr0tQBLxXwd6MyDl62WWch4YTEdjDbJYf1DSwe2TDyAlQlJ2ztjzQ6RRelXUIDB+nG6.g8l6b+dL9up4V9k59nLW2l7G0S7zCe5HDd+i7WmoZG+p9787R9k59nLW2l7m0S7zA4FKKDBERffPHTHABBgPgeIPH9H0QBKJBRyPrnKDsDrlfPsp.lypeXZ0vxMDqWeuvCQ6bV6PHluwuEHjXz5YvgGA6i6jsmSlDhFMyY0O7PzR5IFuWeu+8Mk8bV6PHluYF44PvazEhVd9LWNpC.5aXaTYC2hWLmLPafpYIwFE+8FZg0m9Roo16gDiVOYmhQNWCO9Owi6YaOGG4zUSvZBjctgrnllakBdlUwc5eHBUSP7Mm6RrkUmJwGkNhQe3zVeCQjgGB+wbxf9rLBKNJ87S0bUhMBcjwRR.qiYmLR1.5BVKmuoaSq8Lvzp87GVeFDc3ghqIcQo00LoDezr5jhmNGbXbMoKJ9hMvFWcJDllfHZ8gyOcgqxlyHUBSSPLIf0wbvotTi+lq2ZVRBjUxFHf.fK2RGzu0Q3e6YVICNxnDYXgP0231jbrKhybkaPdYjJcLfEhKRcdTeqiYeZtUWrPyr1QHjWlKmdGZXtZacwpMFOIFcjnMP0Tz4uBU138eTosOtS5neKb4a09Lda3FczMGql5oWKVY4IFGqvXb78UVKE+yM..tbMIUTeKb8N5lXiPG8ZwJ8Z1ca9O7rqgFuSWbgl+EJL6UNspaHZ0fgnzwQK+B7S+yqw1dlU..0b8V4D+yqRjgFBFVTDrljVLszcebKS8wlVs6msfKcq14ub9qvRhY50QhRL5HXHaiRMM2J8ZwJ1c5jydM2e2VbT53lc1GKKd2cFszLDG8XdXuVewS2l0BDBOXsLp8wAfxp6FDnJUXyg6eeXaiMaUVT8.cQWq1c..1r6fvzDDiOwDtq+ntqe5IFK4r7j..6Nb345Q08WOm7xSudyol.Uyvi5dusVrMJZCT8caOtesQc3fnBKDksO8YwJW5l24tum6tZrq68Lr+aTIWtI5neyrRiKlMt5kQlKw.YsLC3ZRW3Xb2qy6z2Pr9zWJcNfYBUqVuVewS2l0BDZ3NlXEFiCspChsmalXZHKjTzQxxMDKO6xWpGKqCmN4YSKIepdlGYTxKiz32+6V085GHrtTRhTSHZVyRRfazYu3xk6CsdCqz8dCWbTQvPiLJQEdXDpVsnVkJTGP.r1kZ.SCZl3hPGwnKbxOyzl1skHBMDVsw3YaYsBpust.fbSOYVQhwQL5CmFa2DQFdnnIv.I6TLRpFhwm99+GyMSzEZvz0.lIPUpHgnzwPVGkXzENgEr6KT5EuYaryMrVtXysQ2CZdFs9hEFl0tFBW41cPOlsRnZCj+zINGNbNA+OkbdV1hilSWaSXcL6b6.6mgG0NE+yMPbQpympWQm+Jj5hillZuabM4jnOrfow6XB.9xxt.i6bBNZ4WfkF2h3muYa3XBmzuEajxhilgsYm+6SUIpTE.e6+3xDplfntV6jTWbzLgqIolaz5zt87+UVMXLlHng16l16aH13pRgFuiIbNwD7+VRU.vQNcUjvhzwe+ZsPOlsRz5BU4HK9aWrgoU8NVM0yRhMJTqJ.946t29TSHZFZjQ41c2OpUE.8YYD9y+s+A8X1pWquPLqEH.PWCX1ie20jPKc48dDYa8NnOWuVLc+0cfpUy.VsMk58vWbvaYxy2ebmSfk6dJMsX5wu2aZebmdTayiLJVFcLO9dZytCOVl9G1lx+tqAsLsq4CuMzaaqeT0WHlUCD7m5b.yz4CEH4Oc06dZCBw7YxSpnPHTHABBgPgOcJC9qtG67wtk6bcaZ931.wS974wTQgPL6YtdLUTNkAgPnPBDDBgBIPPHDJj.AgPnPBDDBgBIPPHDJ9+A7R6v9oGxC0B.....jTQNQjqBAlf" ],
									"embed" : 1,
									"id" : "obj-4",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 68.0, 83.5, 260.0, 289.0 ]
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
									"patching_rect" : [ 390.0, 7.0, 112.0, 23.0 ],
									"style" : "",
									"text" : "osc"
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
 ]
					}
,
					"patching_rect" : [ 728.0, 318.0, 34.0, 18.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p osc"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-73",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 729.0, 296.0, 46.0, 18.0 ],
					"style" : "",
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"id" : "obj-74",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 729.0, 248.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 295.0, 391.0, 21.0, 17.0 ],
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
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-68",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 59.0, 581.0, 87.5, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 26.0, 309.0, 138.5, 18.0 ],
					"style" : "",
					"text" : "/test 0",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"fontsize" : 10.0,
					"hint" : "auto playback of text",
					"id" : "obj-69",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"mode" : 1,
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 70.0, 511.0, 73.078125, 20.199219 ],
					"presentation" : 1,
					"presentation_rect" : [ 170.0, 307.0, 67.078125, 17.199219 ],
					"style" : "",
					"text" : "monitor in",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "monitor IN",
					"textoncolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-67",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 282.0, 308.0, 91.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 84.0, 125.0, 138.5, 18.0 ],
					"style" : "",
					"text" : "/test three",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-66",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 266.0, 206.0, 34.0, 20.0 ],
					"style" : "",
					"text" : "gate"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"fontsize" : 10.0,
					"hint" : "auto playback of text",
					"id" : "obj-65",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"mode" : 1,
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 268.0, 168.0, 73.078125, 20.199219 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 123.0, 67.078125, 17.199219 ],
					"style" : "",
					"text" : "monitor out",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "monitor OUT",
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
					"id" : "obj-64",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 784.0, 202.0, 75.0, 20.0 ],
					"style" : "",
					"text" : "s osc-extout"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-60",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 373.0, 510.0, 55.0, 20.0 ],
					"style" : "",
					"text" : "s osc_in"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-61",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 292.0, 422.0, 77.0, 17.0 ],
					"style" : "",
					"text" : "udpreceive 6666"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-52",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 369.0, 221.0, 73.0, 20.0 ],
					"style" : "",
					"text" : "r osc-extout"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-40",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 156.0, 13.0, 63.0, 20.0 ],
					"style" : "",
					"text" : "r osc-next"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-38",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 238.0, 33.0, 59.0, 20.0 ],
					"style" : "",
					"text" : "r osc-line"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 1.0, 1.0, 1.0, 0.501961 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-57",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 953.0, 346.0, 150.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 38.0, 228.0, 96.0, 20.0 ],
					"style" : "",
					"text" : "Receiving OSC"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 1.0, 1.0, 1.0, 0.501961 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-56",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 951.0, 372.0, 150.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 36.0, 6.0, 140.0, 20.0 ],
					"style" : "",
					"text" : "Sending OSC from VPT"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-32",
					"linecount" : 3,
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 186.0, 428.0, 87.5, 45.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 21.0, 285.0, 155.0, 18.0 ],
					"style" : "",
					"text" : "VPT osc receive port: 6666",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-51",
					"linecount" : 5,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1006.0, 244.0, 150.0, 74.0 ],
					"style" : "",
					"text" : "finne ip adresse\nbruke parametre fra vpt som kontrollere i vpt\nfeks si at loopreport trigger nytt clip etc"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"hint" : "test osc out",
					"id" : "obj-45",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 952.0, 94.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 92.0, 103.0, 34.0, 17.0 ],
					"style" : "",
					"text" : "test",
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
					"id" : "obj-42",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 621.0, 281.0, 79.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 175.0, 30.0, 30.0, 20.0 ],
					"style" : "",
					"text" : "port"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-41",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "bang", "bang", "bang" ],
					"patching_rect" : [ 721.0, 52.0, 46.0, 20.0 ],
					"style" : "",
					"text" : "t b b b"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-39",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 384.0, 281.0, 34.0, 20.0 ],
					"style" : "",
					"text" : "gate"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"hint" : "next line",
					"id" : "obj-35",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 673.0, 14.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 214.0, 79.0, 34.0, 17.0 ],
					"style" : "",
					"text" : "default",
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
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-26",
					"linecount" : 2,
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 445.0, 439.0, 87.5, 31.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 11.0, 77.0, 173.5, 18.0 ],
					"style" : "",
					"text" : "127.0.0.1 6667",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-19",
					"maxclass" : "newobj",
					"numinlets" : 5,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 460.0, 389.0, 127.0, 20.0 ],
					"style" : "",
					"text" : "sprintf %i.%i.%i.%i %i"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"fontsize" : 10.0,
					"hint" : "auto playback of text",
					"id" : "obj-8",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"mode" : 1,
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 416.0, 251.0, 73.078125, 20.199219 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 103.0, 77.078125, 17.199219 ],
					"style" : "",
					"text" : "osc send OFF",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "osc send ON",
					"textoncolor" : [ 1.0, 1.0, 1.0, 1.0 ],
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
					"hint" : "next line",
					"id" : "obj-3",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 640.0, 137.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 217.0, 48.0, 31.0, 17.0 ],
					"style" : "",
					"text" : "use",
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
					"id" : "obj-34",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1141.0, 130.0, 72.0, 20.0 ],
					"style" : "",
					"text" : "r loopreport"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"blinkcolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-33",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"outlinecolor" : [ 0.094118, 0.113725, 0.137255, 0.568627 ],
					"patching_rect" : [ 1044.0, 130.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"blinkcolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-30",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"outlinecolor" : [ 0.094118, 0.113725, 0.137255, 0.568627 ],
					"patching_rect" : [ 887.0, 130.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-21",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1022.0, 155.0, 119.0, 18.0 ],
					"style" : "",
					"text" : "/transitiondone bang",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-22",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1022.0, 99.0, 70.0, 20.0 ],
					"style" : "",
					"text" : "r line_done"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-23",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 870.0, 98.0, 47.0, 18.0 ],
					"style" : "",
					"text" : "r cuetrig"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-24",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 870.0, 155.0, 80.0, 18.0 ],
					"style" : "",
					"text" : "/cuetrig bang",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-54",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 952.0, 155.0, 62.0, 18.0 ],
					"style" : "",
					"text" : "/test $1",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"format" : 6,
					"hint" : "",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-50",
					"maxclass" : "flonum",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 712.0, 130.0, 46.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-43",
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 788.0, 130.0, 51.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-47",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 712.0, 108.0, 52.0, 18.0 ],
					"style" : "",
					"text" : "r oscpres"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-44",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 788.0, 106.0, 60.0, 18.0 ],
					"style" : "",
					"text" : "r sequence"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-25",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 712.0, 155.0, 64.0, 18.0 ],
					"style" : "",
					"text" : "/preset $1",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_autogradient" : 0.79,
					"bgfillcolor_color" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_color1" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgfillcolor_color2" : [ 0.685, 0.685, 0.685, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "gradient",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"gradient" : 0,
					"id" : "obj-9",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 788.0, 155.0, 50.0, 18.0 ],
					"style" : "",
					"text" : "/cue $1",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-18",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 373.0, 385.0, 47.0, 18.0 ],
					"style" : "",
					"text" : "/out1 2"
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
					"patching_rect" : [ 590.0, 33.0, 44.0, 20.0 ],
					"style" : "",
					"text" : "t 6667"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 26.0, 374.0, 61.0, 20.0 ],
					"style" : "",
					"text" : "route text"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "int", "int", "int", "int" ],
					"patching_rect" : [ 449.0, 32.0, 103.0, 20.0 ],
					"style" : "",
					"text" : "unpack 127 0 0 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 449.0, -5.0, 27.0, 20.0 ],
					"style" : "",
					"text" : "r lb"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 480.0, 339.0, 62.0, 20.0 ],
					"style" : "",
					"text" : "route port"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-2",
					"maxclass" : "number",
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 545.0, 278.0, 50.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 162.0, 47.0, 52.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-1",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 480.0, 305.0, 84.0, 20.0 ],
					"style" : "",
					"text" : "pak port 6667"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-29",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 449.0, 221.0, 64.0, 20.0 ],
					"style" : "",
					"text" : "route host"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-31",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 411.0, 66.0, 281.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 29.0, 30.0, 119.0, 20.0 ],
					"style" : "",
					"text" : "ip adress to send to"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-28",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 5,
					"outlettype" : [ "int", "int", "int", "int", "int" ],
					"patching_rect" : [ 416.0, 146.0, 99.0, 20.0 ],
					"style" : "",
					"text" : "unpack 0 0 0 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-27",
					"maxclass" : "newobj",
					"numinlets" : 4,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 373.0, 196.0, 136.0, 20.0 ],
					"style" : "",
					"text" : "sprintf host %i.%i.%i.%i"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-20",
					"maxclass" : "number",
					"maximum" : 255,
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 566.0, 88.0, 50.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 123.0, 47.0, 38.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-17",
					"maxclass" : "number",
					"maximum" : 255,
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 514.0, 88.0, 50.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 84.0, 47.0, 38.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-16",
					"maxclass" : "number",
					"maximum" : 255,
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 463.0, 88.0, 50.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 45.0, 47.0, 38.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-15",
					"maxclass" : "number",
					"maximum" : 255,
					"minimum" : 0,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 412.0, 88.0, 50.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 6.0, 47.0, 38.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-12",
					"maxclass" : "newobj",
					"numinlets" : 5,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 416.0, 116.0, 115.0, 20.0 ],
					"style" : "",
					"text" : "pack host 127 0 0 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-36",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 384.0, 331.0, 108.0, 17.0 ],
					"style" : "",
					"text" : "udpsend 127.0.0.1 6667"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-155",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 213.0, 268.0, 46.0, 17.0 ],
					"style" : "",
					"text" : "wclose"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"hint" : "playback tempo",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-147",
					"maxclass" : "number",
					"minimum" : 30,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 15.0, 122.0, 48.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 288.0, 175.0, 38.0, 18.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ]
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
					"fontsize" : 9.0,
					"hint" : "direction",
					"id" : "obj-145",
					"items" : [ "up", ",", "down", ",", "up&down" ],
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 29.0, 41.0, 57.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 245.0, 175.0, 48.0, 17.0 ],
					"prototypename" : "vpt_umenu",
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textjustification" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-144",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 33.0, 66.0, 69.0, 19.0 ],
					"style" : "",
					"text" : "metro 1000"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"fontsize" : 10.0,
					"hint" : "auto playback of text",
					"id" : "obj-142",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"mode" : 1,
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 107.0, 42.0, 47.078125, 21.199219 ],
					"presentation" : 1,
					"presentation_rect" : [ 205.0, 175.0, 38.078125, 17.199219 ],
					"style" : "",
					"text" : "auto",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "AUTO",
					"textoncolor" : [ 1.0, 1.0, 1.0, 1.0 ],
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
					"hint" : "next line",
					"id" : "obj-139",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 157.0, 43.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 169.0, 175.0, 31.0, 17.0 ],
					"style" : "",
					"text" : "next",
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
					"fontsize" : 11.595187,
					"id" : "obj-137",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "int", "bang" ],
					"patching_rect" : [ 208.0, 156.0, 33.0, 19.0 ],
					"style" : "",
					"text" : "t 0 b"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontsize" : 8.0,
					"hint" : "update and reset counter to start at beginning of text",
					"id" : "obj-136",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 157.0, 69.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 201.0, 198.0, 36.0, 17.0 ],
					"style" : "",
					"text" : "update",
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
					"hint" : "edit text file",
					"id" : "obj-132",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 158.0, 122.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 171.0, 198.0, 29.0, 17.0 ],
					"style" : "",
					"text" : "edit",
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
					"id" : "obj-119",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 50.0, 95.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 238.0, 198.0, 27.0, 17.0 ],
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
					"id" : "obj-120",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 104.0, 95.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 266.0, 198.0, 27.0, 17.0 ],
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
					"fontsize" : 11.595187,
					"id" : "obj-135",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 41.0, 268.0, 36.0, 17.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-133",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 160.0, 364.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-124",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 186.0, 404.0, 32.5, 19.0 ],
					"style" : "",
					"text" : "+ 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-123",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 236.0, 331.0, 32.5, 19.0 ],
					"style" : "",
					"text" : "- 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-122",
					"maxclass" : "newobj",
					"numinlets" : 5,
					"numoutlets" : 4,
					"outlettype" : [ "int", "", "", "int" ],
					"patching_rect" : [ 186.0, 365.0, 73.0, 19.0 ],
					"style" : "",
					"text" : "counter"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-121",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 84.0, 302.0, 56.0, 19.0 ],
					"style" : "",
					"text" : "route set"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-118",
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 149.0, 315.0, 50.0, 19.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-114",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 173.0, 225.0, 43.0, 17.0 ],
					"style" : "",
					"text" : "query"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"hint" : "output text at specified line number",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-115",
					"maxclass" : "number",
					"minimum" : 1,
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 90.0, 132.0, 48.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 143.0, 175.0, 48.0, 18.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"varname" : "number"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-116",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 90.0, 160.0, 54.0, 17.0 ],
					"style" : "",
					"text" : "line $1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-111",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 96.0, 224.0, 35.0, 17.0 ],
					"style" : "",
					"text" : "write"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-112",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 136.0, 225.0, 34.0, 17.0 ],
					"style" : "",
					"text" : "read"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-113",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 54.0, 224.0, 36.0, 17.0 ],
					"style" : "",
					"text" : "clear"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-110",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "bang", "int" ],
					"patching_rect" : [ 84.0, 269.0, 46.0, 19.0 ],
					"style" : "",
					"text" : "text"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-104",
					"keymode" : 1,
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 26.0, 342.0, 129.0, 23.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 14.0, 177.0, 125.0, 41.0 ],
					"style" : "",
					"tabmode" : 0,
					"varname" : "textedit"
				}

			}
, 			{
				"box" : 				{
					"angle" : 0.0,
					"background" : 1,
					"bgcolor" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"id" : "obj-58",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 805.0, 260.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 0.0, 0.0, 328.0, 418.0 ],
					"proportion" : 0.39,
					"rounded" : 0,
					"style" : ""
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-36", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-1", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-6", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-1", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-7", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-104", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-2", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-11", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-104", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-110", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-118", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-110", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-121", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 93.5, 288.0 ],
					"order" : 0,
					"source" : [ "obj-110", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-123", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-110", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-111", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-112", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-113", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-114", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-116", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-115", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-77", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-115", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-116", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-112", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-119", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-28", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-12", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-12", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-111", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-120", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-39", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-121", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-124", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-122", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-122", 4 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-123", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-115", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-124", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-13", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-135", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-132", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-122", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-133", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-135", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-137", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-136", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-114", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-137", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-122", 2 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-137", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-122", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-139", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-14", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-144", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-142", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-122", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-144", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-122", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-145", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-144", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-147", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-15", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-110", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-155", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 2 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-16", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 3 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-17", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-36", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-18", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-26", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-19", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-1", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 4 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-20", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-21", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-21", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-22", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-33", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-22", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-23", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-30", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-23", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-24", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-25", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-36", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-27", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-27", 3 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-28", 4 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-27", 2 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-28", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-27", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-28", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-27", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-28", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-19", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-29", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-3", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-13", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-34", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-41", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-35", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-14", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-37", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-115", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-38", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-36", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-39", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-66", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-39", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-11", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-4", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-46", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 2,
					"source" : [ "obj-4", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-5", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-4", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-139", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-40", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-11", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-41", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-41", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-5", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-41", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-43", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-43", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-44", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-54", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-45", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-8", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-46", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-50", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-47", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-75", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-49", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-15", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-5", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-16", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-5", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-17", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-5", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-20", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-5", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-25", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-50", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-39", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-52", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-54", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-104", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-55", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-68", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-59", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-19", 4 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-6", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-59", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-61", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-60", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-61", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-66", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-65", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-67", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-66", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-59", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-69", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-39", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 0,
					"source" : [ "obj-7", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-80", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"order" : 1,
					"source" : [ "obj-7", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-73", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-71", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-72", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-73", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-71", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-74", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-104", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-75", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-55", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-75", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-39", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-8", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-64", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-9", 0 ]
				}

			}
 ]
	}

}
